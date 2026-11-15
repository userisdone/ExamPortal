import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CheckCircle,
  CalendarDays,
  AlertTriangle,
  Zap,
  RefreshCw
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/studentService';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const PASS_PERCENTAGE = 40;

console.log("page 4");

// Build a local Date from a 'YYYY-MM-DD' (or ISO) date and an 'HH:MM:SS' time.
const getExamDateTime = (date, time) => {
  if (!date || !time) return null;

  let datePart = String(date).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;

    datePart = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
  }

  const result = new Date(`${datePart}T${String(time).slice(0, 8)}`);
  return Number.isNaN(result.getTime()) ? null : result;
};

const formatExamDate = (date) => {
  if (!date) return 'Date unavailable';

  const datePart = String(date).slice(0, 10);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(datePart)
    ? new Date(`${datePart}T00:00:00`)
    : new Date(date);

  if (Number.isNaN(parsed.getTime())) return 'Date unavailable';

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatExamTime = (time) => {
  if (!time) return '--:--';

  const [hours, minutes] = String(time).slice(0, 5).split(':');

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export default function StudentDashboard() {
  const { user } = useAuth();

  const [schedules, setSchedules] = useState([]);
  const [results, setResults] = useState([]);
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      const [scheduleData, resultData, profile] = await Promise.all([
        studentService.getAvailableExams(),
        studentService.getStudentResults(),
        // A profile failure should not break the whole dashboard.
        studentService.getStudentProfile().catch(() => null)
      ]);

      setSchedules(Array.isArray(scheduleData) ? scheduleData : []);

      setResults(
        Array.isArray(resultData)
          ? resultData.filter((r) => r.is_published)
          : []
      );

      setSemester(profile?.semester?.semester_number || 1);
    } catch (err) {
      console.error(
        'Dashboard loading error:',
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          'Unable to load dashboard data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      loadDashboard();
    } else {
      setLoading(false);
    }
  }, [user?.user_id]);

  // Upcoming and live exams that are not yet submitted.
  const visibleUpcoming = useMemo(() => {
    const now = new Date();

    return schedules
      .map((exam) => ({
        ...exam,
        startDate: getExamDateTime(exam.exam_date, exam.start_time),
        endDate: getExamDateTime(exam.exam_date, exam.end_time)
      }))
      .filter(
        (exam) =>
          exam.startDate &&
          exam.endDate &&
          now <= exam.endDate &&
          exam.attempt_status !== 'SUBMITTED' &&
          exam.attempt_status !== 'COMPLETED'
      )
      .sort((a, b) => a.startDate - b.startDate);
  }, [schedules]);

  // Dashboard stats computed from real data.
  // const stats = useMemo(() => {
  //   const completed = schedules.filter(
  //     (s) =>
  //       s.attempt_status === 'SUBMITTED' ||
  //       s.attempt_status === 'COMPLETED'
  //   ).length;

  //   const average = results.length
  //     ? results.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0) /
  //       results.length
  //     : 0;

  //   return {
  //     upcoming: visibleUpcoming.length,
  //     completed,
  //     average: Number(average.toFixed(1))
  //   };
  // }, [schedules, results, visibleUpcoming]);

  const stats = useMemo(() => {
    const completed = schedules.filter((exam) => {
        const status = String(exam.attempt_status || '')
            .trim()
            .toUpperCase();

        return status === 'SUBMITTED' || status === 'COMPLETED';
    }).length;

    const average = results.length
        ? results.reduce(
            (sum, result) => sum + (Number(result.percentage) || 0),
            0
          ) / results.length
        : 0;

    return {
        upcoming: visibleUpcoming.length,
        completed,
        average: Number(average.toFixed(1))
    };
}, [schedules, results, visibleUpcoming]);

  // Latest 3 published results (backend returns newest first).
  const recentResults = results.slice(0, 3);

  // Chart in chronological order.
  const chartData = [...recentResults]
    .map((r) => ({
      name: r.subject?.subject_name || 'Exam',
      score: Number(r.percentage) || 0
    }))
    .reverse();

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertTriangle size={40} color="var(--danger)" />
        <h2>Dashboard unavailable</h2>
        <p>{error}</p>

        <button className="btn btn-primary" onClick={loadDashboard}>
          <RefreshCw size={16} />
          Try Again
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

  return (
    <div>
      {/* Welcome Banner */}
      <div
        className="welcome-banner"
        style={{
          background:
            'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)'
        }}
      >
        <h1>
          {greeting}, {user?.full_name?.split(' ')[0]}!
        </h1>

        <p>Ready for your upcoming examinations?</p>

        <div className="welcome-stats">
          <div className="welcome-stat">
            <div className="ws-value">{stats.upcoming}</div>
            <div className="ws-label">Upcoming Exams</div>
          </div>

          <div className="welcome-stat">
            <div className="ws-value">{stats.completed}</div>
            <div className="ws-label">Completed Exams</div>
          </div>

          <div className="welcome-stat">
            <div className="ws-value">{stats.average}%</div>
            <div className="ws-label">Average Score</div>
          </div>

          <div className="welcome-stat">
            <div className="ws-value">Sem {semester}</div>
            <div className="ws-label">Current Semester</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Upcoming Examinations */}
        <div className="card">
          <div className="card-header">
            <span
              className="card-title"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Upcoming Examinations
              {visibleUpcoming.length > 0 && (
                <span className="badge badge-blue">
                  {visibleUpcoming.length}
                </span>
              )}
            </span>

            <Link to="/student/exams" className="btn btn-ghost btn-sm">
              View All
            </Link>
          </div>

          <div className="card-body">
            {visibleUpcoming.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <CheckCircle size={36} color="var(--success)" />

                <h3 style={{ color: 'var(--success)', marginTop: 10 }}>
                  All clear!
                </h3>

                <p>You have no pending examinations at the moment.</p>
              </div>
            ) : (
              visibleUpcoming.slice(0, 3).map((u) => {
                const now = new Date();
                const isLive = now >= u.startDate && now <= u.endDate;

                const examName =
                  u.exam?.exam_name || u.exam_name || 'Examination';

                const subjectName =
                  u.subject?.subject_name || u.subject_name || 'Subject';

                const duration = u.exam?.duration ?? u.duration;

                return (
                  <div
                    key={u.schedule_id}
                    className="exam-card"
                    style={{ marginBottom: 12 }}
                  >
                    <div
                      className="exam-card-icon"
                      style={{
                        background: isLive
                          ? 'var(--success-light)'
                          : 'var(--info-light)',
                        color: isLive ? 'var(--success)' : 'var(--info)'
                      }}
                    >
                      {isLive ? (
                        <Zap size={20} />
                      ) : (
                        <CalendarDays size={20} />
                      )}
                    </div>

                    <div className="exam-card-content">
                      <div className="exam-card-title">{examName}</div>

                      <div
                        className="exam-card-meta"
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 6
                        }}
                      >
                        <span>{subjectName}</span>
                        <span>•</span>
                        <span>{formatExamDate(u.exam_date)}</span>
                        <span>•</span>
                        <span>
                          {formatExamTime(u.start_time)}
                          {' - '}
                          {formatExamTime(u.end_time)}
                        </span>

                        {duration != null && (
                          <>
                            <span>•</span>
                            <span>{duration} mins</span>
                          </>
                        )}
                      </div>
                    </div>

                    {isLive ? (
                      <Link
                        to={`/student/exam/${u.schedule_id}`}
                        className="btn btn-success btn-sm"
                      >
                        Start Exam
                      </Link>
                    ) : (
                      <span className="badge badge-gray">Upcoming</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Performance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Performance</span>

            <Link to="/student/results" className="btn btn-ghost btn-sm">
              All Results
            </Link>
          </div>

          <div className="card-body">
            {recentResults.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <Award size={36} />

                <h3 style={{ marginTop: 10 }}>No results yet</h3>

                <p>Complete exams to see your performance.</p>
              </div>
            ) : (
              <>
                {/* Performance Chart */}
                <div
                  style={{ height: 180, width: '100%', marginBottom: 16 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f0f0f0"
                      />

                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11 }}
                      />

                      <YAxis hide domain={[0, 100]} />

                      <Tooltip
                        contentStyle={{
                          borderRadius: 8,
                          border: 'none',
                          boxShadow: 'var(--shadow-md)'
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="var(--primary)"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                          fill: 'var(--primary)',
                          strokeWidth: 2,
                          stroke: 'white'
                        }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Recent Results */}
                <div>
                  {recentResults.map((r, i) => {
                    const passed =
                      Number(r.percentage) >= PASS_PERCENTAGE;

                    return (
                      <div
                        key={r.result_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderTop:
                            i > 0 ? '1px solid var(--border)' : 'none'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: passed
                                ? 'var(--success)'
                                : 'var(--danger)'
                            }}
                          />

                          <span
                            style={{ fontSize: '0.85rem', fontWeight: 500 }}
                          >
                            {r.subject?.subject_name || 'Subject'}
                          </span>
                        </div>

                        <span
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-primary)'
                          }}
                        >
                          {r.percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}