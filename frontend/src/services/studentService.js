
// import API from './api';

// import {
//   students,
//   semesters,
//   examSchedules,
//   exams,
//   subjects,
//   questions,
//   options,
//   studentExams as allStudentExams,
//   results as allResults,
//   scorecards,
// } from '../data/mockData';

// let _studentExams = [...allStudentExams];
// let _results = [...allResults];
// let _scorecards = [...scorecards];

// const delay = (ms = 300) =>
//   new Promise((resolve) => setTimeout(resolve, ms));

// export const studentService = {

//   // Student Profile - MySQL
//   getStudentProfile: async () => {
//     const response = await API.get('/student/profile');
//     return response.data.profile;
//   },

//   // Available Exams - MySQL
  
// getAvailableExams: async () => {
//   const response = await API.get('/student/schedule');

//   const schedules = response.data.schedules || [];

//   return schedules.map((schedule) => ({
//     schedule_id: schedule.schedule_id,
//     exam_id: schedule.exam_id,
//     exam_date: schedule.exam_date,
//     start_time: schedule.start_time,
//     end_time: schedule.end_time,

//     student_exam_id: schedule.student_exam_id,
//     attempt_status: schedule.attempt_status || null,

//     exam: {
//       exam_id: schedule.exam_id,
//       exam_name: schedule.exam_name,
//       duration: schedule.duration,
//       total_marks: schedule.total_marks,
//     },

//     subject: {
//       subject_name: schedule.subject_name
//     }
//   }));
// },

//   // Exam Questions - MySQL
//   getExamQuestions: async (examId) => {
//     const response = await API.get(
//       `/student/exams/${examId}/questions`
//     );

//     return response.data.questions || [];
//   },

//   // Start or Resume Exam - MySQL
//  startExam: async (scheduleId) => {
//   const response = await API.post(
//     `/student/exams/${scheduleId}/start`
//   );

//   return response.data.studentExam;
// },

//   // Submit Exam - MySQL
//   submitExam: async (studentExamId, answers) => {
//     const response = await API.post(
//       `/student/exams/${studentExamId}/submit`,
//       { answers }
//     );

//     return response.data.result;
//   },

//   // Results - 

// getStudentResults: async () => {
//     const response = await API.get('/student/results');
//     return response.data.results || [];
// },



//   // Scorecard - Currently Mock Data
//  getScorecard: async (resultId) => {
//     const response = await API.get(
//         `/student/results/${resultId}/scorecard`
//     );

//     return response.data.scorecard || [];
// },


//   // Performance Analytics - MySQL
//   getPerformanceAnalytics: async () => {
//     const response = await API.get('/student/analytics');
//     return response.data.analytics;
//   },

//   // Dashboard Stats - Partially Mock Data
//   getDashboardStats: async (userId) => {
//     await delay();

//     const student = students.find(
//       (s) => Number(s.user_id) === Number(userId)
//     );

//     if (!student) return {};

//     const attempted = _studentExams.filter(
//       (se) => Number(se.student_id) === Number(student.student_id)
//     );

//     const completed = attempted.filter(
//       (se) =>
//         se.attempt_status === 'COMPLETED' ||
//         se.attempt_status === 'SUBMITTED'
//     );

//     const publishedResults = _results.filter(
//       (r) =>
//         completed.some(
//           (se) =>
//             Number(se.student_exam_id) === Number(r.student_exam_id)
//         ) && r.is_published
//     );

//     const avgScore = publishedResults.length
//       ? publishedResults.reduce(
//           (sum, result) => sum + Number(result.percentage || 0),
//           0
//         ) / publishedResults.length
//       : 0;

//     const upcoming = (
//       await studentService.getAvailableExams()
//     ).length;

//     const currentSemester =
//       semesters.find(
//         (s) =>
//           Number(s.semester_id) ===
//           Number(student.current_semester_id)
//       )?.semester_number || 1;

//     return {
//       upcoming_exams: upcoming,
//       completed_exams: completed.length,
//       average_score: Number(avgScore.toFixed(1)),
//       current_semester: currentSemester,
//     };
//   },
// };


import API from './api';

export const studentService = {

  // STUDENT PROFILE - MYSQL
  getStudentProfile: async () => {
    const response = await API.get('/student/profile');
    return response.data.profile;
  },

  // AVAILABLE EXAMS - MYSQL
  getAvailableExams: async () => {
    const response = await API.get('/student/schedule');

    const schedules = response.data.schedules || [];

    return schedules.map((schedule) => ({
      schedule_id: schedule.schedule_id,
      exam_id: schedule.exam_id,
      exam_date: schedule.exam_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,

      student_exam_id: schedule.student_exam_id,
      attempt_status: schedule.attempt_status || null,

      exam: {
        exam_id: schedule.exam_id,
        exam_name: schedule.exam_name,
        duration: schedule.duration,
        total_marks: schedule.total_marks,
      },

      subject: {
        subject_name: schedule.subject_name,
      },
    }));
  },

  // EXAM QUESTIONS - MYSQL
  getExamQuestions: async (examId) => {
    const response = await API.get(
      `/student/exams/${examId}/questions`
    );

    return response.data.questions || [];
  },

  // START OR RESUME EXAM - MYSQL
  startExam: async (scheduleId) => {
    const response = await API.post(
      `/student/exams/${scheduleId}/start`
    );

    return response.data.studentExam;
  },

  // SUBMIT EXAM - MYSQL
  submitExam: async (studentExamId, answers) => {
    const response = await API.post(
      `/student/exams/${studentExamId}/submit`,
      { answers }
    );

    return response.data.result;
  },

  // STUDENT RESULTS - MYSQL
  getStudentResults: async () => {
    const response = await API.get('/student/results');
    return response.data.results || [];
  },

  // SCORECARD - MYSQL
  getScorecard: async (resultId) => {
    const response = await API.get(
      `/student/results/${resultId}/scorecard`
    );

    return response.data.scorecard || [];
  },

  // PERFORMANCE ANALYTICS - MYSQL
  getPerformanceAnalytics: async () => {
    const response = await API.get('/student/analytics');
    return response.data.analytics;
  },

  // DASHBOARD STATISTICS - MYSQL
  getDashboardStats: async () => {
    const [profile, schedules, results] = await Promise.all([
      studentService.getStudentProfile(),
      studentService.getAvailableExams(),
      studentService.getStudentResults(),
    ]);

    // Count completed or submitted exams
    const completedExams = schedules.filter(
      (schedule) =>
        schedule.attempt_status === 'COMPLETED' ||
        schedule.attempt_status === 'SUBMITTED'
    ).length;

    // Consider only published results for average score
    const publishedResults = results.filter(
      (result) => result.is_published
    );

    let averageScore = 0;

    if (publishedResults.length > 0) {
      const percentages = publishedResults.map((result) => {
        if (result.percentage != null) {
          return Number(result.percentage);
        }

        const obtainedMarks = Number(result.obtained_marks || 0);
        const totalMarks = Number(
          result.total_marks || result.exam_total_marks || 0
        );

        return totalMarks > 0
          ? (obtainedMarks / totalMarks) * 100
          : 0;
      });

      averageScore =
        percentages.reduce((sum, score) => sum + score, 0) /
        percentages.length;
    }

    return {
      upcoming_exams: schedules.filter(
        (schedule) =>
          !schedule.attempt_status ||
          schedule.attempt_status === 'IN_PROGRESS'
      ).length,

      completed_exams: completedExams,

      average_score: Number(averageScore.toFixed(1)),

      current_semester:
        profile.current_sem ||
        profile.current_semester ||
        profile.semester_number ||
        1,
    };
  },

};
