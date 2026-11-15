import React, { useEffect, useState } from 'react';
import { Award, Eye, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/studentService';

const PASS_PERCENTAGE = 40;

const getStatus = (percentage) =>
  Number(percentage) >= PASS_PERCENTAGE ? 'PASS' : 'FAIL';

const formatDate = (value) => {
  if (!value) return '--';

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '--';

  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Prefer the time the attempt ended, fall back to the scheduled exam date.
const getAttemptDate = (r) => r.attempt_end || r.schedule?.exam_date || null;

 console.log("page 6");

export default function StudentResultsPage() {
  const { user } = useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedResult, setSelectedResult] = useState(null);
  const [scorecard, setScorecard] = useState([]);
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [scorecardError, setScorecardError] = useState('');

  useEffect(() => {
    if (!user?.user_id) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadResults = async () => {
      try {
        setLoading(true);
        setError('');

        const data = await studentService.getStudentResults();
        if (!active) return;

        const list = Array.isArray(data) ? [...data] : [];

        // Most recent first.
        list.sort(
          (a, b) =>
            new Date(getAttemptDate(b)) - new Date(getAttemptDate(a))
        );

        setResults(list);
      } catch (err) {
        console.error('Results error:', err.response?.data || err);

        if (active) {
          setError(
            err.response?.data?.message || 'Unable to load your results.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadResults();

    return () => {
      active = false;
    };
  }, [user?.user_id]);

  const handleViewScorecard = async (result) => {
    setSelectedResult(result);
    setScorecard([]);
    setScorecardError('');
    setScorecardLoading(true);

    try {
      const details = await studentService.getScorecard(result.result_id);
      setScorecard(Array.isArray(details) ? details : []);
    } catch (err) {
      console.error('Scorecard error:', err.response?.data || err);

      setScorecardError(
        err.response?.data?.message || 'Unable to load the scorecard.'
      );
    } finally {
      setScorecardLoading(false);
    }
  };

  const closeScorecard = () => {
    setSelectedResult(null);
    setScorecard([]);
    setScorecardError('');
  };

  const selectedStatus = selectedResult
    ? getStatus(selectedResult.percentage)
    : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Results</h1>
          <p>View your performance in published examinations.</p>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="empty-state">
            <AlertTriangle size={40} color="var(--danger)" />
            <h3>Unable to load results</h3>
            <p>{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <Award size={48} />
            <h3>No results available</h3>
            <p>
              Your examination results will appear here once published by
              the teacher.
            </p>
          </div>
        ) : (
          <div className="table-overflow">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Examination</th>
                  <th>Date Attempted</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {results.map((r) => {
                  const status = getStatus(r.percentage);

                  return (
                    <tr key={r.result_id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {r.subject?.subject_name || 'Subject'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          {r.exam?.exam_name}
                        </div>
                      </td>

                      <td style={{ fontSize: '0.85rem' }}>
                        {formatDate(getAttemptDate(r))}
                      </td>

                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: 'var(--primary)',
                            fontSize: '1.1rem'
                          }}
                        >
                          {r.obtained_marks}{' '}
                          <span
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              fontWeight: 500
                            }}
                          >
                            / {r.exam?.total_marks ?? r.total_marks}
                          </span>
                        </span>
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}
                        >
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div
                              className={`progress-fill ${
                                r.percentage >= 75
                                  ? 'green'
                                  : r.percentage >= PASS_PERCENTAGE
                                    ? 'amber'
                                    : 'red'
                              }`}
                              style={{
                                width: `${Math.min(100, r.percentage)}%`
                              }}
                            />
                          </div>

                          <span
                            style={{ fontSize: '0.85rem', fontWeight: 600 }}
                          >
                            {r.percentage}%
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            status === 'PASS' ? 'badge-green' : 'badge-red'
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewScorecard(r)}
                        >
                          <Eye size={14} /> View Scorecard
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scorecard Modal */}
      {selectedResult && (
        <div className="modal-overlay" onClick={closeScorecard}>
          <div
            className="modal modal-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg)' }}
          >
            <div className="modal-header" style={{ background: 'white' }}>
              <div>
                <h3 className="modal-title">
                  Scorecard: {selectedResult.subject?.subject_name}
                </h3>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    margin: 0
                  }}
                >
                  {selectedResult.exam?.exam_name}
                </p>
              </div>

              <button className="modal-close" onClick={closeScorecard}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 0 }}>
              <div
                style={{
                  background: 'white',
                  padding: '24px 32px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      Total Marks
                    </div>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)'
                      }}
                    >
                      {selectedResult.obtained_marks}{' '}
                      <span
                        style={{
                          fontSize: '1rem',
                          color: 'var(--text-muted)'
                        }}
                      >
                        /{' '}
                        {selectedResult.exam?.total_marks ??
                          selectedResult.total_marks}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      Percentage
                    </div>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color:
                          selectedStatus === 'PASS'
                            ? 'var(--success)'
                            : 'var(--danger)'
                      }}
                    >
                      {selectedResult.percentage}%
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className={`badge ${
                      selectedStatus === 'PASS' ? 'badge-green' : 'badge-red'
                    }`}
                    style={{ fontSize: '1rem', padding: '6px 16px' }}
                  >
                    {selectedStatus}
                  </span>
                </div>
              </div>

              <div style={{ padding: 24 }}>
                <h4 style={{ marginBottom: 16, fontSize: '1rem' }}>
                  Question-wise Analysis
                </h4>

                {scorecardLoading ? (
                  <div style={{ padding: 40, textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </div>
                ) : scorecardError ? (
                  <div className="alert alert-warning">
                    <AlertTriangle size={18} />
                    {scorecardError}
                  </div>
                ) : scorecard.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>
                    No question details are available for this result.
                  </p>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}
                  >
                    {scorecard.map((sc, index) => {
                      const isMCQ = sc.question?.question_type === 'MCQ';
                      const answered = sc.selected_option_id != null;

                      const isCorrect =
                        isMCQ &&
                        answered &&
                        Number(sc.selected_option_id) ===
                          Number(sc.correct_option?.option_id);

                      let rowClass = 'scorecard-row ';

                      if (isMCQ) {
                        if (!answered) rowClass += 'unanswered';
                        else if (isCorrect) rowClass += 'correct';
                        else rowClass += 'incorrect';
                      } else {
                        rowClass += 'theory';
                      }

                      return (
                        <div
                          key={sc.scorecard_id}
                          className={rowClass}
                          style={{
                            background: 'white',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              width: '100%',
                              marginBottom: 12
                            }}
                          >
                            <div style={{ display: 'flex', gap: 12 }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: 'var(--text-muted)'
                                }}
                              >
                                Q{index + 1}.
                              </span>

                              <div>
                                <div
                                  style={{
                                    fontWeight: 500,
                                    fontSize: '0.9rem',
                                    marginBottom: 4
                                  }}
                                >
                                  {sc.question?.question_text}
                                </div>

                                <span
                                  className={`badge ${
                                    isMCQ ? 'badge-blue' : 'badge-purple'
                                  }`}
                                  style={{ fontSize: '0.65rem' }}
                                >
                                  {sc.question?.question_type}
                                </span>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: 'var(--primary)'
                                }}
                              >
                                {sc.marks_obtained} / {sc.question?.marks}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--text-muted)'
                                }}
                              >
                                Marks
                              </div>
                            </div>
                          </div>

                          {/* Detailed response display */}
                          <div style={{ paddingLeft: 30 }}>
                            {isMCQ ? (
                              <div style={{ fontSize: '0.85rem' }}>
                                {!answered ? (
                                  <span
                                    style={{
                                      color: 'var(--text-muted)',
                                      fontStyle: 'italic'
                                    }}
                                  >
                                    Not answered
                                  </span>
                                ) : (
                                  <>
                                    <div
                                      style={{
                                        color: isCorrect
                                          ? 'var(--success)'
                                          : 'var(--danger)',
                                        marginBottom: 4
                                      }}
                                    >
                                      <strong>Your Answer:</strong>{' '}
                                      {sc.selected_option?.option_text}
                                    </div>

                                    {!isCorrect && (
                                      <div style={{ color: 'var(--success)' }}>
                                        <strong>Correct Answer:</strong>{' '}
                                        {sc.correct_option?.option_text}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            ) : (
                              <div
                                style={{
                                  background: 'var(--bg)',
                                  padding: '10px 14px',
                                  borderRadius: 6,
                                  fontSize: '0.85rem',
                                  border: '1px solid var(--border)'
                                }}
                              >
                                <strong>Your Answer:</strong>
                                <br />
                                <div
                                  style={{
                                    whiteSpace: 'pre-wrap',
                                    marginTop: 4,
                                    color: 'var(--text-secondary)'
                                  }}
                                >
                                  {sc.written_answer || (
                                    <span
                                      style={{
                                        fontStyle: 'italic',
                                        color: 'var(--text-muted)'
                                      }}
                                    >
                                      Not answered
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}