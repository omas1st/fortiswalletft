import React, { useEffect, useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';
import './Send.css';

const fmtUsd = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Send = () => {
  const [address, setAddress] = useState('');
  const [receiver, setReceiver] = useState(null);
  const [checking, setChecking] = useState(false);
  const [assets, setAssets] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/user/dashboard');
        setAssets((data.assets || []).filter((a) => Number(a.amount) > 0));
      } catch (e) {
        /* ignore */
      }
    })();
  }, []);

  const checkAddress = async () => {
    setError('');
    setReceiver(null);
    if (!address.trim()) return setError('Enter a wallet address');
    setChecking(true);
    try {
      const { data } = await api.post('/send/lookup', { walletAddress: address.trim() });
      if (!data.valid) throw new Error(data.message || 'Wallet address not found');
      setReceiver(data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Wallet address not found');
    } finally {
      setChecking(false);
    }
  };

  const proceed = () => {
    setError('');
    if (!symbol) return setError('Select an asset');
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount');
    setConfirmOpen(true);
  };

  const confirmSend = async () => {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/send', { walletAddress: address.trim(), symbol, amount: Number(amount) });
      setConfirmOpen(false);
      setSuccess('Transfer completed successfully.');
      setAmount('');
      setReceiver(null);
      setAddress('');
    } catch (err) {
      setConfirmOpen(false);
      setError(err?.response?.data?.message || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="send-page">
      <PageHeader title="Send Crypto" />

      <div className="send-body">
        <label>Recipient Wallet Address</label>
        <div className="search-box">
          <FiSearch />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter wallet address"
          />
          <button className="check-btn" onClick={checkAddress} disabled={checking}>
            {checking ? '...' : 'Check'}
          </button>
        </div>

        {receiver && (
          <div className="receiver-box">
            <p>Wallet found: <strong>{receiver.name}</strong></p>
          </div>
        )}

        {receiver && (
          <>
            <label>Asset</label>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
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

            {error && <div className="form-error">{error}</div>}

            <button className="primary-btn" onClick={proceed}>Proceed</button>
          </>
        )}

        {success && <div className="form-info">{success}</div>}
      </div>

      {confirmOpen && (
        <div className="modal-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Transfer</h3>
            <p>
              You are about to send <strong>${Number(amount).toFixed(2)}</strong> of{' '}
              <strong>{symbol}</strong> to <strong>{receiver?.name}</strong>. Once the
              payment is confirmed, the payment is irreversible.
            </p>
            <div className="modal-actions">
              <button className="ghost-btn" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={confirmSend} disabled={submitting}>
                {submitting ? 'Sending...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Send;