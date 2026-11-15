
import { useEffect, useState } from 'react';
import { Users, Trash2, X, Plus, UserPlus } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    department_ids: []
  });

  const load = async () => {
  try {
    setLoading(true);

    const [teacherData, departmentData] = await Promise.all([
      adminService.getTeachers(),
      adminService.getDepartments(),
    ]);

    console.log("TEACHER DATA:", teacherData);
    console.log("DEPARTMENT DATA:", departmentData);

    setTeachers(teacherData);
    setDepartments(departmentData);
  } catch (error) {
    console.error("LOAD ERROR:", error);
    setError("Failed to load teachers");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    load();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
  const { name, value, selectedOptions } = e.target;

  if (name === "department_ids") {
    const selected = Array.from(
      selectedOptions,
      option => Number(option.value)
    );

    setForm(prev => ({
      ...prev,
      department_ids: selected
    }));
    return;
  }

  setForm(prev => ({
    ...prev,
    [name]: value
  }));
  };

  // Create teacher
  const handleCreate = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    console.log('FORM SUBMITTED');
    console.log('FORM DATA:', form);

    if (
      !form.full_name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.department_ids.length
    ) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setSaving(true);

      const teacherData = {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        department_ids: form.department_ids
      };

      const response = await adminService.addTeacher(teacherData);

      console.log('TEACHER API RESPONSE:', response);

      setSuccess('Teacher created successfully!');

      setForm({
        full_name: '',
        email: '',
        password: '',
        department_ids: []
      });

      setShowForm(false);

      // Fetch the updated list from MySQL
      await load();

    } catch (err) {
      console.error(
        'CREATE TEACHER ERROR:',
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
        'Unable to create teacher.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete teacher
  const handleDelete = async () => {
    try {
      setError('');

      await adminService.deleteTeacher(deleteConfirm.teacher_id);

      setDeleteConfirm(null);
      setSuccess('Teacher removed successfully.');

      await load();

    } catch (err) {
      console.error('Delete teacher error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to delete teacher.'
      );
    }
  };

  // Search teachers
  const filtered = teachers.filter((teacher) =>
  teacher.full_name?.toLowerCase().includes(search.toLowerCase()) ||
  teacher.email?.toLowerCase().includes(search.toLowerCase()) ||
  teacher.department_names?.toLowerCase().includes(search.toLowerCase())
);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Teachers</h1>
          <p>View and manage teaching staff profiles.</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setError('');
            setSuccess('');
            setShowForm(true);
          }}
        >
          <Plus size={16} /> Add Teacher
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {success}
        </div>
      )}

      {/* Create Teacher Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">
              <UserPlus size={18} /> Create Teacher Account
            </span>

            <button
              type="button"
              className="modal-close"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreate}>
            <div className="card-body">
              <div className="form-grid">

                {/* Full Name */}
                <div className="form-group">
                  <label htmlFor="full_name">Full Name</label>
                  <input
                    id="full_name"
                    type="text"
                    name="full_name"
                    placeholder="Enter full name"
                    value={form.full_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="teacher@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Minimum 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    minLength={6}
                    required
                  />
                </div>

                {/* Department */}
                
                 <div className="form-group">
                  <label htmlFor="department_ids">
                    Departments
                  </label>

                  <select
                    id="department_ids"
                    name="department_ids"
                    multiple
                    value={form.department_ids.map(String)}
                    onChange={handleChange}
                    required
                    size={Math.min(departments.length || 3, 5)}
                  >
                    {departments.map((dept) => (
                      <option
                        key={dept.department_id}
                        value={dept.department_id}
                      >
                        {dept.department_name}
                      </option>
                    ))}
                  </select>

                  <small>Hold Ctrl (Windows) to select multiple departments.</small>
                </div>

              </div>
            </div>

            <div className="card-body" style={{ paddingTop: 0 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                <UserPlus size={16} />
                {saving ? 'Creating...' : 'Create Teacher'}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginLeft: 10 }}
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teachers Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-box">
            <Users size={16} />

            <input
              id="teacher-search"
              type="search"
              placeholder="Search teachers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search teachers"
            />
          </div>

          <span style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)'
          }}>
            {filtered.length} teachers
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading teachers...</p>
          </div>
        ) : (
          <div className="table-overflow">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Subjects</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{ textAlign: 'center', padding: 30 }}
                    >
                      No teachers found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((teacher) => (
                    <tr key={teacher.teacher_id}>
                      <td>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10
                        }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {teacher.full_name?.split(' ')
                              .map(n => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {teacher.full_name}
                            </div>

                            <div style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)'
                            }}>
                              {teacher.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-blue">
                          Teacher
                        </span>
                      </td>

                      <td style={{ fontSize: '0.82rem' }}>
                        {teacher.department_names || '—'}
                      </td>

                      <td>
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)'
                        }}>
                          None assigned
                        </span>
                      </td>

                      <td>
                        <span className="badge badge-green">
                          Active
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteConfirm(teacher)}
                          title="Remove teacher"
                          aria-label={`Remove ${teacher.full_name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)' }}>
                Remove Teacher
              </h3>

              <button
                type="button"
                className="modal-close"
                onClick={() => setDeleteConfirm(null)}
                aria-label="Close confirmation"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="alert alert-error">
                <Trash2 size={18} />

                <div>
                  Remove <strong>{deleteConfirm.full_name}</strong>?
                  This will remove their teacher record.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
