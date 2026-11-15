
const db = require("../config/db");

// Find the teacher linked to the logged-in user
const getTeacherId = async (userId) => {
    const [rows] = await db.query(
        "SELECT teacher_id FROM Teacher WHERE user_id = ?",
        [userId]
    );

    return rows.length ? rows[0].teacher_id : null;
};

// Check whether a subject belongs to this teacher
const isAssignedSubject = async (teacherId, subjectId) => {
    const [rows] = await db.query(
        `SELECT subject_id FROM Subject
         WHERE subject_id = ? AND teacher_id = ?`,
        [subjectId, teacherId]
    );

    return rows.length > 0;
};

// GET ASSIGNED SUBJECTS
exports.getAssignedSubjects = async (req, res) => {
    try {
        const teacherId = await getTeacherId(req.user.user_id);

        if (!teacherId) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found"
            });
        }

        const [subjects] = await db.query(
            `SELECT subject_id, subject_name, course_id, semester
             FROM Subject
             WHERE teacher_id = ?
             ORDER BY subject_name`,
            [teacherId]
        );

        res.json({ success: true, subjects });

    } catch (error) {
        console.error("Assigned subjects error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// GET QUESTIONS
exports.getQuestions = async (req, res) => {
    try {
        const teacherId = await getTeacherId(req.user.user_id);

        if (!teacherId) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found"
            });
        }

        const [questions] = await db.query(
            `SELECT q.question_id, q.subject_id, q.question_text,
                    q.marks, q.question_type, q.difficulty,
                    s.subject_name
             FROM Question q
             JOIN Subject s ON q.subject_id = s.subject_id
             WHERE s.teacher_id = ?
             ORDER BY q.question_id DESC`,
            [teacherId]
        );

        if (questions.length > 0) {
            const ids = questions.map(q => q.question_id);
            const placeholders = ids.map(() => "?").join(",");

           
                const [options] = await db.query(
                `SELECT option_id, question_id, option_text, is_correct
                FROM Question_Option
                WHERE question_id IN (${placeholders})
                ORDER BY option_id`,
                [...ids]
                );
    

            questions.forEach(q => {
                q.options = options.filter(
                    opt => opt.question_id === q.question_id
                );
            });
        }

        res.json({ success: true, questions });

    } catch (error) {
        console.error("Get questions error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ADD QUESTION
exports.createQuestion = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const teacherId = await getTeacherId(req.user.user_id);

        if (!teacherId) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found"
            });
        }

        const {
            question_text,
            subject_id,
            marks,
            question_type,
            difficulty,
            options
        } = req.body;

        if (!question_text?.trim() || !subject_id || !marks) {
            return res.status(400).json({
                success: false,
                message: "Question, subject and marks are required"
            });
        }

        if (!["MCQ", "THEORY"].includes(question_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question type"
            });
        }

        if (!["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
            return res.status(400).json({
                success: false,
                message: "Invalid difficulty"
            });
        }

        if (question_type === "MCQ") {
            if (!Array.isArray(options) || options.length < 2 ||
                options.some(o => !o.option_text?.trim()) ||
                options.filter(o => o.is_correct).length !== 1) {
                return res.status(400).json({
                    success: false,
                    message: "MCQ requires at least 2 options and exactly 1 correct answer"
                });
            }
        }

        if (!(await isAssignedSubject(teacherId, subject_id))) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this subject"
            });
        }

        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO Question
             (subject_id, question_text, marks, question_type, difficulty)
             VALUES (?, ?, ?, ?, ?)`,
            [
                subject_id,
                question_text.trim(),
                marks,
                question_type,
                difficulty
            ]
        );

        const questionId = result.insertId;

        if (question_type === "MCQ") {
            for (const option of options) {
                await connection.query(
                    `INSERT INTO Question_Option
                     (question_id, option_text, is_correct)
                     VALUES (?, ?, ?)`,
                    [questionId, option.option_text.trim(), option.is_correct ? 1 : 0]
                );
            }
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Question added successfully",
            question_id: questionId
        });

    } catch (error) {
        await connection.rollback();
        console.error("Create question error:", error);
        res.status(500).json({ success: false, message: "Could not add question" });

    } finally {
        connection.release();
    }
};

// UPDATE QUESTION
exports.updateQuestion = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const teacherId = await getTeacherId(req.user.user_id);
        const questionId = req.params.id;

        if (!teacherId) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found"
            });
        }

        const {
            question_text,
            subject_id,
            marks,
            question_type,
            difficulty,
            options
        } = req.body;

        if (!question_text?.trim() || !subject_id || !marks) {
            return res.status(400).json({
                success: false,
                message: "Question, subject and marks are required"
            });
        }

        if (!["MCQ", "THEORY"].includes(question_type) ||
            !["EASY", "MEDIUM", "HARD"].includes(difficulty)) {
            return res.status(400).json({
                success: false,
                message: "Invalid question type or difficulty"
            });
        }

        if (question_type === "MCQ") {
            if (!Array.isArray(options) || options.length < 2 ||
                options.some(o => !o.option_text?.trim()) ||
                options.filter(o => o.is_correct).length !== 1) {
                return res.status(400).json({
                    success: false,
                    message: "MCQ requires at least 2 options and exactly 1 correct answer"
                });
            }
        }

        const [existing] = await db.query(
            `SELECT q.question_id
             FROM Question q
             JOIN Subject s ON q.subject_id = s.subject_id
             WHERE q.question_id = ? AND s.teacher_id = ?`,
            [questionId, teacherId]
        );

        if (!existing.length ||
            !(await isAssignedSubject(teacherId, subject_id))) {
            return res.status(403).json({
                success: false,
                message: "Question or subject not found for this teacher"
            });
        }

        await connection.beginTransaction();

        await connection.query(
            `UPDATE Question
             SET subject_id = ?, question_text = ?, marks = ?,
                 question_type = ?, difficulty = ?
             WHERE question_id = ?`,
            [
                subject_id,
                question_text.trim(),
                marks,
                question_type,
                difficulty,
                questionId
            ]
        );

        await connection.query(
            "DELETE FROM Question_Option WHERE question_id = ?",
            [questionId]
        );

        if (question_type === "MCQ") {
            for (const option of options) {
                await connection.query(
                    `INSERT INTO Question_Option
                     (question_id, option_text, is_correct)
                     VALUES (?, ?, ?)`,
                    [questionId, option.option_text.trim(), option.is_correct ? 1 : 0]
                );
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: "Question updated successfully"
        });

    } catch (error) {
        await connection.rollback();
        console.error("Update question error:", error);
        res.status(500).json({ success: false, message: "Could not update question" });

    } finally {
        connection.release();
    }
};

// DELETE QUESTION
exports.deleteQuestion = async (req, res) => {
    try {
        const teacherId = await getTeacherId(req.user.user_id);
        const questionId = req.params.id;

        if (!teacherId) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found"
            });
        }

        const [existing] = await db.query(
            `SELECT q.question_id
             FROM Question q
             JOIN Subject s ON q.subject_id = s.subject_id
             WHERE q.question_id = ? AND s.teacher_id = ?`,
            [questionId, teacherId]
        );

        if (!existing.length) {
            return res.status(404).json({
                success: false,
                message: "Question not found"
            });
        }

        await db.query(
            "DELETE FROM Question WHERE question_id = ?",
            [questionId]
        );

        res.json({
            success: true,
            message: "Question deleted successfully"
        });

    } catch (error) {
        console.error("Delete question error:", error);
        res.status(500).json({
            success: false,
            message: "Could not delete question. It may be linked to an exam."
        });
    }
};

// GET TEACHER DASHBOARD STATISTICS
exports.getDashboardStats = async (req, res) => {
    try {
        const teacherId = await getTeacherId(req.user.user_id);

        if (!teacherId) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found"
            });
        }

        // Count assigned subjects
        const [subjectRows] = await db.query(
            `SELECT COUNT(*) AS total
             FROM Subject
             WHERE teacher_id = ?`,
            [teacherId]
        );

        // Count questions belonging to teacher's subjects
        const [questionRows] = await db.query(
            `SELECT COUNT(*) AS total
             FROM Question q
             JOIN Subject s ON q.subject_id = s.subject_id
             WHERE s.teacher_id = ?`,
            [teacherId]
        );

        // Count exams belonging to teacher's subjects
        const [examRows] = await db.query(
            `SELECT COUNT(*) AS total
             FROM Exam e
             JOIN Subject s ON e.subject_id = s.subject_id
             WHERE s.teacher_id = ?`,
            [teacherId]
        );

        res.json({
            success: true,
            stats: {
                subjects: subjectRows[0].total,
                questionBank: questionRows[0].total,
                activeExams: examRows[0].total,
                pendingEvaluations: 0
            }
        });

    } catch (error) {
        console.error("Dashboard statistics error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load dashboard statistics"
        });
    }
};
// CREATE EXAM
exports.createExam = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const teacherId = await getTeacherId(req.user.user_id);

        if (!teacherId) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found"
            });
        }

        const {
            exam_name,
            subject_id,
            duration,
            total_marks
        } = req.body;

        const questionIds = req.body.questionIds;
        const scheduleData = req.body.scheduleData;

        // Validate exam details
        if (
            !exam_name?.trim() ||
            !Number.isInteger(Number(subject_id)) ||
            !Number.isInteger(Number(duration)) ||
            Number(duration) <= 0 ||
            !Number.isFinite(Number(total_marks)) ||
            Number(total_marks) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid exam name, subject, duration and total marks are required"
            });
        }

        if (!Array.isArray(questionIds) || questionIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Select at least one question"
            });
        }

        // Check that the subject belongs to this teacher
        if (!(await isAssignedSubject(teacherId, Number(subject_id)))) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this subject"
            });
        }

        // Check that all selected questions belong to this subject
        const uniqueQuestionIds = [...new Set(questionIds.map(Number))];

        if (
            uniqueQuestionIds.some(id => !Number.isInteger(id) || id <= 0) ||
            uniqueQuestionIds.length !== questionIds.length
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or duplicate question IDs"
            });
        }

        const placeholders = uniqueQuestionIds.map(() => "?").join(",");

        const [questions] = await db.query(
            `SELECT question_id
             FROM Question
             WHERE subject_id = ?
             AND question_id IN (${placeholders})`,
            [Number(subject_id), ...uniqueQuestionIds]
        );

        if (questions.length !== uniqueQuestionIds.length) {
            return res.status(400).json({
                success: false,
                message: "Some selected questions do not belong to this subject"
            });
        }

        // Validate schedule if provided
        if (
            scheduleData &&
            (!scheduleData.exam_date ||
             !scheduleData.start_time ||
             !scheduleData.end_time)
        ) {
            return res.status(400).json({
                success: false,
                message: "Exam date, start time and end time are required"
            });
        }

        await connection.beginTransaction();

        // 1. Insert exam
        const [examResult] = await connection.query(
            `INSERT INTO Exam
             (subject_id, exam_name, duration, total_marks)
             VALUES (?, ?, ?, ?)`,
            [
                Number(subject_id),
                exam_name.trim(),
                Number(duration),
                Number(total_marks)
            ]
        );

        const examId = examResult.insertId;

        // 2. Insert selected questions
        for (const questionId of uniqueQuestionIds) {
            await connection.query(
                `INSERT INTO Exam_Question (exam_id, question_id)
                 VALUES (?, ?)`,
                [examId, questionId]
            );
        }

        // 3. Insert exam schedule if provided
        let scheduleId = null;

        if (scheduleData) {
            const [scheduleResult] = await connection.query(
                `INSERT INTO Exam_Schedule
                 (exam_id, exam_date, start_time, end_time)
                 VALUES (?, ?, ?, ?)`,
                [
                    examId,
                    scheduleData.exam_date,
                    scheduleData.start_time,
                    scheduleData.end_time
                ]
            );

            scheduleId = scheduleResult.insertId;
        }

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: "Exam created successfully",
            exam_id: examId,
            schedule_id: scheduleId
        });

    } catch (error) {
        await connection.rollback();

        console.error("Create exam error:", error);

        return res.status(500).json({
            success: false,
            message: "Could not create exam"
        });

    } finally {
        connection.release();
    }
};
// GET TEACHER EXAMS
exports.getExams = async (req, res) => {
    try {
        const teacherId = await getTeacherId(req.user.user_id);

        if (!teacherId) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found"
            });
        }

        const [rows] = await db.query(
            `SELECT
                e.exam_id,
                e.exam_name,
                e.subject_id,
                e.duration,
                e.total_marks,
                s.subject_name,
                es.schedule_id,
                es.exam_date,
                es.start_time,
                es.end_time
             FROM Exam e
             JOIN Subject s ON e.subject_id = s.subject_id
             LEFT JOIN Exam_Schedule es ON e.exam_id = es.exam_id
             WHERE s.teacher_id = ?
             ORDER BY e.exam_id DESC`,
            [teacherId]
        );

        const exams = rows.map(row => ({
            exam_id: row.exam_id,
            exam_name: row.exam_name,
            subject_id: row.subject_id,
            duration: row.duration,
            total_marks: row.total_marks,

            subject: {
                subject_id: row.subject_id,
                subject_name: row.subject_name
            },

            schedule: row.schedule_id ? {
                schedule_id: row.schedule_id,
                exam_date: row.exam_date,
                start_time: row.start_time,
                end_time: row.end_time
            } : null
        }));

        return res.json({
            success: true,
            exams
        });

    } catch (error) {
        console.error("Get teacher exams error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch exams"
        });
    }
};

// GET REAL RESULTS FOR AN EXAM
exports.getExamResults = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.user_id);
    const examId = Number(req.params.examId);

    if (!teacherId) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found"
      });
    }

    if (!Number.isInteger(examId) || examId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID"
      });
    }

    const [rows] = await db.query(
      `SELECT
          r.result_id,
          r.obtained_marks,
          r.is_published,
          se.student_exam_id,
          st.student_id,
          st.scholar_no,
          u.full_name AS student_name,
          e.total_marks,
          ROUND(
            (r.obtained_marks / NULLIF(e.total_marks, 0)) * 100,
            2
          ) AS percentage
       FROM Result r
       JOIN Student_Exam se
         ON r.student_exam_id = se.student_exam_id
       JOIN Student st
         ON se.student_id = st.student_id
       JOIN Users u
         ON st.user_id = u.user_id
       JOIN Exam_Schedule es
         ON se.schedule_id = es.schedule_id
       JOIN Exam e
         ON es.exam_id = e.exam_id
       JOIN Subject s
         ON e.subject_id = s.subject_id
       WHERE e.exam_id = ?
         AND s.teacher_id = ?
       ORDER BY u.full_name ASC`,
      [examId, teacherId]
    );

    const results = rows.map(row => ({
      ...row,
      is_published: Boolean(row.is_published),
      result_status:
        Number(row.percentage) >= 40 ? "PASS" : "FAIL"
    }));

    return res.json({
      success: true,
      results
    });

  } catch (error) {
    console.error("Get exam results error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch exam results"
    });
  }
};


// PUBLISH A REAL RESULT
exports.publishResult = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req.user.user_id);
    const resultId = Number(req.params.resultId);

    if (!teacherId) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found"
      });
    }

    if (!Number.isInteger(resultId) || resultId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid result ID"
      });
    }

    const [rows] = await db.query(
      `SELECT r.result_id
       FROM Result r
       JOIN Student_Exam se
         ON r.student_exam_id = se.student_exam_id
       JOIN Exam_Schedule es
         ON se.schedule_id = es.schedule_id
       JOIN Exam e
         ON es.exam_id = e.exam_id
       JOIN Subject s
         ON e.subject_id = s.subject_id
       WHERE r.result_id = ?
         AND s.teacher_id = ?`,
      [resultId, teacherId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Result not found"
      });
    }

    await db.query(
      `UPDATE Result
       SET is_published = TRUE
       WHERE result_id = ?`,
      [resultId]
    );

    return res.json({
      success: true,
      message: "Result published successfully"
    });

  } catch (error) {
    console.error("Publish result error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to publish result"
    });
  }
};
// GET PENDING THEORY EVALUATIONS
exports.getPendingEvaluations = async (req, res) => {
    try {
        const teacherId = await getTeacherId(req.user.user_id);

        if (!teacherId) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found"
            });
        }

        const [rows] = await db.query(
            `SELECT
                se.student_exam_id,
                st.student_id,
                e.exam_id,
                e.exam_name,
                s.subject_name,
                sc.question_id,
                u.full_name AS student_name,
                st.scholar_no,
                q.question_text,
                q.marks AS max_marks,
                sc.written_answer,
                sc.is_evaluated
            FROM Scorecard sc
            JOIN Result r ON sc.result_id = r.result_id
            JOIN Student_Exam se ON r.student_exam_id = se.student_exam_id
            JOIN Student st ON se.student_id = st.student_id
            JOIN Users u ON st.user_id = u.user_id
            JOIN Exam_Schedule es ON se.schedule_id = es.schedule_id
            JOIN Exam e ON es.exam_id = e.exam_id
            JOIN Subject s ON e.subject_id = s.subject_id
            JOIN Question q ON sc.question_id = q.question_id
            WHERE s.teacher_id = ?
            AND q.question_type = 'THEORY'
            AND sc.written_answer IS NOT NULL
            AND TRIM(sc.written_answer) <> ''
            AND sc.is_evaluated = FALSE
            AND se.attempt_status IN ('SUBMITTED', 'COMPLETED')
            ORDER BY e.exam_name, u.full_name`,
            [teacherId]
            );

        return res.json({
            success: true,
            evaluations: rows
        });

    } catch (error) {
        console.error("Get pending evaluations error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch pending evaluations"
        });
    }
};


// EVALUATE A THEORY ANSWER
exports.evaluateAnswer = async (req, res) => {
    let connection;

    try {
        const teacherId = await getTeacherId(req.user.user_id);

        if (!teacherId) {
            return res.status(404).json({
                success: false,
                message: "Teacher profile not found"
            });
        }

        const studentExamId = Number(req.params.studentExamId);
        const questionId = Number(req.params.questionId);
        const marks = Number(req.body.marks);

        if (
            !Number.isInteger(studentExamId) ||
            studentExamId <= 0 ||
            !Number.isInteger(questionId) ||
            questionId <= 0 ||
            req.body.marks === undefined ||
            req.body.marks === null ||
            req.body.marks === '' ||
            !Number.isFinite(marks) ||
            marks < 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid student exam, question and marks are required"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Verify that this answer belongs to a subject assigned to this teacher.
        const [rows] = await connection.query(
            `SELECT
                sc.scorecard_id,
                sc.is_evaluated,
                r.result_id,
                q.marks AS max_marks
             FROM Scorecard sc
             JOIN Result r
                ON sc.result_id = r.result_id
             JOIN Student_Exam se
                ON r.student_exam_id = se.student_exam_id
             JOIN Exam_Schedule es
                ON se.schedule_id = es.schedule_id
             JOIN Exam e
                ON es.exam_id = e.exam_id
             JOIN Subject s
                ON e.subject_id = s.subject_id
             JOIN Question q
                ON sc.question_id = q.question_id
             WHERE se.student_exam_id = ?
               AND sc.question_id = ?
               AND q.question_type = 'THEORY'
               AND s.teacher_id = ?
             FOR UPDATE`,
            [studentExamId, questionId, teacherId]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Theory answer not found for this teacher"
            });
        }

        const answer = rows[0];
        const maxMarks = Number(answer.max_marks);

        if (marks > maxMarks) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: `Marks cannot exceed ${maxMarks}`
            });
        }

        if (Boolean(answer.is_evaluated)) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "This answer has already been evaluated"
            });
        }

        // Save the teacher's marks and mark this answer as evaluated.
        await connection.query(
            `UPDATE Scorecard
             SET marks_obtained = ?,
                 is_evaluated = TRUE
             WHERE scorecard_id = ?`,
            [marks, answer.scorecard_id]
        );

        // Recalculate the result using all its scorecard entries.
        await connection.query(
            `UPDATE Result
             SET obtained_marks = (
                 SELECT COALESCE(SUM(marks_obtained), 0)
                 FROM Scorecard
                 WHERE result_id = ?
             )
             WHERE result_id = ?`,
            [answer.result_id, answer.result_id]
        );

        await connection.commit();

        return res.json({
            success: true,
            message: "Theory answer evaluated successfully"
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Evaluate answer error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to evaluate answer"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};
