
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  School,
  BookOpen,
  ClipboardList,
  GraduationCap,
  BarChart2,
  Activity,
  Calendar,
} from 'lucide-react';

import { adminService } from '../../services/adminService';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Dashboard loading error:', err);
        setError(
          err.response?.data?.message ||
          'Unable to load dashboard statistics.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

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
      <div className="card">
        <div className="card-body">
          <p style={{ color: 'var(--danger)' }}>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Students',
      value: stats?.students,
      icon: GraduationCap,
      color: 'purple',
      to: '/admin/students',
    },
    {
      label: 'Teachers',
      value: stats?.teachers,
      icon: Users,
      color: 'blue',
      to: '/admin/teachers',
    },
    {
      label: 'Departments',
      value: stats?.departments,
      icon: Building2,
      color: 'green',
      to: '/admin/departments',
    },
    {
      label: 'Courses',
      value: stats?.courses,
      icon: School,
      color: 'amber',
      to: '/admin/courses',
    },
    {
      label: 'Subjects',
      value: stats?.subjects,
      icon: BookOpen,
      color: 'red',
      to: '/admin/subjects',
    },
    {
      label: 'Total Exams',
      value: stats?.total_exams,
      icon: ClipboardList,
      color: 'purple',
      to: '/admin/exams',
    },
  ];

  const totalUsers =
    (Number(stats?.students) || 0) +
    (Number(stats?.teachers) || 0) +
    (Number(stats?.admins) || 0);

  const courses = stats?.studentsByCourse || [];
  const examStats = stats?.examStatistics;
  const recentActivity = stats?.recentActivity || [];

  const maxStudents = Math.max(
    ...courses.map((course) => Number(course.student_count) || 0),
    1
  );

  return (
    <div>
      {/* Welcome Section */}
      <div className="welcome-banner">
        <h1>Administrator Dashboard</h1>
        <p>
          Manage your university examination system from one central place.
        </p>

        <div className="welcome-stats">
          <div className="welcome-stat">
            <div className="ws-value">{totalUsers}</div>
            <div className="ws-label">Total Users</div>
          </div>

          <div className="welcome-stat">
            <div className="ws-value">
              {stats?.questions ?? '—'}
            </div>
            <div className="ws-label">Question Bank</div>
          </div>

          <div className="welcome-stat">
            <div className="ws-value">
              {stats?.total_exams ?? '—'}
            </div>
            <div className="ws-label">Examinations</div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div
        className="stat-grid"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          marginBottom: 24,
        }}
      >
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              to={card.to}
              key={card.label}
              style={{ textDecoration: 'none' }}
            >
              <div className="stat-card">
                <div className={`stat-icon ${card.color}`}>
                  <Icon size={22} />
                </div>

                <div className="stat-content">
                  <div className="stat-value">
                    {card.value ?? '—'}
                  </div>
                  <div className="stat-label">
                    {card.label}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dashboard Information */}
      <div className="grid-2" style={{ marginBottom: 24 }}>

        {/* Students by Course */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Students by Course</span>
            <BarChart2 size={18} color="var(--text-muted)" />
          </div>

          <div className="card-body">
            {courses.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                }}
              >
                {courses.map((course) => {
                  const count = Number(course.student_count) || 0;
                  const percentage = (count / maxStudents) * 100;

                  return (
                    <div key={course.course_id ?? 'unassigned'}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 7,
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          {course.course_name}
                        </span>

                        <span style={{ color: 'var(--text-muted)' }}>
                          {count} students
                        </span>
                      </div>

                      <div
                        style={{
                          height: 9,
                          background: 'var(--border)',
                          borderRadius: 10,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'var(--primary)',
                            borderRadius: 10,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>
                No course-wise student data available.
              </p>
            )}
          </div>
        </div>

        {/* Exam Statistics */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Exam Statistics</span>
            <Activity size={18} color="var(--text-muted)" />
          </div>

          <div className="card-body">
            {examStats ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 16,
                }}
              >
                {[
                  {
                    label: 'Total Exams',
                    value: examStats.total,
                  },
                  {
                    label: 'Scheduled',
                    value: examStats.scheduled,
                  },
                  {
                    label: 'Upcoming',
                    value: examStats.upcoming,
                  },
                  {
                    label: 'Live Now',
                    value: examStats.live,
                  },
                  {
                    label: 'Completed',
                    value: examStats.completed,
                  },
                  {
                    label: 'Unscheduled',
                    value: examStats.unscheduled,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: 14,
                      background: 'var(--bg-secondary)',
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 23,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      {item.value ?? 0}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>
                Exam statistics are not available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
          <Calendar size={18} color="var(--text-muted)" />
        </div>

        <div className="card-body">
          {recentActivity.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              {recentActivity.map((activity, index) => (
                <div
                  key={activity.student_exam_id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 0',
                    borderBottom:
                      index !== recentActivity.length - 1
                        ? '1px solid var(--border)'
                        : 'none',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, marginBottom: 5 }}>
                      {activity.student_name}
                    </div>

                    <div
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 13,
                      }}
                    >
                      {activity.exam_name}
                      {activity.subject_name
                        ? ` · ${activity.subject_name}`
                        : ''}
                    </div>

                    <div
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        marginTop: 5,
                      }}
                    >
                      {activity.attempt_start
                        ? new Date(activity.attempt_start).toLocaleString()
                        : 'Time unavailable'}
                    </div>
                  </div>

                  <span
                    className={`badge ${
                      activity.attempt_status === 'COMPLETED' ||
                      activity.attempt_status === 'SUBMITTED'
                        ? 'badge-green'
                        : activity.attempt_status === 'IN_PROGRESS'
                        ? 'badge-blue'
                        : 'badge-gray'
                    }`}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {(activity.attempt_status || 'UNKNOWN').replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              No student examination activity has been recorded yet.
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Quick Actions</span>
        </div>

        <div className="card-body">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {[
              {
                label: 'Add Department',
                to: '/admin/departments',
                icon: Building2,
              },
              {
                label: 'Add Course',
                to: '/admin/courses',
                icon: School,
              },
              {
                label: 'Add Subject',
                to: '/admin/subjects',
                icon: BookOpen,
              },
              {
                label: 'Manage Users',
                to: '/admin/users',
                icon: Users,
              },
            ].map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.label}
                  to={action.to}
                  className="nav-item"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                  }}
                >
                  <Icon size={16} className="nav-icon" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
