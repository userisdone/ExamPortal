
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getAssignedSubjects,
    getQuestions,
    createQuestion,
    updateQuestion,
    getDashboardStats,
    deleteQuestion,
    createExam,
    getExams,
    getExamResults,
    publishResult,
    getPendingEvaluations,
    evaluateAnswer
} = require("../controllers/teacherController");

// All teacher routes require authentication
router.use(authMiddleware);

router.get("/exams/:examId/results", getExamResults);
router.put("/results/:resultId/publish", publishResult);

// Create Exam
router.post("/exams", createExam);

router.get("/exams", getExams);

router.get("/dashboard-stats", getDashboardStats);

// Assigned subjects
router.get("/subjects", getAssignedSubjects);

router.get("/evaluations/pending", getPendingEvaluations);

router.put(
    "/evaluations/:studentExamId/:questionId",
    evaluateAnswer
);

// Question Bank
router.get("/questions", getQuestions);
router.post("/questions", createQuestion);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);



module.exports = router;
