
import { useEffect, useState } from 'react';
import { Award, CheckCircle, RefreshCw } from 'lucide-react';
import { teacherService } from '../../services/teacherService';

export default function TeacherResultsPage() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  // Load examinations from MySQL
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await teacherService.getExams();
        const examList = Array.isArray(data) ? data : [];

        setExams(examList);

        if (examList.length > 0) {
          setSelectedExamId(String(examList[0].exam_id));
        }
      } catch (err) {
        console.error('Failed to load examinations:', err);
        setError('Unable to load examinations.');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Load results for selected examination
  const fetchResults = async () => {
    if (!selectedExamId) {
      setResults([]);
      return;
    }

    try {
      setResultsLoading(true);
      setError('');

      const data = await teacherService.getExamResults(
        Number(selectedExamId)
      );

      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load results:', err);
      setError('Unable to load examination results.');
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedExamId]);

  // Publish result
  const handlePublish = async (resultId) => {
    try {
      setPublishing(true);
      setError('');

      await teacherService.publishResult(resultId);
      await fetchResults();
    } catch (err) {
      console.error('Failed to publish result:', err);
      setError('Unable to publish this result.');
    } finally {
      setPublishing(false);
    }
  };

  const selectedExam = exams.find(
    (exam) => Number(exam.exam_id) === Number(selectedExamId)
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Results Management</h1>
          <p>
            Review student performance and publish results.
          </p>
        </div>
      </div>

      {/* Examination Selection */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div
          className="card-body"
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">
              Select Examination
            </label>

            <select
              className="form-select"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={loading || exams.length === 0}
            >
              {exams.length === 0 && (
                <option value="">
                  No examinations available
                </option>
              )}

              {exams.map((exam) => (
                <option
                  key={exam.exam_id}
                  value={exam.exam_id}
                >
                  {exam.exam_name} - {exam.subject?.subject_name || 'Unknown Subject'}
                </option>
              ))}
            </select>
          </div>

          {selectedExam && (
            <div
              style={{
                display: 'flex',
                gap: 16,
                alignSelf: 'flex-end',
                marginBottom: 4
              }}
            >
              <div
                style={{
                  background: 'var(--bg)',
                  padding: '8px 16px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border)'
                }}
              >
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                  }}
                >
                  TOTAL MARKS
                </div>

                <div style={{ fontWeight: 700 }}>
                  {selectedExam.total_marks}
                </div>
              </div>

              <button
                className="btn btn-secondary"
                onClick={fetchResults}
                disabled={resultsLoading}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Results Table */}
      <div className="table-container">
        {loading || resultsLoading ? (
          <div className="loading-state">
            <div className="spinner" />
          </div>
        ) : !selectedExamId ? (
          <div className="empty-state">
            <Award size={48} />
            <h3>No examinations available</h3>
            <p>Create an examination before managing results.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <Award size={48} />
            <h3>No results yet</h3>
            <p>
              No students have completed this examination.
            </p>
          </div>
        ) : (
          <div className="table-overflow">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Scholar No</th>
                  <th>Marks Obtained</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {results.map((result) => (
                  <tr key={result.result_id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {result.student_name || '—'}
                      </span>
                    </td>

                    <td>
                      <code
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {result.scholar_no || '—'}
                      </code>
                    </td>

                    <td
                      style={{
                        fontWeight: 700,
                        color: 'var(--primary)'
                      }}
                    >
                      {result.obtained_marks} / {selectedExam?.total_marks}
                    </td>

                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <div
                          className="progress-bar"
                          style={{ width: 60 }}
                        >
                          <div
                            className={`progress-fill ${
                              Number(result.percentage) >= 75
                                ? 'green'
                                : Number(result.percentage) >= 40
                                ? 'amber'
                                : 'red'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, Number(result.percentage) || 0)
                              )}%`
                            }}
                          />
                        </div>

                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 600
                          }}
                        >
                          {result.percentage ?? 0}%
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          result.result_status === 'PASS'
                            ? 'badge-green'
                            : 'badge-red'
                        }`}
                      >
                        {result.result_status || 'Pending'}
                      </span>
                    </td>

                    <td>
                      {result.is_published ? (
                        <span className="badge badge-blue">
                          <CheckCircle
                            size={10}
                            style={{ marginRight: 2 }}
                          />
                          Published
                        </span>
                      ) : (
                        <span className="badge badge-gray">
                          Draft
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="table-actions">
                        {!result.is_published && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handlePublish(result.result_id)}
                            disabled={publishing}
                          >
                            Publish
                          </button>
                        )}
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
