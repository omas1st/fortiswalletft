import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit } from 'react-icons/fi';
import api from '../../utils/api';
import './AdminUsers.css';

const fmtUsd = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/users');
        setUsers(data.users || []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Could not load users');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="admin-users">
      <h2>Users Details</h2>
      {error && <div className="form-error">{error}</div>}
      {loading ? (
        <div className="spinner" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Total Balance</th>
                <th>Wallet Address</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>{fmtUsd(u.totalBalance)}</td>
                  <td className="mono">{u.walletAddress}</td>
                  <td>
                    <button className="edit-btn" onClick={() => navigate(`/admin/users/${u._id}`)}>
                      <FiEdit /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="6" className="empty">No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;