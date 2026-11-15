
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileQuestion,
  ClipboardList,
  Clock,
  CheckCircle,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { teacherService } from '../../services/teacherService';

export default function TeacherDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingEvaluations, setPendingEvaluations] = useState([]);  //....

  // Load dashboard data from MySQL
  useEffect(() => {
    if (!user) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const [dashboardStats, examList, evaluationList] =
        await Promise.all([
          teacherService.getDashboardStats(),
          teacherService.getExams(),
          teacherService.getPendingEvaluations()
        ]);

        setStats(dashboardStats || {});
        setExams(Array.isArray(examList) ? examList : []);
        setPendingEvaluations(
          Array.isArray(evaluationList) ? evaluationList : []
        ); 
      }catch (err) {
        console.error(
          'Teacher dashboard error:',
          err.response?.data || err
        );

        setError(
          err.response?.data?.message ||
          'Unable to load dashboard data.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user?.user_id]);

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertTriangle size={36} />
        <h3>Dashboard Error</h3>
        <p>{error}</p>

        <button
          className="btn btn-primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? 'Good Morning'
      : hour < 18
      ? 'Good Afternoon'
      : 'Good Evening';

  const pendingExams = Object.values(
  pendingEvaluations.reduce((groups, item) => {
    const examId = item.exam_id;

    if (!groups[examId]) {
      groups[examId] = {
        exam_id: examId,
        exam_name: item.exam_name,
        subject_name: item.subject_name,
        pending_count: 0,
        students: new Set()
      };
    }

    groups[examId].pending_count++;

    groups[examId].students.add(item.student_id);

    return groups;
  }, {})
).map((exam) => ({
  ...exam,
  student_count: exam.students.size
}));
  
  const statItems = [
    {
      label: 'My Subjects',
      value: stats?.subjects ?? 0,
      icon: BookOpen,
      color: 'purple',
      to: '/teacher/question-bank'
    },
    {
      label: 'Question Bank',
      value: stats?.questionBank ?? 0,
      icon: FileQuestion,
      color: 'blue',
      to: '/teacher/question-bank'
    },
    {
      label: 'Total Exams',
      value: stats?.activeExams ?? exams.length,
      icon: ClipboardList,
      color: 'green',
      to: '/teacher/exams'
    },
    {
      label: 'Pending Evaluations',
      value: pendingEvaluations.length,
      icon: Clock,
      color: 'amber',
      to: '/teacher/evaluate'
    }
  ];
  
  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <h1>
          {greeting},{' '}
          {user?.full_name?.split(' ')[0] || 'Professor'} 👋
        </h1>

        <p>
          Manage your question bank, create examinations,
          and evaluate student answers.
        </p>

        <div className="welcome-stats">
          {[
            {
              label: 'Subjects',
              value: stats?.subjects
            },
            {
              label: 'Questions',
              value: stats?.questionBank
            },
            {
              label: 'Exams',
              value: exams.length
            }
          ].map((item) => (
            <div className="welcome-stat" key={item.label}>
              <div className="ws-value">
                {item.value ?? 0}
              </div>

              <div className="ws-label">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

          
      {/* Statistics */}
      <div
        className="stat-grid"
        style={{
          gridTemplateColumns: 'repeat(4, 1fr)',
          marginBottom: 24
        }}
      >
        {statItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.to}
              style={{ textDecoration: 'none' }}
            >
              <div className="stat-card">
                <div className={`stat-icon ${item.color}`}>
                  <Icon size={22} />
                </div>

                <div className="stat-content">
                  <div className="stat-value">
                    {item.value}
                  </div>

                  <div className="stat-label">
                    {item.label}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Dashboard */}
      <div className="grid-2">

        {/* My Examinations */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              My Examinations
            </span>

            <Link
              to="/teacher/exams"
              className="btn btn-ghost btn-sm"
            >
              View All
            </Link>
          </div>

          <div className="card-body">
            {exams.length === 0 ? (
              <div
                className="empty-state"
                style={{ padding: '30px 20px' }}
              >
                <ClipboardList size={36} />

                <h3>No exams yet</h3>

                <p>Create your first examination</p>

                <Link
                  to="/teacher/create-exam"
                  className="btn btn-primary"
                  style={{ marginTop: 12 }}
                >
                  Create Exam
                </Link>
              </div>
            ) : (
              exams.slice(0, 5).map((exam) => (
                <div
                  key={exam.exam_id}
                  className="exam-card"
                  style={{
                    marginBottom: 10,
                    padding: '14px 16px'
                  }}
                >
                  <div
                    className="exam-card-icon"
                    style={{
                      width: 40,
                      height: 40
                    }}
                  >
                    <ClipboardList size={18} />
                  </div>

                  <div className="exam-card-content">
                    <div className="exam-card-title">
                      {exam.exam_name || 'Untitled Exam'}
                    </div>

                    <div className="exam-card-meta">
                      <span>
                        {exam.subject?.subject_name || '—'}
                      </span>

                      <span>•</span>

                      <span>
                        {exam.total_marks} marks
                      </span>

                      <span>•</span>

                      <span>
                        {exam.duration} min
                      </span>
                    </div>
                  </div>

                  <span className="badge badge-purple">
                    {exam.schedule ? 'Scheduled' : 'Unscheduled'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Evaluation Information
         <div className="card">
          <div className="card-header">
            <span className="card-title">
              Evaluations
            </span>

            <Link
              to="/teacher/evaluate"
              className="btn btn-ghost btn-sm"
            >
              Open
            </Link>
          </div>

          <div className="card-body">
            <div
              className="empty-state"
              style={{ padding: '30px 20px' }}
            >
              <CheckCircle
                size={36}
                color="var(--success)"
              />

              <h3>Evaluation data not connected</h3>

              <p>
                Pending evaluations will appear here
                after the evaluation module is migrated to MySQL.
              </p>
            </div>
          </div>
        </div>
      </div>  */}

    
{/* <div className="grid-2">

  <div className="card">
  
  </div> */}

  {/* Evaluation Information */}
<div className="card">
  <div className="card-header">
    <span className="card-title">
      Exams Pending Evaluation
    </span>

    <Link
      to="/teacher/evaluate"
      className="btn btn-ghost btn-sm"
    >
      View All
    </Link>
  </div>

  <div className="card-body">
    {pendingExams.length === 0 ? (
      <div className="empty-state">
        <CheckCircle size={36} color="var(--success)" />
        <h3>No Pending Evaluations</h3>
        <p>No submitted theory answers are waiting for evaluation.</p>
      </div>
    ) : (
      pendingExams.slice(0, 5).map((exam) => (
        <div className="exam-card" key={exam.exam_id}>
          <div className="exam-card-icon">
            <ClipboardList size={20} />
          </div>

          <div className="exam-card-content">
            <div className="exam-card-title">
              {exam.exam_name}
            </div>

            <div className="exam-card-meta">
              <span>{exam.subject_name}</span>
              <span>•</span>
              <span>{exam.pending_count} answers pending</span>
              <span>•</span>
              <span>{exam.student_count} students</span>
            </div>
          </div>

          <Link
            to="/teacher/evaluate"
            className="btn btn-warning btn-sm"
          >
            Evaluate
          </Link>
        </div>
      ))
    )}
  </div>
</div>

</div>

 
      

      {/* Quick Actions */}
      <div style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Quick Actions
            </span>
          </div>

          <div className="card-body">
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap'
              }}
            >
              <Link
                to="/teacher/question-bank"
                className="btn btn-secondary"
              >
                <FileQuestion size={16} />
                Question Bank
              </Link>

              <Link
                to="/teacher/create-exam"
                className="btn btn-primary"
              >
                <ClipboardList size={16} />
                Create Exam
              </Link>

              <Link
                to="/teacher/evaluate"
                className="btn btn-warning"
              >
                <AlertTriangle size={16} />
                Evaluate Theory
              </Link>

              <Link
                to="/teacher/results"
                className="btn btn-ghost"
              >
                <CheckCircle size={16} />
                View Results
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
