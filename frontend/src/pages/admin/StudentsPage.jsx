
import { useEffect, useState } from 'react';
import { Search, GraduationCap, Plus, X } from 'lucide-react';
import { adminService } from '../../services/adminService';
import API from '../../services/api';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    scholar_no: '',
    batch_year: '2026',
    course_id: '',
    current_sem: '',
  });

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await adminService.getStudents();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading students:', err);
      setError(err.response?.data?.message || 'Unable to load students.');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await API.get('/admin/courses');
      setCourses(response.data.courses || []);
    } catch (err) {
      console.error('Error loading courses:', err);
      setFormError(
        err.response?.data?.message || 'Unable to load courses.'
      );
    }
  };

  useEffect(() => {
    loadStudents();
    loadCourses();
  }, []);

  const selectedCourse = courses.find(
    (course) => Number(course.course_id) === Number(form.course_id)
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'course_id' ? { current_sem: '' } : {}),
    }));
  };

  const resetForm = () => {
    setForm({
      full_name: '',
      email: '',
      password: '',
      scholar_no: '',
      batch_year: '2026',
      course_id: '',
      current_sem: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      setSaving(true);

      await adminService.addStudent({
        ...form,
        course_id: Number(form.course_id),
        current_sem: Number(form.current_sem),
        batch_year: Number(form.batch_year),
      });

      setShowModal(false);
      resetForm();

      await loadStudents();
    } catch (err) {
      console.error('Error creating student:', err);
      setFormError(
        err.response?.data?.message || 'Unable to create student.'
      );
    } finally {
      setSaving(false);
    }
  };

  const courseOptions = [
    ...new Map(
      students
        .filter((student) => student.course_id != null)
        .map((student) => [
          student.course_id,
          {
            course_id: student.course_id,
            course_name: student.course_name || 'Unknown Course',
          },
        ])
    ).values(),
  ];

  const filteredStudents = students.filter((student) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      student.full_name?.toLowerCase().includes(searchText) ||
      student.email?.toLowerCase().includes(searchText) ||
      student.scholar_no?.toLowerCase().includes(searchText);

    const matchesCourse =
      filterCourse === '' ||
      Number(student.course_id) === Number(filterCourse);

    return matchesSearch && matchesCourse;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p>View enrolled students and their academic details.</p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setFormError('');
            setShowModal(true);
          }}
        >
          <Plus size={16} />
          Add Student
        </button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <div className="search-box">
              <Search size={16} />
              <input
                placeholder="Search by name, email or scholar number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="student-search"
              />
            </div>

            <select
              className="form-select"
              style={{ width: 180 }}
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              id="student-course-filter"
            >
              <option value="">All Courses</option>

              {courseOptions.map((course) => (
                <option key={course.course_id} value={course.course_id}>
                  {course.course_name}
                </option>
              ))}
            </select>
          </div>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {filteredStudents.length} students
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading students...</p>
          </div>
        ) : error ? (
          <div className="card-body">
            <p style={{ color: 'var(--danger)' }}>{error}</p>
            <button className="btn btn-primary" onClick={loadStudents}>
              Retry
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state">
            <GraduationCap size={48} />
            <h3>No students found</h3>
          </div>
        ) : (
          <div className="table-overflow">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Scholar Number</th>
                  <th>Batch Year</th>
                  <th>Course</th>
                  <th>Current Semester</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.student_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {student.full_name
                            ?.split(' ')
                            .map((name) => name[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                            {student.full_name || '—'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {student.email || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>{student.scholar_no || '—'}</td>
                    <td>{student.batch_year || '—'}</td>

                    <td>
                      <span className="badge badge-blue">
                        {student.course_name || '—'}
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-purple">
                        Sem {student.current_sem ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0 }}>Add Student</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Enter the student's details.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="student-name">Full Name</label>
                <input
                  id="student-name"
                  className="form-input"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-email">Email</label>
                <input
                  id="student-email"
                  className="form-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-password">Password</label>
                <input
                  id="student-password"
                  className="form-input"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-scholar">Scholar Number</label>
                <input
                  id="student-scholar"
                  className="form-input"
                  name="scholar_no"
                  value={form.scholar_no}
                  onChange={handleChange}
                  placeholder="e.g. 25204031105"
                  maxLength={30}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-batch">Batch Year</label>
                <input
                  id="student-batch"
                  className="form-input"
                  type="number"
                  name="batch_year"
                  value={form.batch_year}
                  onChange={handleChange}
                  min="2000"
                  max="2155"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-course">Course</label>
                <select
                  id="student-course"
                  className="form-select"
                  name="course_id"
                  value={form.course_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="student-semester">Current Semester</label>
                <select
                  id="student-semester"
                  className="form-select"
                  name="current_sem"
                  value={form.current_sem}
                  onChange={handleChange}
                  required
                  disabled={!selectedCourse}
                >
                  <option value="">Select Semester</option>
                  {Array.from(
                    { length: Number(selectedCourse?.total_semester || 0) },
                    (_, index) => index + 1
                  ).map((semester) => (
                    <option key={semester} value={semester}>
                      Semester {semester}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                  {formError}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || courses.length === 0}
                >
                  {saving ? 'Saving...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
