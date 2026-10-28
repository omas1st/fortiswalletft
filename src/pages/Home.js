import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock } from 'react-icons/fi';
import Header from '../components/Header';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Email and password are required');
    setLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="home"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/logo1.png)` }}
    >
      <div className="home-overlay">
        <Header />
        <div className="home-body">
          <form className="login-card" onSubmit={handleSubmit}>
            <h1>Welcome Back</h1>
            <p className="subtitle">Login to your Fortis Wallet</p>

            {error && <div className="form-error">{error}</div>}

            <label htmlFor="email">Email</label>
            <div className="input-wrap">
              <FiMail className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <FiLock className="input-icon" />
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <div className="login-row">
              <Link to="/forgot-password" className="link">Forgot password?</Link>
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p className="switch-text">
              Don&apos;t have an account? <Link to="/register" className="link">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;