import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import './AdminApprovals.css';

const AdminApprovals = () => {
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, w] = await Promise.all([
        api.get('/admin/approvals'),
        api.get('/admin/withdrawals'),
      ]);
      setPayments(p.data.approvals || []);
      setWithdrawals(w.data.withdrawals || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const approvePayment = async (id) => {
    setMsg('');
    try {
      await api.post(`/admin/approvals/${id}/approve`);
      setMsg('Payment approved and user credited');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not approve payment');
    }
  };

  const approveWithdrawal = async (id) => {
    setMsg('');
    try {
      await api.post(`/admin/withdrawals/${id}/approve`);
      setMsg('Withdrawal approved');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not approve withdrawal');
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="admin-approvals">
      <h2>Admin Approval</h2>
      {error && <div className="form-error">{error}</div>}
      {msg && <div className="form-info">{msg}</div>}

      <section>
        <h3>Payment Approvals</h3>
        {payments.length === 0 && <p className="empty">No pending payments</p>}
        {payments.map((p) => (
          <div key={p._id} className="approval-card">
            <div className="approval-info">
              <p><span>Name:</span> {p.name || `${p.user?.firstName || ''} ${p.user?.lastName || ''}`}</p>
              <p><span>Email:</span> {p.email || p.user?.email}</p>
              <p><span>Amount:</span> ${Number(p.amount).toFixed(2)}</p>
              <p><span>Asset:</span> {p.symbol}</p>
              <p><span>User Total Balance:</span> ${Number(p.totalBalance || 0).toFixed(2)}</p>
              <p><span>Method:</span> {p.method || 'card'}</p>
              <p><span>Date:</span> {new Date(p.createdAt).toLocaleString()}</p>
            </div>
            <button className="primary-btn" onClick={() => approvePayment(p._id)}>Approve</button>
          </div>
        ))}
      </section>

      <section>
        <h3>Withdrawal Approvals</h3>
        {withdrawals.length === 0 && <p className="empty">No pending withdrawals</p>}
        {withdrawals.map((w) => (
          <div key={w._id} className="approval-card">
            <div className="approval-info">
              <p><span>User:</span> {w.user?.firstName} {w.user?.lastName} ({w.user?.email})</p>
              <p><span>Asset:</span> {w.symbol}</p>
              <p><span>Amount:</span> {w.amount} {w.symbol}</p>
              <p><span>Bank:</span> {w.bankName}</p>
              <p><span>Status:</span> {w.status}</p>
              <p><span>Date:</span> {new Date(w.createdAt).toLocaleString()}</p>
            </div>
            <button className="primary-btn" onClick={() => approveWithdrawal(w._id)}>Approve Withdrawal</button>
          </div>
        ))}
      </section>
    </div>
  );
};

export default AdminApprovals;