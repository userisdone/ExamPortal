
const db = require("../config/db");

// =====================================================
// 1. GET LOGGED-IN STUDENT'S EXAM SCHEDULE
// =====================================================

exports.getMySchedule = async (req, res) => {
    try {
        const userId = req.user.user_id;

        if (req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can access this schedule"
            });
        }

        const [schedules] = await db.query(
    `SELECT
        es.schedule_id,
        e.exam_id,
        e.exam_name,
        e.duration,
        e.total_marks,
        sub.subject_name,
        DATE_FORMAT(es.exam_date, '%Y-%m-%d') AS exam_date,
        es.start_time,
        es.end_time,
        se.student_exam_id,
        se.attempt_status
     FROM Student st
     JOIN Subject sub
        ON sub.course_id = st.course_id
        AND sub.semester = st.current_sem
     JOIN Exam e
        ON e.subject_id = sub.subject_id
     JOIN Exam_Schedule es
        ON es.exam_id = e.exam_id
     LEFT JOIN Student_Exam se
        ON se.schedule_id = es.schedule_id
        AND se.student_id = st.student_id
     WHERE st.user_id = ?
     ORDER BY es.exam_date ASC, es.start_time ASC`,
    [userId]
);

        return res.status(200).json({
            success: true,
            count: schedules.length,
            schedules
        });

    } catch (error) {
        console.error("Student schedule error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch exam schedule"
        });
    }
};


// =====================================================
// 2. GET LOGGED-IN STUDENT PROFILE
// =====================================================

exports.getMyProfile = async (req, res) => {
    try {
        if (req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can access this profile"
            });
        }

        const userId = req.user.user_id;

        const [rows] = await db.query(
            `SELECT
                u.user_id,
                u.full_name,
                u.email,
                s.student_id,
                s.scholar_no,
                s.batch_year,
                s.current_sem,
                c.course_name,

                COALESCE(
                    sem.semester_number,
                    s.current_sem
                ) AS semester_number,

                COALESCE(
                    sem.term_type,
                    CASE
                        WHEN MOD(s.current_sem, 2) = 1
                        THEN 'ODD'
                        ELSE 'EVEN'
                    END
                ) AS term_type

             FROM Student s
             JOIN Users u
                ON u.user_id = s.user_id
             LEFT JOIN Course c
                ON c.course_id = s.course_id
             LEFT JOIN Semester sem
                ON sem.course_id = s.course_id
                AND sem.semester_number = s.current_sem
                AND sem.academic_year_id = (
                    SELECT sem2.academic_year_id
                    FROM Semester sem2
                    JOIN AcademicYear ay
                        ON ay.academic_year_id = sem2.academic_year_id
                    WHERE sem2.course_id = s.course_id
                    AND sem2.semester_number = s.current_sem
                    ORDER BY ay.year_start DESC
                    LIMIT 1
                )
             WHERE s.user_id = ?`,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found"
            });
        }

        const student = rows[0];

        return res.status(200).json({
            success: true,
            profile: {
                user_id: student.user_id,
                student_id: student.student_id,
                full_name: student.full_name,
                email: student.email,
                scholar_no: student.scholar_no,
                batch_year: student.batch_year,

                course: {
                    course_name: student.course_name
                },

                semester: {
                    semester_number: student.semester_number,
                    term_type: student.term_type
                }
            }
        });

    } catch (error) {
        console.error("Student profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch student profile"
        });
    }
};


// =====================================================
// 3. GET LOGGED-IN STUDENT'S PERFORMANCE ANALYTICS
// =====================================================

exports.getPerformanceAnalytics = async (req, res) => {
    try {
        if (req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can access performance analytics"
            });
        }

        const userId = req.user.user_id;

        // Find student ID
        const [studentRows] = await db.query(
            `SELECT student_id
             FROM Student
             WHERE user_id = ?`,
            [userId]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const studentId = studentRows[0].student_id;

        // 1. Overall performance
        const [overallRows] = await db.query(
            `SELECT
                COUNT(r.result_id) AS exams_attempted,

                COALESCE(
                    ROUND(
                        AVG(
                            (r.obtained_marks / NULLIF(e.total_marks, 0)) * 100
                        ), 2
                    ), 0
                ) AS average_score,

                COALESCE(
                    ROUND(
                        MAX(
                            (r.obtained_marks / NULLIF(e.total_marks, 0)) * 100
                        ), 2
                    ), 0
                ) AS highest_score,

                COALESCE(
                    ROUND(
                        SUM(
                            CASE
                                WHEN (r.obtained_marks / NULLIF(e.total_marks, 0)) * 100 >= 40
                                THEN 1
                                ELSE 0
                            END
                        ) * 100.0 / NULLIF(COUNT(r.result_id), 0),
                        2
                    ), 0
                ) AS pass_rate

             FROM Student_Exam se
             JOIN Exam_Schedule es
                ON es.schedule_id = se.schedule_id
             JOIN Exam e
                ON e.exam_id = es.exam_id
             JOIN Result r
                ON r.student_exam_id = se.student_exam_id

             WHERE se.student_id = ?
               AND r.is_published = TRUE`,
            [studentId]
        );

        const overall = overallRows[0];

        // 2. Performance trend
        const [trendRows] = await db.query(
            `SELECT
                e.exam_name AS exam,

                ROUND(
                    (r.obtained_marks / NULLIF(e.total_marks, 0)) * 100,
                    2
                ) AS score,

                es.exam_date

             FROM Student_Exam se
             JOIN Exam_Schedule es
                ON es.schedule_id = se.schedule_id
             JOIN Exam e
                ON e.exam_id = es.exam_id
             JOIN Result r
                ON r.student_exam_id = se.student_exam_id

             WHERE se.student_id = ?
               AND r.is_published = TRUE

             ORDER BY es.exam_date ASC, es.start_time ASC`,
            [studentId]
        );

        // 3. Subject-wise performance
        const [subjectRows] = await db.query(
            `SELECT
                sub.subject_name AS subject,

                ROUND(
                    AVG(
                        (r.obtained_marks / NULLIF(e.total_marks, 0)) * 100
                    ),
                    2
                ) AS score

             FROM Student_Exam se
             JOIN Exam_Schedule es
                ON es.schedule_id = se.schedule_id
             JOIN Exam e
                ON e.exam_id = es.exam_id
             JOIN Subject sub
                ON sub.subject_id = e.subject_id
             JOIN Result r
                ON r.student_exam_id = se.student_exam_id

             WHERE se.student_id = ?
               AND r.is_published = TRUE

             GROUP BY sub.subject_id, sub.subject_name
             ORDER BY score DESC`,
            [studentId]
        );

        // 4. MCQ answer accuracy
        const [accuracyRows] = await db.query(
            `SELECT
                COUNT(*) AS total_questions_answered,

                COALESCE(
                    SUM(
                        CASE
                            WHEN qo.is_correct = TRUE THEN 1
                            ELSE 0
                        END
                    ), 0
                ) AS correct_answers,

                COALESCE(
                    SUM(
                        CASE
                            WHEN sc.selected_option_id IS NOT NULL
                             AND (qo.is_correct = FALSE OR qo.option_id IS NULL)
                            THEN 1
                            ELSE 0
                        END
                    ), 0
                ) AS incorrect_answers,

                COALESCE(
                    SUM(
                        CASE
                            WHEN sc.selected_option_id IS NULL THEN 1
                            ELSE 0
                        END
                    ), 0
                ) AS unanswered

             FROM Student_Exam se
             JOIN Result r
                ON r.student_exam_id = se.student_exam_id
             JOIN Exam_Schedule es
                ON es.schedule_id = se.schedule_id
             JOIN Exam_Question eq
                ON eq.exam_id = es.exam_id
             JOIN Question q
                ON q.question_id = eq.question_id

             LEFT JOIN Scorecard sc
                ON sc.result_id = r.result_id
                AND sc.question_id = q.question_id

             LEFT JOIN Question_Option qo
                ON qo.option_id = sc.selected_option_id

             WHERE se.student_id = ?
               AND r.is_published = TRUE
               AND q.question_type = 'MCQ'`,
            [studentId]
        );

        const accuracy = accuracyRows[0];

        const correct = Number(accuracy.correct_answers || 0);
        const incorrect = Number(accuracy.incorrect_answers || 0);
        const unansweredCount = Number(accuracy.unanswered || 0);

        // 5. Strong and weak subjects
        const strong_areas = subjectRows
            .filter(subject => Number(subject.score) >= 75)
            .map(subject => subject.subject);

        const weak_areas = subjectRows
            .filter(subject => Number(subject.score) < 50)
            .map(subject => subject.subject);

        // 6. Performance summary
        const average = Number(overall.average_score || 0);
        const attempted = Number(overall.exams_attempted || 0);

        let summary;

        if (attempted === 0) {
            summary =
                "You have not completed any published exams yet. Complete an exam to start tracking your academic performance.";
        } else if (average >= 75) {
            summary =
                `Excellent performance! Your average score is ${average}%. Keep maintaining your consistency and continue improving in your subjects.`;
        } else if (average >= 50) {
            summary =
                `You are making steady progress with an average score of ${average}%. Focus on improving weaker subjects to achieve better results.`;
        } else {
            summary =
                `Your current average score is ${average}%. Focus on revising fundamental concepts and practising more questions to improve your performance.`;
        }

        // Send analytics response
        return res.status(200).json({
            success: true,

            analytics: {
                overall: {
                    average_score: Number(overall.average_score),
                    highest_score: Number(overall.highest_score),
                    pass_rate: Number(overall.pass_rate),
                    exams_attempted: Number(overall.exams_attempted),

                    correct_answers: correct,
                    incorrect_answers: incorrect,
                    unanswered: unansweredCount,

                    total_questions_answered: Number(
                        accuracy.total_questions_answered || 0
                    )
                },

                trend: trendRows.map(row => ({
                    exam: row.exam,
                    score: Number(row.score),
                    exam_date: row.exam_date
                })),

                subject_performance: subjectRows.map(subject => ({
                    subject: subject.subject,
                    score: Number(subject.score)
                })),

                strong_areas,
                weak_areas,
                summary
            }
        });

    } catch (error) {
        console.error("Student performance analytics error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch performance analytics"
        });
    }
};


// =====================================================
// 4. GET QUESTIONS FOR AN EXAM
// =====================================================

exports.getExamQuestions = async (req, res) => {
    try {
        if (req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can access exam questions"
            });
        }

        const userId = req.user.user_id;
        const examId = Number(req.params.examId);

        if (!Number.isInteger(examId) || examId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid exam ID"
            });
        }

        // Verify exam belongs to student's course and semester
        const [accessRows] = await db.query(
            `SELECT e.exam_id
             FROM Student st
             JOIN Subject sub
                ON sub.course_id = st.course_id
                AND sub.semester = st.current_sem
             JOIN Exam e
                ON e.subject_id = sub.subject_id
             WHERE st.user_id = ?
               AND e.exam_id = ?`,
            [userId, examId]
        );

        if (accessRows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this exam"
            });
        }

        // Exam_Question has no sequence_no column.
        const [questionRows] = await db.query(
            `SELECT
                q.question_id,
                q.question_text,
                q.question_type,
                q.difficulty,
                q.marks

             FROM Exam_Question eq
             JOIN Question q
                ON q.question_id = eq.question_id

             WHERE eq.exam_id = ?
             ORDER BY q.question_id ASC`,
            [examId]
        );

        if (questionRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No questions found for this exam"
            });
        }

        // Fetch options for all questions
        const questionIds = questionRows.map(
            q => q.question_id
        );

        const placeholders = questionIds
            .map(() => "?")
            .join(",");

        const [optionRows] = await db.query(
            `SELECT
                option_id,
                question_id,
                option_text

             FROM Question_Option
             WHERE question_id IN (${placeholders})`,
            questionIds
        );

        // Attach options and randomize them
        const questionsWithOptions = questionRows.map(q => {
            const questionOptions = optionRows.filter(
                option =>
                    Number(option.question_id) === Number(q.question_id)
            );

            // Fisher-Yates shuffle for options
            for (let i = questionOptions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));

                [questionOptions[i], questionOptions[j]] =
                    [questionOptions[j], questionOptions[i]];
            }

            return {
                ...q,
                options: questionOptions
            };
        });

        // Shuffle questions
        for (let i = questionsWithOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));

            [questionsWithOptions[i], questionsWithOptions[j]] =
                [questionsWithOptions[j], questionsWithOptions[i]];
        }

        const questions = questionsWithOptions.map((q, index) => ({
            ...q,
            display_order: index + 1
        }));

        return res.status(200).json({
            success: true,
            count: questions.length,
            questions
        });

    } catch (error) {
        console.error("Get exam questions error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch exam questions"
        });
    }
};


// =====================================================
// 5. START OR RESUME AN EXAM
// =====================================================

exports.startExam = async (req, res) => {
    try {
        if (req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can start exams"
            });
        }

        const userId = req.user.user_id;
        const scheduleId = Number(req.params.scheduleId);

        if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid schedule ID"
            });
        }

        // Verify student and schedule eligibility
        const [rows] = await db.query(
            `SELECT
                st.student_id,
                es.schedule_id

             FROM Student st
             JOIN Subject sub
                ON sub.course_id = st.course_id
                AND sub.semester = st.current_sem
             JOIN Exam e
                ON e.subject_id = sub.subject_id
             JOIN Exam_Schedule es
                ON es.exam_id = e.exam_id

             WHERE st.user_id = ?
               AND es.schedule_id = ?`,
            [userId, scheduleId]
        );

        if (rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to start this exam"
            });
        }

        const studentId = rows[0].student_id;

        // Check existing attempt
        const [existingRows] = await db.query(
            `SELECT *
             FROM Student_Exam
             WHERE student_id = ?
               AND schedule_id = ?`,
            [studentId, scheduleId]
        );

        if (existingRows.length > 0) {
            const existing = existingRows[0];

            if (existing.attempt_status !== "IN_PROGRESS") {
                return res.status(400).json({
                    success: false,
                    message: "This exam has already been submitted"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Resuming existing exam",
                studentExam: existing
            });
        }

        // Create new attempt
        const [insertResult] = await db.query(
            `INSERT INTO Student_Exam
                (student_id, schedule_id, attempt_status, attempt_start)
             VALUES (?, ?, 'IN_PROGRESS', NOW())`,
            [studentId, scheduleId]
        );

        const [attemptRows] = await db.query(
            `SELECT *
             FROM Student_Exam
             WHERE student_exam_id = ?`,
            [insertResult.insertId]
        );

        return res.status(201).json({
            success: true,
            message: "Exam started successfully",
            studentExam: attemptRows[0]
        });

    } catch (error) {
        console.error("Start exam error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to start exam"
        });
    }
};


// =====================================================
// 6. SUBMIT EXAM AND CALCULATE RESULT
// =====================================================

// exports.submitExam = async (req, res) => {
//     let connection;

//     try {
//         if (req.user.role !== "STUDENT") {
//             return res.status(403).json({
//                 success: false,
//                 message: "Only students can submit exams"
//             });
//         }

//         const userId = req.user.user_id;
//         const studentExamId = Number(req.params.studentExamId);
//         const answers = req.body.answers;

//         if (!Number.isInteger(studentExamId) || studentExamId <= 0) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid student exam ID"
//             });
//         }

//         if (!Array.isArray(answers)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Answers must be provided as an array"
//             });
//         }

//         connection = await db.getConnection();

//         await connection.beginTransaction();

//         // Lock attempt to prevent concurrent submissions
//         const [attemptRows] = await connection.query(
//             `SELECT
//                 se.student_exam_id,
//                 se.student_id,
//                 se.schedule_id,
//                 se.attempt_status,
//                 es.exam_id,
//                 e.total_marks

//              FROM Student_Exam se
//              JOIN Student st
//                 ON st.student_id = se.student_id
//              JOIN Exam_Schedule es
//                 ON es.schedule_id = se.schedule_id
//              JOIN Exam e
//                 ON e.exam_id = es.exam_id

//              WHERE se.student_exam_id = ?
//                AND st.user_id = ?

//              FOR UPDATE`,
//             [studentExamId, userId]
//         );

//         if (attemptRows.length === 0) {
//             await connection.rollback();

//             return res.status(404).json({
//                 success: false,
//                 message: "Exam attempt not found"
//             });
//         }

//         const attempt = attemptRows[0];

//         if (attempt.attempt_status !== "IN_PROGRESS") {
//             await connection.rollback();

//             return res.status(400).json({
//                 success: false,
//                 message: "This exam has already been submitted"
//             });
//         }

//         const totalMarks = Number(attempt.total_marks);

//         if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
//             await connection.rollback();

//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid total marks configured for this exam"
//             });
//         }

//         // Get all questions belonging to this exam
//         const [questionRows] = await connection.query(
//             `SELECT
//                 q.question_id,
//                 q.question_type,
//                 q.marks

//              FROM Exam_Question eq
//              JOIN Question q
//                 ON q.question_id = eq.question_id

//              WHERE eq.exam_id = ?`,
//             [attempt.exam_id]
//         );

//         if (questionRows.length === 0) {
//             await connection.rollback();

//             return res.status(400).json({
//                 success: false,
//                 message: "This exam has no questions"
//             });
//         }

//         // Theory answers cannot currently be saved because
//         // Scorecard does not have a written_answer column.
//         const hasTheoryQuestions = questionRows.some(
//             q => q.question_type === "THEORY"
//         );

//         if (hasTheoryQuestions) {
//             await connection.rollback();

//             return res.status(400).json({
//                 success: false,
//                 message: "This exam contains theory questions. Written-answer submission is not configured yet."
//             });
//         }

//         const questionMap = new Map(
//             questionRows.map(q => [
//                 Number(q.question_id),
//                 q
//             ])
//         );

//         const answerMap = new Map();

//         // Validate submitted question IDs and duplicates
//         for (const answer of answers) {
//             const questionId = Number(answer.question_id);

//             if (!questionMap.has(questionId)) {
//                 await connection.rollback();

//                 return res.status(400).json({
//                     success: false,
//                     message: `Question ${answer.question_id} does not belong to this exam`
//                 });
//             }

//             if (answerMap.has(questionId)) {
//                 await connection.rollback();

//                 return res.status(400).json({
//                     success: false,
//                     message: `Duplicate answer for question ${questionId}`
//                 });
//             }

//             answerMap.set(questionId, answer);
//         }

//         let obtainedMarks = 0;
//         const scorecards = [];

//         // Evaluate every question, including unanswered ones
//         for (const question of questionRows) {
//             const questionId = Number(question.question_id);
//             const answer = answerMap.get(questionId);

//             let selectedOptionId = null;
//             let marksObtained = 0;

//             if (
//                 answer &&
//                 answer.selected_option_id !== null &&
//                 answer.selected_option_id !== undefined &&
//                 answer.selected_option_id !== ""
//             ) {
//                 selectedOptionId = Number(
//                     answer.selected_option_id
//                 );

//                 if (
//                     !Number.isInteger(selectedOptionId) ||
//                     selectedOptionId <= 0
//                 ) {
//                     await connection.rollback();

//                     return res.status(400).json({
//                         success: false,
//                         message: `Invalid option for question ${questionId}`
//                     });
//                 }

//                 // Verify option belongs to this question
//                 const [optionRows] = await connection.query(
//                     `SELECT
//                         option_id,
//                         is_correct

//                      FROM Question_Option
//                      WHERE option_id = ?
//                        AND question_id = ?`,
//                     [selectedOptionId, questionId]
//                 );

//                 if (optionRows.length === 0) {
//                     await connection.rollback();

//                     return res.status(400).json({
//                         success: false,
//                         message: `Selected option does not belong to question ${questionId}`
//                     });
//                 }

//                 if (Boolean(optionRows[0].is_correct)) {
//                     marksObtained = Number(question.marks);
//                 }
//             }

//             obtainedMarks += marksObtained;

//             scorecards.push({
//                 question_id: questionId,
//                 selected_option_id: selectedOptionId,
//                 marks_obtained: marksObtained
//             });
//         }

//         // Create result
//         const [resultInsert] = await connection.query(
//             `INSERT INTO Result
//                 (student_exam_id, obtained_marks, is_published)
//              VALUES (?, ?, FALSE)`,
//             [studentExamId, obtainedMarks]
//         );

//         const resultId = resultInsert.insertId;

//         // Save one scorecard row per question
//         for (const scorecard of scorecards) {
//             await connection.query(
//                 `INSERT INTO Scorecard
//                     (result_id, question_id, selected_option_id, marks_obtained)
//                  VALUES (?, ?, ?, ?)`,
//                 [
//                     resultId,
//                     scorecard.question_id,
//                     scorecard.selected_option_id,
//                     scorecard.marks_obtained
//                 ]
//             );
//         }

//         // Mark attempt as submitted
//         await connection.query(
//             `UPDATE Student_Exam
//              SET attempt_status = 'SUBMITTED',
//                  attempt_end = NOW()
//              WHERE student_exam_id = ?`,
//             [studentExamId]
//         );

//         await connection.commit();

//         return res.status(200).json({
//             success: true,
//             message: "Exam submitted successfully",

//             result: {
//                 result_id: resultId,
//                 student_exam_id: studentExamId,
//                 obtained_marks: obtainedMarks,
//                 total_marks: totalMarks,

//                 percentage: Number(
//                     ((obtainedMarks / totalMarks) * 100).toFixed(2)
//                 ),

//                 is_published: false
//             }
//         });

//     } catch (error) {
//         if (connection) {
//             await connection.rollback();
//         }

//         console.error("Submit exam error:", error);

//         return res.status(500).json({
//             success: false,
//             message: "Unable to submit exam"
//         });

//     } finally {
//         if (connection) {
//             connection.release();
//         }
//     }
// };


exports.submitExam = async (req, res) => {
    let connection;

    try {
        if (req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can submit exams"
            });
        }

        const userId = req.user.user_id;
        const studentExamId = Number(req.params.studentExamId);
        const answers = req.body.answers;

        if (!Number.isInteger(studentExamId) || studentExamId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid student exam ID"
            });
        }

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: "Answers must be provided as an array"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Verify and lock student's exam attempt
        const [attemptRows] = await connection.query(
            `SELECT
                se.student_exam_id,
                se.student_id,
                se.schedule_id,
                se.attempt_status,
                es.exam_id,
                e.total_marks
             FROM Student_Exam se
             JOIN Student st
                ON st.student_id = se.student_id
             JOIN Exam_Schedule es
                ON es.schedule_id = se.schedule_id
             JOIN Exam e
                ON e.exam_id = es.exam_id
             WHERE se.student_exam_id = ?
               AND st.user_id = ?
             FOR UPDATE`,
            [studentExamId, userId]
        );

        if (attemptRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Exam attempt not found"
            });
        }

        const attempt = attemptRows[0];

        if (attempt.attempt_status !== "IN_PROGRESS") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This exam has already been submitted"
            });
        }

        const totalMarks = Number(attempt.total_marks);

        if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Invalid total marks configured for this exam"
            });
        }

        // 2. Fetch all exam questions
        const [questionRows] = await connection.query(
            `SELECT
                q.question_id,
                q.question_type,
                q.marks
             FROM Exam_Question eq
             JOIN Question q
                ON q.question_id = eq.question_id
             WHERE eq.exam_id = ?`,
            [attempt.exam_id]
        );

        if (questionRows.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This exam has no questions"
            });
        }

        const questionMap = new Map(
            questionRows.map(q => [
                Number(q.question_id),
                q
            ])
        );

        // 3. Validate submitted answers
        const answerMap = new Map();

        for (const answer of answers) {
            const questionId = Number(answer.question_id);

            if (!questionMap.has(questionId)) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: `Question ${answer.question_id} does not belong to this exam`
                });
            }

            if (answerMap.has(questionId)) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: `Duplicate answer for question ${questionId}`
                });
            }

            answerMap.set(questionId, answer);
        }

        // 4. Evaluate MCQs and store theory answers
        let obtainedMarks = 0;
        const scorecards = [];

        for (const question of questionRows) {
            const questionId = Number(question.question_id);
            const answer = answerMap.get(questionId);

            let selectedOptionId = null;
            let writtenAnswer = null;
            let marksObtained = 0;

            // THEORY QUESTION
            if (question.question_type === "THEORY") {

                if (
                    answer?.selected_option_id !== null &&
                    answer?.selected_option_id !== undefined &&
                    answer?.selected_option_id !== ""
                ) {
                    await connection.rollback();

                    return res.status(400).json({
                        success: false,
                        message: `Theory question ${questionId} cannot have an MCQ option`
                    });
                }

                writtenAnswer =
                    typeof answer?.written_answer === "string" &&
                    answer.written_answer.trim()
                        ? answer.written_answer.trim()
                        : null;

                // Teacher will evaluate this answer later.
                marksObtained = 0;
            }

            // MCQ QUESTION
            else if (question.question_type === "MCQ") {

                if (
                    answer &&
                    answer.selected_option_id !== null &&
                    answer.selected_option_id !== undefined &&
                    answer.selected_option_id !== ""
                ) {
                    selectedOptionId = Number(
                        answer.selected_option_id
                    );

                    if (
                        !Number.isInteger(selectedOptionId) ||
                        selectedOptionId <= 0
                    ) {
                        await connection.rollback();

                        return res.status(400).json({
                            success: false,
                            message: `Invalid option for question ${questionId}`
                        });
                    }

                    // Verify that the selected option belongs to this question.
                    const [optionRows] = await connection.query(
                        `SELECT option_id, is_correct
                         FROM Question_Option
                         WHERE option_id = ?
                           AND question_id = ?`,
                        [selectedOptionId, questionId]
                    );

                    if (optionRows.length === 0) {
                        await connection.rollback();

                        return res.status(400).json({
                            success: false,
                            message: `Selected option does not belong to question ${questionId}`
                        });
                    }

                    if (Boolean(optionRows[0].is_correct)) {
                        marksObtained = Number(question.marks);
                    }
                }
            }

            obtainedMarks += marksObtained;

            scorecards.push({
                question_id: questionId,
                selected_option_id: selectedOptionId,
                written_answer: writtenAnswer,
                marks_obtained: marksObtained
            });
        }

        // 5. Create result
        const [resultInsert] = await connection.query(
            `INSERT INTO Result
                (student_exam_id, obtained_marks, is_published)
             VALUES (?, ?, FALSE)`,
            [studentExamId, obtainedMarks]
        );

        const resultId = resultInsert.insertId;

        // 6. Save MCQ and THEORY answers in Scorecard
        for (const scorecard of scorecards) {
            await connection.query(
                `INSERT INTO Scorecard
                    (
                        result_id,
                        question_id,
                        selected_option_id,
                        written_answer,
                        marks_obtained
                    )
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    resultId,
                    scorecard.question_id,
                    scorecard.selected_option_id,
                    scorecard.written_answer,
                    scorecard.marks_obtained
                ]
            );
        }

        // 7. Mark exam as submitted
        await connection.query(
            `UPDATE Student_Exam
             SET attempt_status = 'SUBMITTED',
                 attempt_end = NOW()
             WHERE student_exam_id = ?`,
            [studentExamId]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Exam submitted successfully",
            result: {
                result_id: resultId,
                student_exam_id: studentExamId,
                obtained_marks: obtainedMarks,
                total_marks: totalMarks,
                percentage: Number(
                    ((obtainedMarks / totalMarks) * 100).toFixed(2)
                ),
                is_published: false
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Submit exam error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to submit exam"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// =====================================================
// 7. GET LOGGED-IN STUDENT'S PUBLISHED RESULTS
// =====================================================

exports.getMyResults = async (req, res) => {
    try {
        if (req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can access results"
            });
        }

        const userId = req.user.user_id;

        const [results] = await db.query(
            `SELECT
                r.result_id,
                r.student_exam_id,
                r.obtained_marks,
                r.is_published,

                se.attempt_end,

                es.exam_date,

                e.exam_name,
                e.total_marks,

                sub.subject_name,

                ROUND(
                    (r.obtained_marks / NULLIF(e.total_marks, 0)) * 100,
                    2
                ) AS percentage

             FROM Result r

             JOIN Student_Exam se
                ON se.student_exam_id = r.student_exam_id

             JOIN Student st
                ON st.student_id = se.student_id

             JOIN Exam_Schedule es
                ON es.schedule_id = se.schedule_id

             JOIN Exam e
                ON e.exam_id = es.exam_id

             JOIN Subject sub
                ON sub.subject_id = e.subject_id

             WHERE st.user_id = ?
               AND r.is_published = TRUE

             ORDER BY se.attempt_end DESC`,
            [userId]
        );

        const formattedResults = results.map(r => ({
            ...r,

            exam: {
                exam_name: r.exam_name,
                total_marks: Number(r.total_marks)
            },

            subject: {
                subject_name: r.subject_name
            },

            obtained_marks: Number(r.obtained_marks),
            percentage: Number(r.percentage || 0)
        }));

        return res.status(200).json({
            success: true,
            count: formattedResults.length,
            results: formattedResults
        });

    } catch (error) {
        console.error("Get student results error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch student results"
        });
    }
};


// =====================================================
// 8. GET QUESTION-WISE SCORECARD
// =====================================================

exports.getMyScorecard = async (req, res) => {
    try {
        if (req.user.role !== "STUDENT") {
            return res.status(403).json({
                success: false,
                message: "Only students can access scorecards"
            });
        }

        const userId = req.user.user_id;
        const resultId = Number(req.params.resultId);

        if (!Number.isInteger(resultId) || resultId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid result ID"
            });
        }

        // Verify that this published result belongs to the logged-in student.
        const [resultRows] = await db.query(
            `SELECT r.result_id

             FROM Result r

             JOIN Student_Exam se
                ON se.student_exam_id = r.student_exam_id

             JOIN Student st
                ON st.student_id = se.student_id

             WHERE r.result_id = ?
               AND st.user_id = ?
               AND r.is_published = TRUE`,
            [resultId, userId]
        );

        if (resultRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Published result not found"
            });
        }

        // Fetch question-wise answers and correct options.
        const [scorecards] = await db.query(
            `SELECT
                sc.scorecard_id,
                sc.result_id,
                sc.question_id,
                sc.selected_option_id,
                sc.written_answer,
                sc.marks_obtained,

                q.question_text,
                q.question_type,
                q.marks,

                selected.option_text AS selected_option_text,
                correct.option_id AS correct_option_id,
                correct.option_text AS correct_option_text

             FROM Scorecard sc

             JOIN Question q
                ON q.question_id = sc.question_id

             LEFT JOIN Question_Option selected
                ON selected.option_id = sc.selected_option_id

             LEFT JOIN Question_Option correct
                ON correct.question_id = q.question_id
                AND correct.is_correct = TRUE

             WHERE sc.result_id = ?

             ORDER BY q.question_id ASC`,
            [resultId]
        );

        const formattedScorecards = scorecards.map(sc => ({
            scorecard_id: sc.scorecard_id,
            result_id: sc.result_id,
            question_id: sc.question_id,
            selected_option_id: sc.selected_option_id,
            written_answer: sc.written_answer,
            marks_obtained: Number(sc.marks_obtained),

            question: {
                question_text: sc.question_text,
                question_type: sc.question_type,
                marks: Number(sc.marks)
            },

            selected_option: sc.selected_option_id
                ? {
                    option_id: sc.selected_option_id,
                    option_text: sc.selected_option_text
                }
                : null,

            correct_option: sc.correct_option_id
                ? {
                    option_id: sc.correct_option_id,
                    option_text: sc.correct_option_text
                }
                : null
        }));

        return res.status(200).json({
            success: true,
            count: formattedScorecards.length,
            scorecard: formattedScorecards
        });

    } catch (error) {
        console.error("Get student scorecard error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch scorecard"
        });
    }
};
