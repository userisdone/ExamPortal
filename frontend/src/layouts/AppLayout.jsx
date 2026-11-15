
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const pageTitles = {
  // ADMIN
  '/admin': {
    title: 'Admin Dashboard',
    subtitle: 'System overview and management'
  },
  '/admin/users': {
    title: 'User Directory',
    subtitle: 'All system users'
  },
  '/admin/departments': {
    title: 'Departments',
    subtitle: 'Manage academic departments'
  },
  '/admin/courses': {
    title: 'Courses',
    subtitle: 'Manage courses and programs'
  },
  '/admin/semesters': {
    title: 'Semesters',
    subtitle: 'Manage semesters and academic years'
  },
  '/admin/students': {
    title: 'Students',
    subtitle: 'Manage student records'
  },
  '/admin/teachers': {
    title: 'Teachers',
    subtitle: 'Manage teaching staff'
  },
  '/admin/exams': {
    title: 'Examinations',
    subtitle: 'Overview of all examinations'
  },

  // TEACHER
  '/teacher': {
    title: 'Teacher Dashboard',
    subtitle: 'Your teaching overview'
  },
  '/teacher/question-bank': {
    title: 'Question Bank',
    subtitle: 'Manage your question repository'
  },
  '/teacher/exams': {
    title: 'My Examinations',
    subtitle: 'Manage and review exams'
  },
  '/teacher/create-exam': {
    title: 'Create Examination',
    subtitle: 'Create a new examination'
  },
  '/teacher/schedule': {
    title: 'Exam Schedule',
    subtitle: 'View and manage schedules'
  },
  '/teacher/evaluate': {
    title: 'Theory Evaluation',
    subtitle: 'Grade student written answers'
  },
  '/teacher/results': {
    title: 'Results',
    subtitle: 'Review and publish results'
  },

  // STUDENT
  '/student': {
    title: 'Student Dashboard',
    subtitle: 'Your academic overview'
  },
  '/student/exams': {
    title: 'Available Exams',
    subtitle: 'Upcoming scheduled examinations'
  },
  '/student/analytics': {
    title: 'Performance Analytics',
    subtitle: 'Your academic performance insights'
  },
  '/student/profile': {
    title: 'My Profile',
    subtitle: 'Personal and academic information'
  },
  '/student/results': {
    title: 'My Results',
    subtitle: 'View your published results'
  }
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageInfo =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/student/exam/')
      ? {
          title: 'Examination',
          subtitle: 'Complete your examination'
        }
      : {
          title: 'ExamPortal',
          subtitle: ''
        });

  return (
    <div className="app-layout">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="main-content">
        <Topbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          title={pageInfo.title}
          subtitle={pageInfo.subtitle}
        />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
