
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getSemesters,
    createSemester,
    deleteSemester,
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getTeachers,
    createTeacher,
    deleteTeacher,
    getUsers,
    getDashboardStats,
    getStudents,
    createStudent,
    getAcademicYears,
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    getExams
} = require("../controllers/adminController");

router.use(authMiddleware);

// Users
router.get("/users", getUsers);

// Courses
router.get("/courses", getCourses);
router.post("/courses", createCourse);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// Subjects
router.get("/subjects", getSubjects);
router.post("/subjects", createSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);

// Departments
router.get("/departments", getDepartments);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

router.get("/academic-years", getAcademicYears);

// Examinations
router.get("/exams", getExams);

// Semesters
router.get("/semesters", getSemesters);
router.post("/semesters", createSemester);
router.delete("/semesters/:id", deleteSemester);

// Dashboard
router.get("/dashboard-stats", getDashboardStats);

// Students
router.get("/students", getStudents);
router.post("/students", createStudent);

// Courses
router.get("/courses", getCourses);

// Teachers
router.get("/teachers", getTeachers);
router.post("/teachers", createTeacher);
router.delete("/teachers/:id", deleteTeacher);

module.exports = router;
