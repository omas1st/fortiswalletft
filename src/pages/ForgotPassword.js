import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength, { scorePassword } from '../components/PasswordStrength';
import api from '../utils/api';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) return setError('Enter your email address');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setInfo('A 6-digit code has been sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not send reset code');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) return setError('Enter the 6-digit code');
    setLoading(true);
    try {
      await api.post('/auth/verify-code', { email: email.trim().toLowerCase(), code: code.trim() });
      setInfo('Code verified. Choose a new password.');
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (scorePassword(password).score < 2) return setError('Please choose a stronger password');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        password,
      });
      setStep(4);
    } catch (err) {
      setError(err?.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <Header />
      <div className="forgot-body">
        <div className="forgot-card">
          <h1>Reset Password</h1>
          {error && <div className="form-error">{error}</div>}
          {info && <div className="form-info">{info}</div>}

          {step === 1 && (
            <form onSubmit={sendCode}>
              <p className="subtitle">Enter your registered email to receive a 6-digit code.</p>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <button className="primary-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={verifyCode}>
              <p className="subtitle">Enter the 6-digit code sent to {email}</p>
              <label>Verification Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
              />
              <button className="primary-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button type="button" className="ghost-btn" onClick={() => setStep(1)}>Change Email</button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={resetPassword}>
              <label>New Password</label>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
              <PasswordStrength password={password} />
              <label>Confirm Password</label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
              <button className="primary-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="success-block">
              <p>Your password has been reset successfully.</p>
              <button className="primary-btn" onClick={() => navigate('/')}>Back to Login</button>
            </div>
          )}

          {step !== 4 && (
            <p className="switch-text">
              Remembered it? <Link to="/" className="link">Login</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;