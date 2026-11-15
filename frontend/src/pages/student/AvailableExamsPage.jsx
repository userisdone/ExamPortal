
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Clock,
  Calendar,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/studentService';

console.log("page 1");

export default function AvailableExamsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.user_id) {
      setLoading(false);
      return;
    }

    const loadExams = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await studentService.getAvailableExams(user.user_id);

        console.log('Available exams API response:', data);

        setExams(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(
          'Available exams error:',
          err.response?.data || err
        );

        setError(
          err.response?.data?.message ||
          'Unable to load available examinations.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, [user?.user_id]);

  const handleStartExam = (scheduleId) => {
    navigate(`/student/exam/${scheduleId}`);
  };

  // Convert MySQL date/time values into local JavaScript dates.
  // Important: API date is a UTC timestamp, so convert it to local date first.
  const getExamDateTime = (date, time) => {
    if (!date || !time) return null;

    const localDate = new Date(date);

    if (Number.isNaN(localDate.getTime())) return null;

    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');

    const timePart = String(time).slice(0, 8);

    const result = new Date(
      `${year}-${month}-${day}T${timePart}`
    );

    return Number.isNaN(result.getTime()) ? null : result;
  };

  // Format exam date in local timezone.
  const formatExamDate = (date) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable';
    }

    return parsedDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format time in 12-hour format.
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

  // Keep only upcoming and currently running examinations.
  const visibleExams = exams
    .map((exam) => ({
      ...exam,
      startDate: getExamDateTime(
        exam.exam_date,
        exam.start_time
      ),
      endDate: getExamDateTime(
        exam.exam_date,
        exam.end_time
      )
    }))

     .filter((exam) => {
  return (
    exam.startDate &&
    exam.endDate &&
    new Date() <= exam.endDate &&
    exam.attempt_status !== 'SUBMITTED' &&
    exam.attempt_status !== 'COMPLETED'
  );
})
  .sort((a, b) => a.startDate - b.startDate);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Available Examinations</h1>
          <p>View and start your scheduled examinations.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading examinations...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertTriangle size={40} />
          <h2>Unable to load examinations</h2>
          <p>{error}</p>
        </div>
      ) : visibleExams.length === 0 ? (
        <div
          className="empty-state"
          style={{
            background: 'white',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border)',
            padding: '80px 20px'
          }}
        >
          <ClipboardList
            size={56}
            style={{ color: 'var(--success)' }}
          />

          <h2 style={{ marginTop: 16 }}>
            No upcoming examinations
          </h2>

          <p>
            You have no upcoming or currently running examinations.
            Check back later!
          </p>
        </div>
      ) : (
        <div className="grid-3">
          {visibleExams.map((exam) => {
            const now = new Date();

            const isLive =
              now >= exam.startDate && now <= exam.endDate;

            const formattedDate = formatExamDate(exam.exam_date);

            // Support both direct API fields and nested service fields.
            const examName =
              exam.exam?.exam_name || exam.exam_name || 'Examination';

            const subjectName =
              exam.subject?.subject_name ||
              exam.subject_name ||
              'Subject';

            const duration =
              exam.exam?.duration ?? exam.duration;

            const totalMarks =
              exam.exam?.total_marks ?? exam.total_marks;

            return (
              <div
                key={exam.schedule_id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <div
                  className="card-header"
                  style={{
                    background: isLive
                      ? 'var(--success-light)'
                      : 'var(--bg)',
                    borderBottomColor: isLive
                      ? 'var(--success)'
                      : 'var(--border)'
                  }}
                >
                  <span
                    className="card-title"
                    style={{
                      color: isLive
                        ? 'var(--success)'
                        : 'var(--text-primary)'
                    }}
                  >
                    {examName}
                  </span>

                  {isLive && (
                    <span
                      className="badge badge-green"
                      style={{ animation: 'pulse 2s infinite' }}
                    >
                      LIVE NOW
                    </span>
                  )}
                </div>

                <div className="card-body" style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      marginBottom: 16
                    }}
                  >
                    {subjectName}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <Calendar size={16} color="var(--primary)" />
                      {formattedDate}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <Clock size={16} color="var(--primary)" />
                      {formatExamTime(exam.start_time)} -{' '}
                      {formatExamTime(exam.end_time)}
                      {duration != null && ` (${duration} minutes)`}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <ClipboardList
                        size={16}
                        color="var(--primary)"
                      />
                      {totalMarks != null
                        ? `${totalMarks} Marks`
                        : 'Marks not specified'}
                    </div>
                  </div>
                </div>

                <div
                  className="card-footer"
                  style={{ background: 'white' }}
                >
                  {isLive ? (
                    <button
                      className="btn btn-success"
                      style={{
                        width: '100%',
                        justifyContent: 'center'
                      }}
                      onClick={() =>
                        handleStartExam(exam.schedule_id)
                      }
                    >
                      <ShieldAlert size={16} />
                      Start Examination
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary"
                      style={{
                        width: '100%',
                        justifyContent: 'center'
                      }}
                      disabled
                    >
                      Starts at {formatExamTime(exam.start_time)}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
