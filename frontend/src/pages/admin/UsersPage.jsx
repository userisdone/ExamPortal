
import { useEffect, useState } from 'react';
import {
  Search,
  Shield,
  GraduationCap,
  UserCheck,
  Users,
} from 'lucide-react';

import { adminService } from '../../services/adminService';

const ROLE_COLORS = {
  ADMIN: 'role-admin',
  TEACHER: 'role-teacher',
  STUDENT: 'role-student',
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await adminService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(
        err.response?.data?.message || 'Failed to load users.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchText) ||
      user.email?.toLowerCase().includes(searchText);

    const matchesRole =
      !roleFilter || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const roleCounts = {
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
    TEACHER: users.filter((u) => u.role === 'TEACHER').length,
    STUDENT: users.filter((u) => u.role === 'STUDENT').length,
  };

  const statCards = [
    {
      label: 'Administrators',
      value: roleCounts.ADMIN,
      color: 'purple',
      icon: Shield,
    },
    {
      label: 'Teachers',
      value: roleCounts.TEACHER,
      color: 'blue',
      icon: UserCheck,
    },
    {
      label: 'Students',
      value: roleCounts.STUDENT,
      color: 'green',
      icon: GraduationCap,
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>User Directory</h1>
          <p>
            View all system users — administrators, teachers,
            and students.
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div
        className="stat-grid"
        style={{
          gridTemplateColumns: 'repeat(3, 1fr)',
          marginBottom: 20,
        }}
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div className="stat-card" key={stat.label}>
              <div className={`stat-icon ${stat.color}`}>
                <Icon size={22} />
              </div>

              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-filters">
            <div className="search-box">
              <Search size={16} />

              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="user-search"
              />
            </div>

            <select
              className="form-select"
              style={{ width: 150 }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              id="user-role-filter"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>

          <span
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
            }}
          >
            {filteredUsers.length} users
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="card-body">
            <p style={{ color: 'var(--danger)' }}>{error}</p>

            <button className="btn btn-primary" onClick={loadUsers}>
              Retry
            </button>
          </div>
        ) : (
          <div className="table-overflow">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      style={{
                        textAlign: 'center',
                        padding: 30,
                        color: 'var(--text-muted)',
                      }}
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.user_id}>
                      <td>{user.user_id}</td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background:
                                'linear-gradient(135deg, var(--primary), var(--primary-light))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {user.full_name
                              ?.split(' ')
                              .map((name) => name[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <span style={{ fontWeight: 600 }}>
                            {user.full_name}
                          </span>
                        </div>
                      </td>

                      <td
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {user.email}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            ROLE_COLORS[user.role] || 'badge-gray'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
