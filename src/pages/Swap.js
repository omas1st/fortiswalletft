import React, { useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';
import { ASSETS } from '../utils/assets';
import './Swap.css';

const fmtUsd = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Swap = () => {
  const [assets, setAssets] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/user/dashboard');
        setAssets((data.assets || []).filter((a) => Number(a.amount) > 0));
      } catch (e) {
        setError('Could not load your assets');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fromAsset = assets.find((a) => a.symbol === from);
  const fee = amount ? (Number(amount) * 0.01).toFixed(2) : '0.00';
  const netAmount = amount ? (Number(amount) * 0.99).toFixed(2) : '0.00';

  // 🔧 FIX: "To" dropdown offers ALL platform assets (user's balance irrelevant).
  // "From" dropdown only lists the user's assets that have a balance.
  const allDestinations = ASSETS;

  const submit = async () => {
    setError('');
    setSuccess('');
    if (!from || !to) return setError('Select both assets');
    if (from === to) return setError('Choose two different assets');
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount');
    if (fromAsset && Number(amount) > Number(fromAsset.amount)) return setError('Insufficient balance');

    setSubmitting(true);
    try {
      await api.post('/swap', { fromSymbol: from, toSymbol: to, amount: Number(amount) });
      setSuccess('Swap completed successfully. Your balances have been updated.');
      setAmount('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Swap failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="swap-page">
      <PageHeader title="Swap Assets" />

      <div className="swap-body">
        {loading ? (
          <div className="spinner" />
        ) : (
          <>
            <div className="swap-card">
              <label>From (your assets)</label>
              <select value={from} onChange={(e) => setFrom(e.target.value)}>
                <option value="">Select asset</option>
                {assets.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} — {fmtUsd(a.amount)}
                  </option>
                ))}
              </select>

              <label>Amount (USD)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              <small className="fee-note">
                Swap fee (1%): ${fee} — you will receive ${netAmount} worth
              </small>

              <div className="swap-arrow"><FiRefreshCw /></div>

              <label>To (any platform asset)</label>
              <select value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="">Select asset</option>
                {allDestinations.map((a) => (
                  <option key={a.symbol} value={a.symbol}>
                    {a.symbol} — {a.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <div className="form-error">{error}</div>}
            {success && <div className="form-info">{success}</div>}

            <button className="primary-btn" onClick={submit} disabled={submitting}>
              {submitting ? 'Swapping...' : 'Swap Now'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Swap;