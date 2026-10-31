import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api';
import './AdminApprovals.css';

const AdminApprovals = () => {
  const [payments, setPayments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [unverified, setUnverified] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Reject Modal State
  const [rejectData, setRejectData] = useState({ isOpen: false, id: null, type: null });
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    try {
      const [p, w, u] = await Promise.all([
        api.get('/admin/approvals'),
        api.get('/admin/withdrawals'),
        api.get('/admin/unverified-withdrawals'),
      ]);
      setPayments(p.data.approvals || []);
      setWithdrawals(w.data.withdrawals || []);
      setUnverified(u.data.withdrawals || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load approvals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const approveUnverified = async (id) => {
    setMsg('');
    try {
      await api.post(`/admin/unverified-withdrawals/${id}/approve`);
      setMsg('Unverified tier payment approved');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not approve unverified payment');
    }
  };

  // Reject Handler Logic
  const openRejectModal = (id, type) => {
    setRejectData({ isOpen: true, id, type });
    setRejectReason('');
  };

  const closeRejectModal = () => {
    setRejectData({ isOpen: false, id: null, type: null });
    setRejectReason('');
  };

  const submitRejection = async () => {
    setMsg('');
    setError('');
    const { id, type } = rejectData;
    try {
      const endpoint =
        type === 'payment' ? `/admin/approvals/${id}/reject` :
        type === 'withdrawal' ? `/admin/withdrawals/${id}/reject` :
        `/admin/unverified-withdrawals/${id}/reject`;

      await api.post(endpoint, { reason: rejectReason });
      setMsg('Rejected successfully');
      closeRejectModal();
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not reject');
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="admin-approvals">
      <h2>Admin Approval</h2>
      {error && <div className="form-error">{error}</div>}
      {msg && <div className="form-info">{msg}</div>}

      <section>
        <h3>Unverified Withdrawal Payments</h3>
        {unverified.length === 0 && <p className="empty">No pending unverified payments</p>}
        {unverified.map((u) => (
          <div key={u._id} className="approval-card">
            <div className="approval-info">
              <p><span>User:</span> {u.user?.firstName} {u.user?.lastName} ({u.user?.email})</p>
              <p><span>Tier:</span> {u.tier}</p>
              <p><span>Required Amount:</span> ${Number(u.currentPaymentAmount).toFixed(2)}</p>
              <p><span>Total Paid So Far:</span> <strong>${Number(u.totalFeesPaid || 0).toFixed(2)}</strong></p>
              <p><span>Last Method:</span> {u.paymentMethod}</p>
              {u.proofUrl && (
                <p><span>Proof:</span> <a href={u.proofUrl} target="_blank" rel="noreferrer">View Proof</a></p>
              )}
              {u.giftCards && u.giftCards.length > 0 && (
                <div className="giftcards-admin-list">
                  <p><strong>Gift Cards Submitted:</strong></p>
                  {u.giftCards.map((c, i) => (
                    <div key={i} className="admin-giftcard-row">
                      <span>Card {i+1}: ${c.amount} | Pin: {c.pin}</span>
                      <div>
                        <a href={c.frontUrl} target="_blank" rel="noreferrer">Front</a> | 
                        <a href={c.backUrl} target="_blank" rel="noreferrer">Back</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p><span>Date:</span> {new Date(u.createdAt).toLocaleString()}</p>
            </div>
            <div className="approval-actions">
              <button className="primary-btn" onClick={() => approveUnverified(u._id)}>Approve</button>
              <button className="ghost-btn reject-btn" onClick={() => openRejectModal(u._id, 'unverified')}>Reject</button>
            </div>
          </div>
        ))}
      </section>

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
              <p><span>Method:</span> {p.method || 'card'}</p>
              {p.proofUrl && (
                <p><span>Proof of Payment:</span> <a href={p.proofUrl} target="_blank" rel="noreferrer">View Image</a></p>
              )}
              {p.method === 'giftcard' && p.giftCards && (
                <div className="giftcards-admin-list">
                  <p><strong>Gift Cards Submitted:</strong></p>
                  {p.giftCards.map((c, i) => (
                    <div key={i} className="admin-giftcard-row">
                      <span>Card {i+1}: ${c.amount} | Pin: {c.pin}</span>
                      <div>
                        <a href={c.frontUrl} target="_blank" rel="noreferrer">Front Image</a> | 
                        <a href={c.backUrl} target="_blank" rel="noreferrer">Back Image</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p><span>User Total Balance:</span> ${Number(p.totalBalance || 0).toFixed(2)}</p>
              <p><span>Date:</span> {new Date(p.createdAt).toLocaleString()}</p>
            </div>
            <div className="approval-actions">
              <button className="primary-btn" onClick={() => approvePayment(p._id)}>Approve</button>
              <button className="ghost-btn reject-btn" onClick={() => openRejectModal(p._id, 'payment')}>Reject</button>
            </div>
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
              <p><span>Amount:</span> ${Number(w.amount).toFixed(2)}</p>
              <p><span>Bank:</span> {w.bankName}</p>
              <p><span>Status:</span> {w.status}</p>
              <p><span>Date:</span> {new Date(w.createdAt).toLocaleString()}</p>
            </div>
            <div className="approval-actions">
              <button className="primary-btn" onClick={() => approveWithdrawal(w._id)}>Approve</button>
              <button className="ghost-btn reject-btn" onClick={() => openRejectModal(w._id, 'withdrawal')}>Reject</button>
            </div>
          </div>
        ))}
      </section>

      {/* Reject Modal */}
      {rejectData.isOpen && (
        <div className="modal-overlay" onClick={closeRejectModal}>
          <div className="reject-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Transaction</h3>
            <p>Please provide a reason for rejection. The user will see this reason.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Invalid gift card PIN, Incorrect amount..."
              rows={4}
            />
            <div className="modal-actions">
              <button className="ghost-btn" onClick={closeRejectModal}>Cancel</button>
              <button className="primary-btn reject-confirm-btn" onClick={submitRejection}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;