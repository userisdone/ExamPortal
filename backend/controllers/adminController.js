
const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Check admin access
const checkAdmin = (req, res) => {
    if (req.user.role !== "ADMIN") {
        res.status(403).json({
            success: false,
            message: "Admin access required"
        });
        return false;
    }
    return true;
};

// GET ALL TEACHERS
exports.getTeachers = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    try {
        const [teachers] = await db.query(`
            SELECT
                t.teacher_id,
                t.user_id,
                u.full_name,
                u.email,
                GROUP_CONCAT(
                    DISTINCT d.department_id
                ) AS department_ids,
                GROUP_CONCAT(
                    DISTINCT d.department_name
                    ORDER BY d.department_name
                    SEPARATOR ', '
                ) AS department_names
            FROM Teacher t
            JOIN Users u ON t.user_id = u.user_id
            LEFT JOIN Teacher_Department td
                ON t.teacher_id = td.teacher_id
            LEFT JOIN Department d
                ON td.department_id = d.department_id
            GROUP BY
                t.teacher_id,
                t.user_id,
                u.full_name,
                u.email
            ORDER BY u.full_name
        `);

        const formattedTeachers = teachers.map(teacher => ({
            ...teacher,
            department_ids: teacher.department_ids
                ? teacher.department_ids.split(",").map(Number)
                : [],
            department_names: teacher.department_names || ""
        }));

        res.json({
            success: true,
            teachers: formattedTeachers
        });

    } catch (error) {
        console.error("Get teachers error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch teachers"
        });
    }
};

// CREATE TEACHER WITH MULTIPLE DEPARTMENTS
exports.createTeacher = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    const {
        full_name,
        email,
        password,
        department_ids
    } = req.body;

    if (
        !full_name?.trim() ||
        !email?.trim() ||
        !password ||
        !Array.isArray(department_ids) ||
        department_ids.length === 0
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required. Select at least one department."
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must contain at least 6 characters"
        });
    }

    const selectedDepartments = [
        ...new Set(department_ids.map(Number))
    ];

    if (
        selectedDepartments.some(
            id => !Number.isInteger(id) || id <= 0
        )
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid department selection"
        });
    }

    let connection;

    try {
        const [existing] = await db.query(
            "SELECT user_id FROM Users WHERE email = ?",
            [email.trim()]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        const placeholders = selectedDepartments.map(() => "?").join(",");

        const [departments] = await db.query(
            `SELECT department_id
             FROM Department
             WHERE department_id IN (${placeholders})`,
            selectedDepartments
        );

        if (departments.length !== selectedDepartments.length) {
            return res.status(400).json({
                success: false,
                message: "One or more selected departments are invalid"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Create user
        const [userResult] = await connection.query(
            `INSERT INTO Users
             (full_name, email, password_hash, role)
             VALUES (?, ?, ?, 'TEACHER')`,
            [
                full_name.trim(),
                email.trim(),
                hashedPassword
            ]
        );

        // Keep the first department in the legacy column
        const [teacherResult] = await connection.query(
            `INSERT INTO Teacher (user_id, department_id)
             VALUES (?, ?)`,
            [
                userResult.insertId,
                selectedDepartments[0]
            ]
        );

        const teacherId = teacherResult.insertId;

        // Save all department assignments
        const values = selectedDepartments.map(departmentId => [
            teacherId,
            departmentId
        ]);

        await connection.query(
            `INSERT INTO Teacher_Department
             (teacher_id, department_id)
             VALUES ?`,
            [values]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Teacher created successfully",
            teacher_id: teacherId,
            department_ids: selectedDepartments
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Create teacher error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create teacher"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// DELETE TEACHER
exports.deleteTeacher = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    try {
        const teacherId = req.params.id;

        const [result] = await db.query(
            "DELETE FROM Teacher WHERE teacher_id = ?",
            [teacherId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Teacher not found"
            });
        }

        res.json({
            success: true,
            message: "Teacher deleted successfully"
        });

    } catch (error) {
        console.error("Delete teacher error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete teacher"
        });
    }
};

// GET ALL USERS
exports.getUsers = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    try {
        const [users] = await db.query(`
            SELECT
                user_id,
                full_name,
                email,
                role
            FROM Users
            ORDER BY user_id ASC
        `);

        res.status(200).json({
            success: true,
            users
        });

    } catch (error) {
        console.error("Get users error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch users"
        });
    }
};
// GET DASHBOARD STATISTICS
// exports.getDashboardStats = async (req, res) => {
//     if (!checkAdmin(req, res)) return;

//     try {
//         const [rows] = await db.query(`
//             SELECT
//                 (SELECT COUNT(*) FROM Student) AS students,
//                 (SELECT COUNT(*) FROM Teacher) AS teachers,
//                 (SELECT COUNT(*) FROM Department) AS departments,
//                 (SELECT COUNT(*) FROM Course) AS courses,
//                 (SELECT COUNT(*) FROM Subject) AS subjects,
//                 (SELECT COUNT(*) FROM Exam) AS total_exams,
//                 (SELECT COUNT(*) FROM Users WHERE role = 'ADMIN') AS admins
//         `);

//         res.json({
//             success: true,
//             stats: rows[0]
//         });

//     } catch (error) {
//         console.error("Dashboard stats error:", error);

//         res.status(500).json({
//             success: false,
//             message: "Unable to fetch dashboard statistics"
//         });
//     }
// };


// GET DASHBOARD STATISTICS
exports.getDashboardStats = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    try {
        // 1. Main dashboard counts
        const [rows] = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM Student) AS students,
                (SELECT COUNT(*) FROM Teacher) AS teachers,
                (SELECT COUNT(*) FROM Department) AS departments,
                (SELECT COUNT(*) FROM Course) AS courses,
                (SELECT COUNT(*) FROM Subject) AS subjects,
                (SELECT COUNT(*) FROM Exam) AS total_exams,
                (SELECT COUNT(*) FROM Users WHERE role = 'ADMIN') AS admins,
                (SELECT COUNT(*) FROM Question) AS questions
        `);

        // 2. Students grouped by course
        const [studentsByCourse] = await db.query(`
            SELECT
                c.course_id,
                COALESCE(c.course_name, 'Unassigned') AS course_name,
                COUNT(s.student_id) AS student_count
            FROM Course c
            LEFT JOIN Student s ON s.course_id = c.course_id
            GROUP BY c.course_id, c.course_name
            ORDER BY student_count DESC, c.course_name ASC
        `);

        // Include students whose course_id is NULL, if any
        const [unassignedRows] = await db.query(`
            SELECT COUNT(*) AS student_count
            FROM Student
            WHERE course_id IS NULL
        `);

        if (Number(unassignedRows[0].student_count) > 0) {
            studentsByCourse.push({
                course_id: null,
                course_name: 'Unassigned',
                student_count: unassignedRows[0].student_count
            });
        }

        // 3. Exam statistics
        const [examStatsRows] = await db.query(`
            SELECT
                COUNT(DISTINCT e.exam_id) AS total,
                
                COUNT(DISTINCT CASE
                    WHEN es.schedule_id IS NOT NULL
                    THEN e.exam_id
                END) AS scheduled,

                COUNT(DISTINCT CASE
                    WHEN CONCAT(es.exam_date, ' ', es.start_time) > NOW()
                    THEN e.exam_id
                END) AS upcoming,

                COUNT(DISTINCT CASE
                    WHEN NOW() BETWEEN
                        CONCAT(es.exam_date, ' ', es.start_time)
                        AND CONCAT(es.exam_date, ' ', es.end_time)
                    THEN e.exam_id
                END) AS live,

                COUNT(DISTINCT CASE
                    WHEN CONCAT(es.exam_date, ' ', es.end_time) < NOW()
                    THEN e.exam_id
                END) AS completed,

                COUNT(DISTINCT CASE
                    WHEN NOT EXISTS (
                        SELECT 1
                        FROM Exam_Schedule es2
                        WHERE es2.exam_id = e.exam_id
                    )
                    THEN e.exam_id
                END) AS unscheduled

            FROM Exam e
            LEFT JOIN Exam_Schedule es ON es.exam_id = e.exam_id
        `);

        // 4. Recent student examination activity
        const [recentActivity] = await db.query(`
            SELECT
                se.student_exam_id,
                u.full_name AS student_name,
                e.exam_name,
                sub.subject_name,
                se.attempt_status,
                se.attempt_start
            FROM Student_Exam se
            JOIN Student st ON se.student_id = st.student_id
            JOIN Users u ON st.user_id = u.user_id
            JOIN Exam_Schedule es ON se.schedule_id = es.schedule_id
            JOIN Exam e ON es.exam_id = e.exam_id
            LEFT JOIN Subject sub ON e.subject_id = sub.subject_id
            WHERE se.attempt_start IS NOT NULL
            ORDER BY se.attempt_start DESC
            LIMIT 6
        `);

        res.json({
            success: true,
            stats: {
                ...rows[0],
                studentsByCourse,
                examStatistics: examStatsRows[0],
                recentActivity
            }
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch dashboard statistics"
        });
    }
};


// GET ALL STUDENTS (ADMIN)
exports.getStudents = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    try {
        const [students] = await db.query(`
           SELECT
            s.student_id,
            s.user_id,
            u.full_name,
            u.email,
            s.scholar_no,
            s.batch_year,
            s.course_id,
            c.course_name,
            s.current_sem
            FROM Student s
            JOIN Users u ON s.user_id = u.user_id
            LEFT JOIN Course c ON s.course_id = c.course_id
            ORDER BY s.student_id ASC
        `);

        res.status(200).json({
            success: true,
            count: students.length,
            students
        });

    } catch (error) {
        console.error("Get students error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch students"
        });
    }
};

// CREATE STUDENT (ADMIN)

exports.createStudent = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    const {
        full_name,
        email,
        password,
        course_id,
        current_sem,
        scholar_no,
        batch_year
    } = req.body;

    if (
        !full_name ||
        !email ||
        !password ||
        !course_id ||
        !current_sem ||
        !scholar_no ||
        !batch_year
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    const connection = await db.getConnection();

    try {
        // Check whether email already exists
        const [existingEmail] = await connection.query(
            "SELECT user_id FROM Users WHERE email = ?",
            [email]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });
        }

        // Check whether scholar number already exists
        const [existingScholar] = await connection.query(
            "SELECT student_id FROM Student WHERE scholar_no = ?",
            [scholar_no]
        );

        if (existingScholar.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Scholar number already exists"
            });
        }

        // Validate course and semester
        const [courses] = await connection.query(
            "SELECT total_semester FROM Course WHERE course_id = ?",
            [course_id]
        );

        if (
            courses.length === 0 ||
            Number(current_sem) < 1 ||
            Number(current_sem) > courses[0].total_semester
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid course or semester"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await connection.beginTransaction();

        const [userResult] = await connection.query(
            `INSERT INTO Users (full_name, email, password_hash, role)
             VALUES (?, ?, ?, 'STUDENT')`,
            [full_name, email, hashedPassword]
        );

        const [studentResult] = await connection.query(
            `INSERT INTO Student
             (user_id, course_id, current_sem, scholar_no, batch_year)
             VALUES (?, ?, ?, ?, ?)`,
            [
                userResult.insertId,
                course_id,
                current_sem,
                scholar_no,
                batch_year
            ]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            student_id: studentResult.insertId,
            scholar_no
        });

    } catch (error) {
        await connection.rollback();

        console.error("Create student error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create student"
        });

    } finally {
        connection.release();
    }
};

// GET ALL COURSES
exports.getCourses = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    try {
        const [courses] = await db.query(`
         SELECT
        c.course_id,
        c.course_name,
        c.department_id,
        c.total_semester,
        c.total_semester AS total_semesters,
        d.department_name
        FROM Course c
        LEFT JOIN Department d
            ON c.department_id = d.department_id
        ORDER BY c.course_id ASC
        `);

        res.json({ success: true, courses });
    } catch (error) {
        console.error("Get courses error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch courses"
        });
    }
};


// CREATE COURSE
exports.createCourse = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    const { course_name, department_id, total_semesters } = req.body;

    const name = course_name?.trim();
    const deptId = Number(department_id);
    const semesters = Number(total_semesters);

    if (!name || !Number.isInteger(deptId) || deptId <= 0 ||
        ![2, 4, 6, 8].includes(semesters)) {
        return res.status(400).json({
            success: false,
            message: "Valid course name, department and semester count are required"
        });
    }

    try {
        const [department] = await db.query(
            "SELECT department_id FROM Department WHERE department_id = ?",
            [deptId]
        );

        if (department.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        const [existing] = await db.query(
            `SELECT course_id FROM Course
             WHERE LOWER(course_name) = LOWER(?) AND department_id = ?`,
            [name, deptId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This course already exists in the department"
            });
        }

        const [result] = await db.query(
            `INSERT INTO Course (course_name, department_id, total_semester)
             VALUES (?, ?, ?)`,
            [name, deptId, semesters]
        );

        res.status(201).json({
            success: true,
            message: "Course created successfully",
            course_id: result.insertId
        });
    } catch (error) {
        console.error("Create course error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to create course"
        });
    }
};


// UPDATE COURSE
exports.updateCourse = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    const courseId = Number(req.params.id);
    const { course_name, department_id, total_semesters } = req.body;

    const name = course_name?.trim();
    const deptId = Number(department_id);
    const semesters = Number(total_semesters);

    if (!Number.isInteger(courseId) || courseId <= 0 ||
        !name || !Number.isInteger(deptId) || deptId <= 0 ||
        ![2, 4, 6, 8].includes(semesters)) {
        return res.status(400).json({
            success: false,
            message: "Invalid course details"
        });
    }

    try {
        const [department] = await db.query(
            "SELECT department_id FROM Department WHERE department_id = ?",
            [deptId]
        );

        if (department.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        const [existing] = await db.query(
            `SELECT course_id FROM Course
             WHERE LOWER(course_name) = LOWER(?)
             AND department_id = ? AND course_id != ?`,
            [name, deptId, courseId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "This course already exists in the department"
            });
        }

        const [result] = await db.query(
            `UPDATE Course
             SET course_name = ?, department_id = ?, total_semester = ?
             WHERE course_id = ?`,
            [name, deptId, semesters, courseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.json({
            success: true,
            message: "Course updated successfully"
        });
    } catch (error) {
        console.error("Update course error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update course"
        });
    }
};


// DELETE COURSE
exports.deleteCourse = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    const courseId = Number(req.params.id);

    if (!Number.isInteger(courseId) || courseId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid course ID"
        });
    }

    try {
        const [result] = await db.query(
            "DELETE FROM Course WHERE course_id = ?",
            [courseId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        res.json({
            success: true,
            message: "Course deleted successfully"
        });
    } catch (error) {
        console.error("Delete course error:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message: "Cannot delete this course because students or academic records are linked to it."
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to delete course"
        });
    }
};


// GET ALL DEPARTMENTS
exports.getDepartments = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    try {
        const [departments] = await db.query(`
            SELECT department_id, department_name
            FROM Department
            ORDER BY department_id ASC
        `);

        res.json({
            success: true,
            departments
        });

    } catch (error) {
        console.error("Get departments error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch departments"
        });
    }
};

// CREATE DEPARTMENT
exports.createDepartment = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    const departmentName = req.body.department_name?.trim();

    if (!departmentName) {
        return res.status(400).json({
            success: false,
            message: "Department name is required"
        });
    }

    try {
        const [existing] = await db.query(
            "SELECT department_id FROM Department WHERE LOWER(department_name) = LOWER(?)",
            [departmentName]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Department already exists"
            });
        }

        const [result] = await db.query(
            "INSERT INTO Department (department_name) VALUES (?)",
            [departmentName]
        );

        res.status(201).json({
            success: true,
            message: "Department created successfully",
            department: {
                department_id: result.insertId,
                department_name: departmentName
            }
        });

    } catch (error) {
        console.error("Create department error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to create department"
        });
    }
};

// UPDATE DEPARTMENT
exports.updateDepartment = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    const departmentId = Number(req.params.id);
    const departmentName = req.body.department_name?.trim();

    if (!Number.isInteger(departmentId) || departmentId <= 0 || !departmentName) {
        return res.status(400).json({
            success: false,
            message: "Valid department ID and name are required"
        });
    }

    try {
        const [existing] = await db.query(
            `SELECT department_id FROM Department
             WHERE LOWER(department_name) = LOWER(?)
             AND department_id != ?`,
            [departmentName, departmentId]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Another department already has this name"
            });
        }

        const [result] = await db.query(
            "UPDATE Department SET department_name = ? WHERE department_id = ?",
            [departmentName, departmentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.json({
            success: true,
            message: "Department updated successfully"
        });

    } catch (error) {
        console.error("Update department error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to update department"
        });
    }
};

// DELETE DEPARTMENT
exports.deleteDepartment = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    const departmentId = Number(req.params.id);

    if (!Number.isInteger(departmentId) || departmentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid department ID"
        });
    }

    try {
        const [result] = await db.query(
            "DELETE FROM Department WHERE department_id = ?",
            [departmentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.json({
            success: true,
            message: "Department deleted successfully"
        });

    } catch (error) {
        console.error("Delete department error:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message: "Cannot delete this department because courses or teachers are linked to it."
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to delete department"
        });
    }
};

// GET ALL SEMESTERS
exports.getSemesters = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    try {
        const [semesters] = await db.query(`
            SELECT
                semester_id,
                course_id,
                academic_year_id,
                semester_number,
                term_type
            FROM Semester
            ORDER BY academic_year_id DESC, course_id, semester_number
        `);

        res.json({ success: true, semesters });
    } catch (error) {
        console.error("Get semesters error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch semesters"
        });
    }
};


// CREATE SEMESTER
exports.createSemester = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    const {
        course_id,
        academic_year_id,
        semester_number,
        term_type
    } = req.body;

    const courseId = Number(course_id);
    const yearId = Number(academic_year_id);
    const semesterNumber = Number(semester_number);

    if (
        !Number.isInteger(courseId) || courseId <= 0 ||
        !Number.isInteger(yearId) || yearId <= 0 ||
        !Number.isInteger(semesterNumber) ||
        !["ODD", "EVEN"].includes(term_type)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid semester details"
        });
    }

    try {
        const [courses] = await db.query(
            "SELECT total_semester FROM Course WHERE course_id = ?",
            [courseId]
        );

        if (courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            });
        }

        if (
            semesterNumber < 1 ||
            semesterNumber > courses[0].total_semester
        ) {
            return res.status(400).json({
                success: false,
                message: "Semester number exceeds the course duration"
            });
        }

        const [years] = await db.query(
            "SELECT academic_year_id FROM AcademicYear WHERE academic_year_id = ?",
            [yearId]
        );

        if (years.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Academic year not found"
            });
        }

        const [result] = await db.query(
            `INSERT INTO Semester
             (course_id, academic_year_id, semester_number, term_type)
             VALUES (?, ?, ?, ?)`,
            [courseId, yearId, semesterNumber, term_type]
        );

        res.status(201).json({
            success: true,
            message: "Semester created successfully",
            semester_id: result.insertId
        });
    } catch (error) {
        console.error("Create semester error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "This semester already exists for this course and academic year"
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to create semester"
        });
    }
};


// DELETE SEMESTER
exports.deleteSemester = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    const semesterId = Number(req.params.id);

    if (!Number.isInteger(semesterId) || semesterId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid semester ID"
        });
    }

    try {
        const [result] = await db.query(
            "DELETE FROM Semester WHERE semester_id = ?",
            [semesterId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Semester not found"
            });
        }

        res.json({
            success: true,
            message: "Semester deleted successfully"
        });
    } catch (error) {
        console.error("Delete semester error:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message: "Cannot delete this semester because academic records are linked to it."
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to delete semester"
        });
    }
};

// GET ALL ACADEMIC YEARS
exports.getAcademicYears = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    try {
        const [academicYears] = await db.query(`
            SELECT academic_year_id, year_start, year_end
            FROM AcademicYear
            ORDER BY year_start DESC
        `);

        res.json({
            success: true,
            academicYears
        });
    } catch (error) {
        console.error("Get academic years error:", error);
        res.status(500).json({
            success: false,
            message: "Unable to fetch academic years"
        });
    }
};

// GET ALL SUBJECTS
exports.getSubjects = async (req, res) => {
    try {
        const [subjects] = await db.query(
            `SELECT * FROM Subject ORDER BY subject_id DESC`
        );

        res.json({ success: true, subjects });
    } catch (error) {
        console.error("Get subjects error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch subjects"
        });
    }
};

// ADD SUBJECT
exports.createSubject = async (req, res) => {
    try {
        const { subject_name, course_id, semester, teacher_id } = req.body;

        if (!subject_name || !course_id || !semester) {
            return res.status(400).json({
                success: false,
                message: "Subject name, course and semester are required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO Subject (subject_name, course_id, semester, teacher_id)
             VALUES (?, ?, ?, ?)`,
            [subject_name, course_id, semester, teacher_id || null]
        );

        res.status(201).json({
            success: true,
            message: "Subject added successfully",
            subject_id: result.insertId
        });
    } catch (error) {
        console.error("Create subject error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add subject"
        });
    }
};

// UPDATE SUBJECT
exports.updateSubject = async (req, res) => {
    try {
        const { subject_name, course_id, semester, teacher_id } = req.body;
        const { id } = req.params;

        await db.query(
            `UPDATE Subject
             SET subject_name = ?, course_id = ?, semester = ?, teacher_id = ?
             WHERE subject_id = ?`,
            [subject_name, course_id, semester, teacher_id || null, id]
        );

        res.json({
            success: true,
            message: "Subject updated successfully"
        });
    } catch (error) {
        console.error("Update subject error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update subject"
        });
    }
};

// DELETE SUBJECT
exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(
            `DELETE FROM Subject WHERE subject_id = ?`,
            [id]
        );

        res.json({
            success: true,
            message: "Subject deleted successfully"
        });
    } catch (error) {
        console.error("Delete subject error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete subject"
        });
    }
};
// GET ALL SUBJECTS
exports.getSubjects = async (req, res) => {
    try {
        if (!checkAdmin(req, res)) return;

        const [subjects] = await db.query(`
            SELECT
                s.subject_id,
                s.subject_name,
                s.course_id,
                s.teacher_id,
                s.semester,
                c.course_name,
                u.full_name AS teacher_name
            FROM Subject s
            JOIN Course c ON s.course_id = c.course_id
            JOIN Teacher t ON s.teacher_id = t.teacher_id
            JOIN Users u ON t.user_id = u.user_id
            ORDER BY s.subject_id DESC
        `);

        res.json({ success: true, subjects });
    } catch (error) {
        console.error("Get subjects error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch subjects"
        });
    }
};

// ADD SUBJECT
exports.createSubject = async (req, res) => {
    try {
        if (!checkAdmin(req, res)) return;

        const { subject_name, course_id, teacher_id, semester } = req.body;

        if (!subject_name || !course_id || !teacher_id || !semester) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const [result] = await db.query(
            `INSERT INTO Subject
            (subject_name, course_id, teacher_id, semester)
            VALUES (?, ?, ?, ?)`,
            [subject_name, course_id, teacher_id, semester]
        );

        res.status(201).json({
            success: true,
            message: "Subject added successfully",
            subject_id: result.insertId
        });
    } catch (error) {
        console.error("Create subject error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add subject"
        });
    }
};

// UPDATE SUBJECT
exports.updateSubject = async (req, res) => {
    try {
        if (!checkAdmin(req, res)) return;

        const { subject_name, course_id, teacher_id, semester } = req.body;
        const { id } = req.params;

        await db.query(
            `UPDATE Subject
             SET subject_name = ?, course_id = ?, teacher_id = ?, semester = ?
             WHERE subject_id = ?`,
            [subject_name, course_id, teacher_id, semester, id]
        );

        res.json({
            success: true,
            message: "Subject updated successfully"
        });
    } catch (error) {
        console.error("Update subject error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update subject"
        });
    }
};

// DELETE SUBJECT
exports.deleteSubject = async (req, res) => {
    try {
        if (!checkAdmin(req, res)) return;

        await db.query(
            "DELETE FROM Subject WHERE subject_id = ?",
            [req.params.id]
        );

        res.json({
            success: true,
            message: "Subject deleted successfully"
        });
    } catch (error) {
        console.error("Delete subject error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete subject"
        });
    }
};

// GET ALL EXAMINATIONS - ADMIN
exports.getExams = async (req, res) => {
    if (!checkAdmin(req, res)) return;

    try {
        const [exams] = await db.query(`
            SELECT
                e.exam_id,
                e.exam_name,
                e.subject_id,
                e.duration,
                e.total_marks,

                s.subject_name,
                s.semester,

                t.teacher_id,
                u.full_name AS teacher_name,

                es.schedule_id,
                DATE_FORMAT(es.exam_date, '%Y-%m-%d') AS exam_date,
                TIME_FORMAT(es.start_time, '%H:%i:%s') AS start_time,
                TIME_FORMAT(es.end_time, '%H:%i:%s') AS end_time

            FROM Exam e

            LEFT JOIN Subject s
                ON e.subject_id = s.subject_id

            LEFT JOIN Teacher t
                ON s.teacher_id = t.teacher_id

            LEFT JOIN Users u
                ON t.user_id = u.user_id

            LEFT JOIN Exam_Schedule es
                ON es.schedule_id = (
                    SELECT es2.schedule_id
                    FROM Exam_Schedule es2
                    WHERE es2.exam_id = e.exam_id
                    ORDER BY
                        CASE
                            WHEN es2.exam_date >= CURDATE() THEN 0
                            ELSE 1
                        END ASC,
                        CASE
                            WHEN es2.exam_date >= CURDATE()
                            THEN es2.exam_date
                        END ASC,
                        es2.exam_date DESC,
                        es2.start_time ASC
                    LIMIT 1
                )

            ORDER BY e.exam_id DESC
        `);

        const formattedExams = exams.map(exam => ({
            exam_id: exam.exam_id,
            exam_name: exam.exam_name,
            subject_id: exam.subject_id,
            subject_name: exam.subject_name,
            teacher_id: exam.teacher_id,
            teacher_name: exam.teacher_name,
            semester: exam.semester,
            duration: exam.duration,
            total_marks: exam.total_marks,

            schedule: exam.schedule_id
                ? {
                    schedule_id: exam.schedule_id,
                    exam_date: exam.exam_date,
                    start_time: exam.start_time,
                    end_time: exam.end_time
                }
                : null
        }));

        res.json({
            success: true,
            count: formattedExams.length,
            exams: formattedExams
        });

    } catch (error) {
        console.error("Get examinations error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch examinations"
        });
    }
};
