import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

import Login from "./pages/LoginPage";
import AppLayout from "./layouts/AppLayout";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminExamsPage from "./pages/admin/AdminExamsPage";
import CoursesPage from "./pages/admin/CoursesPage";
import DepartmentsPage from "./pages/admin/DepartmentsPage";
import SemestersPage from "./pages/admin/SemestersPage";
import StudentsPage from "./pages/admin/StudentsPage";
import TeachersPage from "./pages/admin/TeachersPage";
import UsersPage from "./pages/admin/UsersPage";
import SubjectsPage from "./pages/admin/SubjectsPage";

// Teacher pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateExamPage from "./pages/teacher/CreateExamPage";
import QuestionBankPage from "./pages/teacher/QuestionBankPage";
import TeacherEvaluatePage from "./pages/teacher/TeacherEvaluatePage";
import TeacherExamsPage from "./pages/teacher/TeacherExamsPage";
import TeacherResultsPage from "./pages/teacher/TeacherResultsPage";
import TeacherSchedulePage from "./pages/teacher/TeacherSchedulePage";


// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import AvailableExamsPage from "./pages/student/AvailableExamsPage";
import ExamInterfacePage from "./pages/student/ExamInterfacePage";
import PerformanceAnalyticsPage from "./pages/student/PerformanceAnalyticsPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import StudentResultsPage from "./pages/student/StudentResultsPage";
import StudentSchedulePage from "./pages/student/StudentSchedulePage";

import "./styles/global.css";

// Protect routes according to user role
function ProtectedRoute({ allowedRole }) {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role !== allowedRole) {
        const rolePath = {
            ADMIN: "/admin",
            TEACHER: "/teacher",
            STUDENT: "/student"
        };

        return <Navigate to={rolePath[user?.role] || "/login"} replace />;
    }

    return <Outlet />;
}

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* ADMIN ROUTES */}
            <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
                <Route path="/admin" element={<AppLayout />}>
                    <Route path="subjects" element={<SubjectsPage />} />
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="departments" element={<DepartmentsPage />} />
                    <Route path="courses" element={<CoursesPage />} />
                    <Route path="semesters" element={<SemestersPage />} />
                    <Route path="students" element={<StudentsPage />} />
                    <Route path="teachers" element={<TeachersPage />} />
                    <Route path="exams" element={<AdminExamsPage />} />
                </Route>
            </Route>

            {/* TEACHER ROUTES */}
            <Route element={<ProtectedRoute allowedRole="TEACHER" />}>
                <Route path="/teacher" element={<AppLayout />}>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="question-bank" element={<QuestionBankPage />} />
                    <Route path="exams" element={<TeacherExamsPage />} />
                    <Route path="create-exam" element={<CreateExamPage />} />
                    <Route path="schedule" element={<TeacherSchedulePage />} />
                    <Route path="evaluate" element={<TeacherEvaluatePage />} />
                    <Route path="results" element={<TeacherResultsPage />} />
                </Route>
            </Route>

            {/* STUDENT ROUTES */}
        <Route element={<ProtectedRoute allowedRole="STUDENT" />}>
            <Route path="/student" element={<AppLayout />}>
                <Route index element={<StudentDashboard />} />
                <Route path="exams" element={<AvailableExamsPage />} />
                <Route path="exam/:scheduleId" element={<ExamInterfacePage />}/>
                <Route path="analytics" element={<PerformanceAnalyticsPage />} />
                <Route path="profile" element={<StudentProfilePage />} />
                <Route path="results" element={<StudentResultsPage />} />
                <Route path="schedule" element={<StudentSchedulePage />} />
            </Route>
        </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppRoutes />
        </AuthProvider>
    );
}

export default App;