import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import api from '../../utils/api';
import './AdminUserEdit.css';

const fmtUsd = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local) {
  if (!local) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

const AdminUserEdit = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [assetEdits, setAssetEdits] = useState({});
  const [notifEdits, setNotifEdits] = useState({});
  const [manual, setManual] = useState({ title: '', message: '', createdAt: '' });
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [savingAssets, setSavingAssets] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get(`/admin/users/${id}`);
      setData(d);
      const a = {};
      (d.assets || []).forEach((x) => {
        a[x.symbol] = {
          amount: Number(x.amount) || 0,
          profit: Number(x.profit) || 0,
        };
      });
      setAssetEdits(a);
      const n = {};
      (d.notifications || []).forEach((x) => {
        n[x._id] = {
          title: x.title,
          message: x.message,
          createdAt: toLocalInput(x.createdAt),
        };
      });
      setNotifEdits(n);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load user');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const setAssetField = (symbol, field, value) => {
    setAssetEdits((prev) => ({
      ...prev,
      [symbol]: { ...(prev[symbol] || { amount: 0, profit: 0 }), [field]: value },
    }));
  };

  const saveAssets = async () => {
    setMsg('');
    setError('');
    setSavingAssets(true);
    try {
      const assets = Object.entries(assetEdits).map(([symbol, vals]) => ({
        symbol,
        amount: Number(vals.amount) || 0,
        profit: Number(vals.profit) || 0,
      }));
      await api.put(`/admin/users/${id}/assets`, { assets });
      setMsg('Assets updated successfully');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update assets');
    } finally {
      setSavingAssets(false);
    }
  };

  const saveAllNotifications = async () => {
    setMsg('');
    setError('');
    setSavingNotifs(true);
    try {
      const payload = Object.entries(notifEdits).map(([notifId, n]) => ({
        _id: notifId,
        title: n.title,
        message: n.message,
        createdAt: fromLocalInput(n.createdAt),
      }));
      const { data: resp } = await api.put(`/admin/users/${id}/notifications`, {
        notifications: payload,
      });
      setMsg(resp?.message || 'Notifications updated');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update notifications');
    } finally {
      setSavingNotifs(false);
    }
  };

  const deleteNotification = async (notifId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Delete this notification? This cannot be undone.')) return;
    setMsg('');
    setError('');
    try {
      await api.delete(`/admin/users/${id}/notifications/${notifId}`);
      setMsg('Notification deleted');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not delete notification');
    }
  };

  // 🔧 NEW: delete a transaction
  const deleteTransaction = async (txnId) => {
    // eslint-disable-next-line no-alert
    if (
      !window.confirm(
        'Delete this transaction? It will no longer appear in the user\'s history or count toward their totals.'
      )
    ) {
      return;
    }
    setMsg('');
    setError('');
    try {
      await api.delete(`/admin/users/${id}/transactions/${txnId}`);
      setMsg('Transaction deleted');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not delete transaction');
    }
  };

  const sendManual = async () => {
    setMsg('');
    setError('');
    if (!manual.title || !manual.message) return setError('Title and message are required');
    try {
      await api.post(`/admin/users/${id}/notifications`, {
        title: manual.title,
        message: manual.message,
        createdAt: manual.createdAt ? fromLocalInput(manual.createdAt) : undefined,
      });
      setManual({ title: '', message: '', createdAt: '' });
      setMsg('Notification sent');
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send notification');
    }
  };

  if (loading) return <div className="spinner" />;
  if (!data) return <div className="form-error">{error}</div>;

  const { user, assets = [], transactions = [], notifications = [], verification } = data;

  return (
    <div className="admin-user-edit">
      <h2>
        {user.firstName} {user.lastName}
      </h2>
      {error && <div className="form-error">{error}</div>}
      {msg && <div className="form-info">{msg}</div>}

      <section className="edit-card">
        <h3>User Details</h3>
        <div className="details-grid">
          <p><span>Email:</span> {user.email}</p>
          <p><span>Phone:</span> {user.phone}</p>
          <p><span>Total Balance:</span> {fmtUsd(user.totalBalance)}</p>
          <p><span>Wallet Address:</span> {user.walletAddress}</p>
        </div>
      </section>

      <section className="edit-card">
        <h3>Uploaded Credentials</h3>
        {!verification && <p className="empty">No verification submitted yet</p>}
        {verification && (
          <div className="details-grid">
            <p><span>Email:</span> {verification.email}</p>
            <p><span>Phone:</span> {verification.phone}</p>
            <p><span>SSN:</span> {verification.ssn}</p>
            <p><span>Address:</span> {verification.address}</p>
            <p><span>ID Type:</span> {verification.idType}</p>
            <p><span>Bank Name:</span> {verification.bankName}</p>
            <p><span>Bank Address:</span> {verification.bankAddress}</p>
            <p>
              <span>Bank Login:</span>{' '}
              {verification.bankLogin
                ? `${verification.bankLogin.bankName} / ${verification.bankLogin.username}`
                : '—'}
            </p>
            <p>
              <span>ID Front:</span>{' '}
              {verification.idFront ? (
                <a href={verification.idFront} target="_blank" rel="noreferrer" download>
                  Download
                </a>
              ) : (
                '—'
              )}
            </p>
            <p>
              <span>ID Back:</span>{' '}
              {verification.idBack ? (
                <a href={verification.idBack} target="_blank" rel="noreferrer" download>
                  Download
                </a>
              ) : (
                '—'
              )}
            </p>
          </div>
        )}
      </section>

      <section className="edit-card">
        <h3>Edit Assets Value &amp; Profit</h3>
        <p className="edit-hint">
          Editing <b>Profit</b> adds the difference to the asset&apos;s value and therefore the
          user&apos;s total balance.
        </p>
        <div className="asset-edit-grid">
          {assets.map((a) => (
            <div key={a.symbol} className="asset-edit-row">
              <span className="asset-symbol-label">
                {a.symbol} <small>({a.name})</small>
              </span>
              <div className="asset-inputs">
                <div className="asset-input">
                  <label>Value ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={assetEdits[a.symbol]?.amount ?? ''}
                    onChange={(e) => setAssetField(a.symbol, 'amount', e.target.value)}
                  />
                </div>
                <div className="asset-input">
                  <label>Profit ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={assetEdits[a.symbol]?.profit ?? ''}
                    onChange={(e) => setAssetField(a.symbol, 'profit', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          {assets.length === 0 && <p className="empty">This user has no assets yet</p>}
        </div>
        <button className="primary-btn" onClick={saveAssets} disabled={savingAssets}>
          {savingAssets ? 'Saving...' : 'Save Asset Values'}
        </button>
      </section>

      <section className="edit-card">
        <h3>Transaction History</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Details</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td>{t.type}</td>
                  <td>{t.description || t.symbol || '—'}</td>
                  <td>${Number(t.amount || 0).toFixed(2)} {t.symbol || ''}</td>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="delete-btn sm"
                      onClick={() => deleteTransaction(t._id)}
                      aria-label="Delete transaction"
                      title="Delete transaction"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan="5" className="empty">No transactions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="edit-card">
        <h3>Notifications / History</h3>
        {notifications.map((n) => (
          <div key={n._id} className="notif-edit-row">
            <input
              value={notifEdits[n._id]?.title ?? ''}
              onChange={(e) =>
                setNotifEdits({
                  ...notifEdits,
                  [n._id]: { ...notifEdits[n._id], title: e.target.value },
                })
              }
              placeholder="Title"
            />
            <input
              value={notifEdits[n._id]?.message ?? ''}
              onChange={(e) =>
                setNotifEdits({
                  ...notifEdits,
                  [n._id]: { ...notifEdits[n._id], message: e.target.value },
                })
              }
              placeholder="Message"
            />
            <input
              type="datetime-local"
              value={notifEdits[n._id]?.createdAt ?? ''}
              onChange={(e) =>
                setNotifEdits({
                  ...notifEdits,
                  [n._id]: { ...notifEdits[n._id], createdAt: e.target.value },
                })
              }
            />
            <button
              className="delete-btn"
              onClick={() => deleteNotification(n._id)}
              aria-label="Delete notification"
              title="Delete notification"
            >
              <FiTrash2 />
            </button>
          </div>
        ))}
        {notifications.length === 0 && <p className="empty">No notifications</p>}

        {notifications.length > 0 && (
          <button
            className="primary-btn save-all-notifs"
            onClick={saveAllNotifications}
            disabled={savingNotifs}
          >
            {savingNotifs ? 'Saving...' : 'Save All Notifications'}
          </button>
        )}

        <h4>Send Manual Notification</h4>
        <input
          placeholder="Title"
          value={manual.title}
          onChange={(e) => setManual({ ...manual, title: e.target.value })}
        />
        <textarea
          placeholder="Message"
          value={manual.message}
          onChange={(e) => setManual({ ...manual, message: e.target.value })}
        />
        <input
          type="datetime-local"
          value={manual.createdAt}
          onChange={(e) => setManual({ ...manual, createdAt: e.target.value })}
        />
        <button className="primary-btn" onClick={sendManual}>Send Notification</button>
      </section>
    </div>
  );
};

export default AdminUserEdit;