import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength, { scorePassword } from '../components/PasswordStrength';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [nameMsg, setNameMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [pwErr, setPwErr] = useState('');

  const saveName = async (e) => {
    e.preventDefault();
    setNameErr('');
    setNameMsg('');
    if (!name.firstName || !name.lastName) return setNameErr('Both names are required');
    try {
      const { data } = await api.put('/user/profile', {
        firstName: name.firstName.trim(),
        lastName: name.lastName.trim(),
      });
      const merged = { ...user, ...(data.user || {}) };
      setUser(merged);
      localStorage.setItem('fortis_user', JSON.stringify(merged));
      setNameMsg('Name updated successfully');
    } catch (err) {
      setNameErr(err?.response?.data?.message || 'Could not update name');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwErr('');
    setPwMsg('');
    if (!passwords.current || !passwords.next) return setPwErr('All password fields are required');
    if (passwords.next !== passwords.confirm) return setPwErr('Passwords do not match');
    if (scorePassword(passwords.next).score < 2) return setPwErr('Please choose a stronger password');
    try {
      await api.put('/user/password', {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPwMsg('Password updated successfully');
      setPasswords({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwErr(err?.response?.data?.message || 'Could not update password');
    }
  };

  return (
    <div className="settings-page">
      <PageHeader title="Settings" />

      <div className="settings-body">
        <form className="settings-card" onSubmit={saveName}>
          <h3>Profile</h3>
          {nameErr && <div className="form-error">{nameErr}</div>}
          {nameMsg && <div className="form-info">{nameMsg}</div>}
          <label>First Name</label>
          <input
            value={name.firstName}
            onChange={(e) => setName({ ...name, firstName: e.target.value })}
          />
          <label>Last Name</label>
          <input
            value={name.lastName}
            onChange={(e) => setName({ ...name, lastName: e.target.value })}
          />
          <button className="primary-btn">Save Changes</button>
        </form>

        <form className="settings-card" onSubmit={savePassword}>
          <h3>Change Password</h3>
          {pwErr && <div className="form-error">{pwErr}</div>}
          {pwMsg && <div className="form-info">{pwMsg}</div>}
          <label>Current Password</label>
          <PasswordInput
            value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
          />
          <label>New Password</label>
          <PasswordInput
            value={passwords.next}
            onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
          />
          <PasswordStrength password={passwords.next} />
          <label>Confirm New Password</label>
          <PasswordInput
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
          />
          <button className="primary-btn">Update Password</button>
        </form>
      </div>
    </div>
  );
};

export default Settings;