import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './PasswordInput.css';

const PasswordInput = ({ value, onChange, placeholder = 'Password', name, id, autoComplete }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="password-input">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        name={name}
        id={id}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="eye-btn"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  );
};

export default PasswordInput;