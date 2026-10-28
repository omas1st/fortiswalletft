import React from 'react';
import './PasswordStrength.css';

export const scorePassword = (pw = '') => {
  let score = 0;
  if (!pw) return { score: 0, label: '', color: '#888', percent: 0 };
  if (pw.length >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (pw.length >= 12) score += 1;

  const levels = [
    { label: 'Very Weak', color: '#ff4d4d' },
    { label: 'Weak', color: '#ff8c42' },
    { label: 'Fair', color: '#ffd166' },
    { label: 'Strong', color: '#06d6a0' },
    { label: 'Very Strong', color: '#00e0a1' },
  ];
  const idx = Math.max(0, Math.min(score - 1, 4));
  return { score, ...levels[idx], percent: (Math.min(score, 5) / 5) * 100 };
};

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const { label, color, percent } = scorePassword(password);
  return (
    <div className="pw-strength">
      <div className="pw-bar">
        <div className="pw-fill" style={{ width: `${percent}%`, background: color }} />
      </div>
      <span className="pw-label" style={{ color }}>{label}</span>
    </div>
  );
};

export default PasswordStrength;