
import API from "./api";

export const teacherService = {

  // PROFILE
  getTeacherProfile: async () => {
    const response = await API.get("/teacher/profile");
    return response.data.teacher;
  },

  // ASSIGNED SUBJECTS
  getAssignedSubjects: async () => {
    const response = await API.get("/teacher/subjects");
    return response.data.subjects;
  },

  // QUESTION BANK - MYSQL
  getQuestions: async () => {
    const response = await API.get("/teacher/questions");
    return response.data.questions || [];
  },

  getQuestionsBySubject: async (subjectId) => {
    const questions = await teacherService.getQuestions();

    return questions.filter(
      (q) => Number(q.subject_id) === Number(subjectId)
    );
  },

  getOptionsForQuestion: async (questionId) => {
    const questions = await teacherService.getQuestions();

    const question = questions.find(
      (q) => Number(q.question_id) === Number(questionId)
    );

    return question?.options || [];
  },

  addQuestion: async (data) => {
    const response = await API.post("/teacher/questions", data);
    return response.data;
  },

  updateQuestion: async (id, data) => {
    const response = await API.put(`/teacher/questions/${id}`, data);
    return response.data;
  },

  deleteQuestion: async (id) => {
    const response = await API.delete(`/teacher/questions/${id}`);
    return response.data;
  },

  // SMART QUESTION SELECTION - MYSQL QUESTIONS
  generateQuestionSet: async ({
    subjectId,
    totalQuestions,
    totalMarks,
    distribution,
  }) => {
    const allQuestions = await teacherService.getQuestions();

    const pool = allQuestions.filter(
      (q) => Number(q.subject_id) === Number(subjectId)
    );

    const selected = [];

    const {
      mcqPercent = 70,
      theoryPercent = 30,
      easyPercent = 30,
      mediumPercent = 50,
    } = distribution || {};

    const mcqCount = Math.round(
      (mcqPercent / 100) * totalQuestions
    );

    const theoryCount = totalQuestions - mcqCount;

    const easyCount = Math.round(
      (easyPercent / 100) * totalQuestions
    );

    const mediumCount = Math.round(
      (mediumPercent / 100) * totalQuestions
    );

    const hardCount = totalQuestions - easyCount - mediumCount;

    const pick = (type, difficulty, count) => {
      const available = pool.filter(
        (q) =>
          (!type || q.question_type === type) &&
          (!difficulty || q.difficulty === difficulty) &&
          !selected.some(
            (s) => s.question_id === q.question_id
          )
      );

      const picked = available.slice(0, count);
      selected.push(...picked);
    };

    const easyMcq = Math.min(
      Math.round(easyCount * (mcqPercent / 100)),
      mcqCount
    );

    const mediumMcq = Math.min(
      Math.round(mediumCount * (mcqPercent / 100)),
      mcqCount - easyMcq
    );

    const hardMcq = mcqCount - easyMcq - mediumMcq;

    pick("MCQ", "EASY", easyMcq);
    pick("MCQ", "MEDIUM", mediumMcq);
    pick("MCQ", "HARD", hardMcq);

    pick(
      "THEORY",
      "EASY",
      Math.round(easyCount * (theoryPercent / 100))
    );

    pick(
      "THEORY",
      "MEDIUM",
      Math.round(mediumCount * (theoryPercent / 100))
    );

    pick(
      "THEORY",
      "HARD",
      Math.max(
        0,
        theoryCount -
          selected.filter(
            (q) => q.question_type === "THEORY"
          ).length
      )
    );

    const remaining = pool.filter(
      (q) =>
        !selected.some(
          (s) => s.question_id === q.question_id
        )
    );

    while (
      selected.length < totalQuestions &&
      remaining.length > 0
    ) {
      selected.push(remaining.shift());
    }

    const actual = selected.slice(0, totalQuestions);

    const actualMarks = actual.reduce(
      (sum, q) => sum + Number(q.marks),
      0
    );

    const validation = {
      questionsOk: actual.length === totalQuestions,
      marksOk: actualMarks === Number(totalMarks),
      marksActual: actualMarks,
      easyCount: actual.filter(
        (q) => q.difficulty === "EASY"
      ).length,
      mediumCount: actual.filter(
        (q) => q.difficulty === "MEDIUM"
      ).length,
      hardCount: actual.filter(
        (q) => q.difficulty === "HARD"
      ).length,
      mcqCount: actual.filter(
        (q) => q.question_type === "MCQ"
      ).length,
      theoryCount: actual.filter(
        (q) => q.question_type === "THEORY"
      ).length,
    };

    return { questions: actual, validation };
  },

  // PENDING EVALUATIONS - MYSQL
  getPendingEvaluations: async () => {
    const response = await API.get(
      "/teacher/evaluations/pending"
    );

    return response.data.evaluations || [];
  },

  // EVALUATE THEORY ANSWER - MYSQL
  evaluateAnswer: async (studentExamId, questionId, marks) => {
    const response = await API.put(
      `/teacher/evaluations/${studentExamId}/${questionId}`,
      { marks }
    );

    return response.data;
  },

  // EXAMS - MYSQL
  getExams: async () => {
    const response = await API.get("/teacher/exams");
    return response.data.exams;
  },

  createExam: async (examData) => {
    const response = await API.post(
      "/teacher/exams",
      examData
    );

    return response.data;
  },


// updateExamSchedule: async (scheduleId, data) => {
//     let response;

//     if (scheduleId) {
//         // Update an existing schedule
//         response = await API.put(
//             `/teacher/schedules/${scheduleId}`,
//             data
//         );
//     } else {
//         // Create a new schedule
//         response = await API.post(
//             "/teacher/schedules",
//             data
//         );
//     }

//     return response.data;
// },

updateExamSchedule: async (scheduleId, data) => {
    let response;

    if (scheduleId) {
        // Update an existing schedule
        response = await API.put(
            `/teacher/schedules/${scheduleId}`,
            data
        );
    } else {
        // Create a new schedule
        response = await API.post(
            "/teacher/schedules",
            data
        );
    }

    return response.data;
},

  // RESULTS - MYSQL
  getExamResults: async (examId) => {
    const response = await API.get(
      `/teacher/exams/${examId}/results`
    );

    return response.data.results;
  },

  publishResult: async (resultId) => {
    const response = await API.put(
      `/teacher/results/${resultId}/publish`
    );

    return response.data;
  },

  // DASHBOARD STATISTICS - MYSQL
  getDashboardStats: async () => {
    const response = await API.get(
      "/teacher/dashboard-stats"
    );

    return response.data.stats;
  },

};
