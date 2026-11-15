
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  Search,
  Calendar,
  Clock,
  BookOpen,
  Users
} from 'lucide-react';

import { teacherService } from '../../services/teacherService';

export default function TeacherExamsPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Load exams from MySQL through the backend API
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await teacherService.getExams();
        setExams(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load exams:', error);
        setExams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Search by exam name or subject
  const filtered = exams.filter((exam) => {
    const examName = (exam.exam_name || '').toLowerCase();
    const subjectName = (
      exam.subject?.subject_name || ''
    ).toLowerCase();

    const searchText = search.toLowerCase();

    return (
      examName.includes(searchText) ||
      subjectName.includes(searchText)
    );
  });

  // Calculate exam status
  const getStatusBadge = (exam) => {
    if (!exam.schedule) {
      return (
        <span className="badge badge-gray">
          Not Scheduled
        </span>
      );
    }

    const now = new Date();

    const examDate = new Date(
      `${String(exam.schedule.exam_date).slice(0, 10)}T${exam.schedule.start_time}`
    );

    const endDate = new Date(
      `${String(exam.schedule.exam_date).slice(0, 10)}T${exam.schedule.end_time}`
    );

    if (now < examDate) {
      return (
        <span className="badge badge-blue">
          Upcoming
        </span>
      );
    }

    if (now >= examDate && now <= endDate) {
      return (
        <span className="badge badge-green">
          Live
        </span>
      );
    }

    return (
      <span className="badge badge-gray">
        Completed
      </span>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>My Examinations</h1>
          <p>
            View and manage all examinations you have created.
          </p>
        </div>

        <div className="page-header-actions">
          <Link
            to="/teacher/create-exam"
            className="btn btn-primary"
          >
            <Plus size={16} />
            Create Exam
          </Link>
        </div>
      </div>

      {/* Exam Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div
            className="search-box"
            style={{ minWidth: 300 }}
          >
            <Search size={16} />

            <input
              type="text"
              placeholder="Search by exam name or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)'
            }}
          >
            {filtered.length} exam
            {filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <ClipboardList size={48} />

            <h3>No examinations found</h3>

            <p>
              You haven't created any examinations yet,
              or none match your search.
            </p>

            <Link
              to="/teacher/create-exam"
              className="btn btn-primary"
              style={{ marginTop: 16 }}
            >
              Create First Exam
            </Link>
          </div>
        ) : (
          <div className="table-overflow">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Name</th>
                  <th>Subject</th>
                  <th>Schedule</th>
                  <th>Duration & Marks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((exam) => (
                  <tr key={exam.exam_id}>
                    {/* Exam Name */}
                    <td>
                      <strong>
                        {exam.exam_name || 'Untitled Exam'}
                      </strong>
                    </td>

                    {/* Subject */}
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: 'var(--primary-pale)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)'
                          }}
                        >
                          <BookOpen size={14} />
                        </div>

                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: '0.875rem'
                          }}
                        >
                          {exam.subject?.subject_name || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Schedule */}
                    <td>
                      {exam.schedule ? (
                        <div
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 2
                            }}
                          >
                            <Calendar size={13} />

                            {new Date(
                              `${String(exam.schedule.exam_date).slice(0, 10)}T00:00:00`
                            ).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              color: 'var(--text-muted)'
                            }}
                          >
                            <Clock size={13} />

                            {String(exam.schedule.start_time).slice(0, 5)}
                            {' - '}
                            {String(exam.schedule.end_time).slice(0, 5)}
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          Unscheduled
                        </span>
                      )}
                    </td>

                    {/* Duration and Marks */}
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                          }}
                        >
                          {exam.total_marks} Marks
                        </div>

                        <div
                          style={{
                            color: 'var(--text-muted)'
                          }}
                        >
                          {exam.duration} mins
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      {getStatusBadge(exam)}
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="table-actions">
                        <Link
                          to="/teacher/schedule"
                          className="btn btn-ghost btn-sm"
                          title="Schedule"
                        >
                          <Calendar size={14} />
                        </Link>

                        <Link
                          to="/teacher/results"
                          className="btn btn-ghost btn-sm"
                          title="Results"
                        >
                          <Users size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
