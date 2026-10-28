import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength, { scorePassword } from '../components/PasswordStrength';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.password) {
      return setError('All fields are required');
    }
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (scorePassword(form.password).score < 2) {
      return setError('Please choose a stronger password');
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      });
      navigate('/dashboard', { replace: true, state: { newUser: true } });
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Header />
      <div className="register-body">
        <form className="register-card" onSubmit={submit}>
          <h1>Create Account</h1>
          <p className="subtitle">Join Fortis Wallet today</p>

          {error && <div className="form-error">{error}</div>}

          <div className="grid-2">
            <div>
              <label>First Name</label>
              <input name="firstName" value={form.firstName} onChange={onChange} placeholder="John" />
            </div>
            <div>
              <label>Last Name</label>
              <input name="lastName" value={form.lastName} onChange={onChange} placeholder="Doe" />
            </div>
          </div>

          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={onChange} placeholder="you@example.com" />

          <label>Phone Number</label>
          <input name="phone" type="tel" value={form.phone} onChange={onChange} placeholder="+1 555 000 0000" />

          <label>Password</label>
          <PasswordInput name="password" value={form.password} onChange={onChange} placeholder="Create a password" />
          <PasswordStrength password={form.password} />

          <label>Confirm Password</label>
          <PasswordInput
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={onChange}
            placeholder="Confirm your password"
          />
          {form.confirmPassword && form.password !== form.confirmPassword && (
            <span className="mismatch">Passwords do not match</span>
          )}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>

          <p className="switch-text">
            Already have an account? <Link to="/" className="link">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;