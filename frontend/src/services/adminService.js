// import API from "./api";
// import {
//   departments, courses, subjects, semesters, academicYears,
//    students, teachers, teachingAssignments, exams,
//   examSchedules, studentExams, results,
// } from '../data/mockData';

// let _departments = [...departments];
// let _courses = [...courses];
// let _subjects = [...subjects];
// let _semesters = [...semesters];
// let _teachers = [...teachers];
// let _students = [...students];

// const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// export const adminService = {
//   // ── Departments
 
// getDepartments: async () => {
//     const response = await API.get("/admin/departments");
//     return response.data.departments;
// },

// addDepartment: async (name) => {
//     const response = await API.post("/admin/departments", {
//         department_name: name
//     });
//     return response.data;
// },

// updateDepartment: async (id, name) => {
//     const response = await API.put(`/admin/departments/${id}`, {
//         department_name: name
//     });
//     return response.data;
// },

// deleteDepartment: async (id) => {
//     const response = await API.delete(`/admin/departments/${id}`);
//     return response.data;
// },

//   // ── Courses
 
// getCourses: async () => {
//     const response = await API.get("/admin/courses");
//     return response.data.courses;
// },

// addCourse: async (data) => {
//     const response = await API.post("/admin/courses", data);
//     return response.data;
// },

// updateCourse: async (id, data) => {
//     const response = await API.put(`/admin/courses/${id}`, data);
//     return response.data;
// },

// deleteCourse: async (id) => {
//     const response = await API.delete(`/admin/courses/${id}`);
//     return response.data;
// },


//   // ── Subjects
//  // ── Subjects (MySQL API)
// getSubjects: async () => {
//   const response = await API.get("/admin/subjects");
//   return response.data.subjects;
// },

// addSubject: async (data) => {
//   const response = await API.post("/admin/subjects", data);
//   return response.data;
// },

// updateSubject: async (id, data) => {
//   const response = await API.put(`/admin/subjects/${id}`, data);
//   return response.data;
// },

// deleteSubject: async (id) => {
//   const response = await API.delete(`/admin/subjects/${id}`);
//   return response.data;
// },

//   // ── Semesters
  
// getSemesters: async () => {
//     const response = await API.get("/admin/semesters");
//     return response.data.semesters;
// },

// addSemester: async (data) => {
//     const response = await API.post("/admin/semesters", data);
//     return response.data;
// },

// deleteSemester: async (id) => {
//     const response = await API.delete(`/admin/semesters/${id}`);
//     return response.data;
// },

//   // ── Academic Years
//  getAcademicYears: async () => {
//     const response = await API.get("/admin/academic-years");
//     return response.data.academicYears;
// },

//   // ── Users
//   // ── Users (MySQL API)
// getUsers: async () => {
//   const response = await API.get('/admin/users');
//   return response.data.users;
// },

//   // ── Students
// // STUDENTS
// getStudents: async () => {
//     const response = await API.get("/admin/students");
//     return response.data.students;
// },

// addStudent: async (data) => {
//     const response = await API.post("/admin/students", data);
//     return response.data;
// },
//   deleteStudent: async (id) => {
//     await delay();
//     _students = _students.filter((s) => s.student_id !== id);
//   },

//   // ── Teachers (MySQL API)
// getTeachers: async () => {
//   const response = await API.get("/admin/teachers");
//   return response.data.teachers;
// },

// addTeacher: async (data) => {
//   const response = await API.post("/admin/teachers", data);
//   return response.data;
// },

// deleteTeacher: async (id) => {
//   const response = await API.delete(`/admin/teachers/${id}`);
//   return response.data;
// },

//   // ── Dashboard stats
//  getDashboardStats: async () => {
//     const response = await API.get("/admin/dashboard-stats");
//     return response.data.stats;
// },

//   // ── Exams list for admin
//   getExams: async () => {
//     await delay();
//     return exams.map((e) => {
//       const schedule = examSchedules.find((s) => s.exam_id === e.exam_id);
//       const subject = subjects.find((s) => s.subject_id === e.subject_id);
//       return { ...e, schedule, subject };
//     });
//   },
// };


import API from "./api";

export const adminService = {

  // DEPARTMENTS - MYSQL
  getDepartments: async () => {
    const response = await API.get("/admin/departments");
    return response.data.departments || [];
  },

  addDepartment: async (name) => {
    const response = await API.post("/admin/departments", {
      department_name: name,
    });

    return response.data;
  },

  updateDepartment: async (id, name) => {
    const response = await API.put(`/admin/departments/${id}`, {
      department_name: name,
    });

    return response.data;
  },

  deleteDepartment: async (id) => {
    const response = await API.delete(`/admin/departments/${id}`);
    return response.data;
  },

  // COURSES - MYSQL
  getCourses: async () => {
    const response = await API.get("/admin/courses");
    return response.data.courses || [];
  },

  addCourse: async (data) => {
    const response = await API.post("/admin/courses", data);
    return response.data;
  },

  updateCourse: async (id, data) => {
    const response = await API.put(`/admin/courses/${id}`, data);
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await API.delete(`/admin/courses/${id}`);
    return response.data;
  },

  // SUBJECTS - MYSQL
  getSubjects: async () => {
    const response = await API.get("/admin/subjects");
    return response.data.subjects || [];
  },

  addSubject: async (data) => {
    const response = await API.post("/admin/subjects", data);
    return response.data;
  },

  updateSubject: async (id, data) => {
    const response = await API.put(`/admin/subjects/${id}`, data);
    return response.data;
  },

  deleteSubject: async (id) => {
    const response = await API.delete(`/admin/subjects/${id}`);
    return response.data;
  },

  // SEMESTERS - MYSQL
  getSemesters: async () => {
    const response = await API.get("/admin/semesters");
    return response.data.semesters || [];
  },

  addSemester: async (data) => {
    const response = await API.post("/admin/semesters", data);
    return response.data;
  },

  deleteSemester: async (id) => {
    const response = await API.delete(`/admin/semesters/${id}`);
    return response.data;
  },

  // ACADEMIC YEARS - MYSQL
  getAcademicYears: async () => {
    const response = await API.get("/admin/academic-years");
    return response.data.academicYears || [];
  },

  // USERS - MYSQL
  getUsers: async () => {
    const response = await API.get("/admin/users");
    return response.data.users || [];
  },

  // STUDENTS - MYSQL
  getStudents: async () => {
    const response = await API.get("/admin/students");
    return response.data.students || [];
  },

  addStudent: async (data) => {
    const response = await API.post("/admin/students", data);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await API.delete(`/admin/students/${id}`);
    return response.data;
  },

  // TEACHERS - MYSQL
  getTeachers: async () => {
    const response = await API.get("/admin/teachers");
    return response.data.teachers || [];
  },

  addTeacher: async (data) => {
    const response = await API.post("/admin/teachers", data);
    return response.data;
  },

  deleteTeacher: async (id) => {
    const response = await API.delete(`/admin/teachers/${id}`);
    return response.data;
  },

  // DASHBOARD STATISTICS - MYSQL
  getDashboardStats: async () => {
    const response = await API.get("/admin/dashboard-stats");
    return response.data.stats;
  },

  // EXAMS - MYSQL
  getExams: async () => {
    const response = await API.get("/admin/exams");
    return response.data.exams || [];
  },

};
