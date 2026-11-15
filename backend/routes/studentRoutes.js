const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
    getMySchedule,
    getMyProfile,
    getPerformanceAnalytics,
    getExamQuestions,
    startExam,
    submitExam,
    getMyResults,
    getMyScorecard
} = require("../controllers/studentController");

console.log("Auth Middleware:", typeof authMiddleware);


// Student's own exam schedule
router.get("/schedule", authMiddleware, getMySchedule);

// Student's own profile
router.get("/profile", authMiddleware, getMyProfile);


router.get(
    "/exams/:examId/questions",
    authMiddleware,
    getExamQuestions
);


// Start or resume an exam
router.post(
    "/exams/:scheduleId/start",
    authMiddleware,
    startExam
);


router.post(
    "/exams/:studentExamId/submit",
    authMiddleware,
    submitExam
);

// Student's performance analytics
router.get("/analytics", authMiddleware, getPerformanceAnalytics);

router.get("/results", authMiddleware, getMyResults);

router.get(
    "/results/:resultId/scorecard",
    authMiddleware,
    getMyScorecard
);

module.exports = router;