
import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, X } from 'lucide-react';
import { adminService } from '../../services/adminService';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSubject, setEditSubject] = useState(null);

  const [form, setForm] = useState({
    subject_name: '',
    course_id: '',
    teacher_id: '',
    semester: 1
  });

  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');

  // LOAD SUBJECTS, COURSES AND TEACHERS FROM MYSQL
  const load = async () => {
    try {
      const [s, c, t] = await Promise.all([
        adminService.getSubjects(),
        adminService.getCourses(),
        adminService.getTeachers()
      ]);

      setSubjects(s || []);
      setCourses(c || []);
      setTeachers(t || []);
    } catch (error) {
      console.error(
        'Failed to load subjects:',
        error.response?.data || error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // GET COURSE NAME
  const getCourseName = (id) => {
    return courses.find((c) => c.course_id === id)?.course_name || '—';
  };

  // GET TEACHER NAME
  const getTeacherName = (subject) => {
    return subject.teacher_name || 'Not Assigned';
  };

  // ADD OR UPDATE SUBJECT
  const handleSave = async () => {
    if (
      !form.subject_name.trim() ||
      !form.course_id ||
      !form.teacher_id ||
      !form.semester
    ) {
      alert('Please fill all fields');
      return;
    }

    try {
      setSaving(true);

      const data = {
        subject_name: form.subject_name.trim(),
        course_id: Number(form.course_id),
        teacher_id: Number(form.teacher_id),
        semester: Number(form.semester)
      };

      if (editSubject) {
        await adminService.updateSubject(
          editSubject.subject_id,
          data
        );
      } else {
        await adminService.addSubject(data);
      }

      await load();
      setShowModal(false);
    } catch (error) {
      console.error(
        'Save subject error:',
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
        'Failed to save subject'
      );
    } finally {
      setSaving(false);
    }
  };

  // DELETE SUBJECT
  const handleDelete = async (id) => {
    try {
      await adminService.deleteSubject(id);
      setDeleteConfirm(null);
      await load();
    } catch (error) {
      console.error(
        'Delete subject error:',
        error.response?.data || error
      );

      alert(
        error.response?.data?.message ||
        'Failed to delete subject'
      );
    }
  };

  // OPEN ADD MODAL
  const openAdd = () => {
    setEditSubject(null);

    setForm({
      subject_name: '',
      course_id: '',
      teacher_id: '',
      semester: 1
    });

    setShowModal(true);
  };

  // OPEN EDIT MODAL
  const openEdit = (s) => {
    setEditSubject(s);

    setForm({
      subject_name: s.subject_name,
      course_id: String(s.course_id),
      teacher_id: String(s.teacher_id),
      semester: s.semester
    });

    setShowModal(true);
  };

  // SEARCH AND FILTER
  const filtered = subjects.filter((s) =>
    s.subject_name.toLowerCase().includes(search.toLowerCase()) &&
    (filterCourse === '' ||
      s.course_id === Number(filterCourse))
  );

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>Subjects</h1>
          <p>Manage subjects, courses and teacher assignments.</p>
        </div>

        <div className="page-header-actions">
          <button
            className="btn btn-primary"
            onClick={openAdd}
            id="add-subject-btn"
          >
            <Plus size={16} /> Add Subject
          </button>
        </div>
      </div>

      {/* SUBJECT TABLE */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <div className="search-box">
              <BookOpen size={16} />

              <input
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="subject-search"
              />
            </div>

            <select
              className="form-select"
              style={{ width: 180 }}
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              id="subject-course-filter"
            >
              <option value="">All Courses</option>

              {courses.map((c) => (
                <option
                  key={c.course_id}
                  value={c.course_id}
                >
                  {c.course_name}
                </option>
              ))}
            </select>
          </div>

          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)'
            }}
          >
            {filtered.length} subject
            {filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>No subjects found</h3>
          </div>
        ) : (
          <div className="table-overflow">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Subject Name</th>
                  <th>Course</th>
                  <th>Semester</th>
                  <th>Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.subject_id}>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {i + 1}
                    </td>

                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {s.subject_name}
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-blue">
                        {s.course_name || getCourseName(s.course_id)}
                      </span>
                    </td>

                    <td>
                      <span className="badge badge-purple">
                        Sem {s.semester}
                      </span>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {getTeacherName(s)}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(s)}
                          title="Edit and reassign teacher"
                        >
                          <Edit2 size={14} />
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setDeleteConfirm(s)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT SUBJECT MODAL */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3 className="modal-title">
                {editSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>

              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* SUBJECT NAME */}
              <div className="form-group">
                <label className="form-label required">
                  Subject Name
                </label>

                <input
                  className="form-input"
                  placeholder="e.g. Database Management Systems"
                  value={form.subject_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subject_name: e.target.value
                    })
                  }
                  autoFocus
                  id="subject-name-input"
                />
              </div>

              {/* COURSE */}
              <div className="form-group">
                <label className="form-label required">
                  Course
                </label>

                <select
                  className="form-select"
                  value={form.course_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      course_id: e.target.value
                    })
                  }
                  id="subject-course-select"
                >
                  <option value="">Select Course</option>

                  {courses.map((c) => (
                    <option
                      key={c.course_id}
                      value={c.course_id}
                    >
                      {c.course_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SEMESTER */}
              <div className="form-group">
                <label className="form-label required">
                  Semester
                </label>

                <select
                  className="form-select"
                  value={form.semester}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      semester: Number(e.target.value)
                    })
                  }
                  id="subject-sem-select"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      Semester {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* TEACHER ASSIGNMENT */}
              <div className="form-group">
                <label className="form-label required">
                  Assign Teacher
                </label>

                <select
                  className="form-select"
                  value={form.teacher_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      teacher_id: e.target.value
                    })
                  }
                  id="subject-teacher-select"
                >
                  <option value="">Select Teacher</option>

                  {teachers.map((t) => (
                    <option
                      key={t.teacher_id}
                      value={t.teacher_id}
                    >
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
                id="save-subject-btn"
              >
                {saving
                  ? 'Saving...'
                  : editSubject
                    ? 'Update'
                    : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
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
              <h3
                className="modal-title"
                style={{ color: 'var(--danger)' }}
              >
                Delete Subject
              </h3>

              <button
                className="modal-close"
                onClick={() => setDeleteConfirm(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="alert alert-error">
                <Trash2 size={18} />

                <div>
                  Delete <strong>{deleteConfirm.subject_name}</strong>?
                  This cannot be undone.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>

              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm.subject_id)}
                id="confirm-delete-subject-btn"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
