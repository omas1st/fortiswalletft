import React, { useState } from 'react';
import { FiCopy, FiCheck, FiX } from 'react-icons/fi';
import './WalletAddressModal.css';

const WalletAddressModal = ({ address, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch (e) {
      const el = document.createElement('textarea');
      el.value = address;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Your Wallet Address</h3>
          <button onClick={onClose} aria-label="Close"><FiX /></button>
        </div>
        <p className="wallet-address">{address}</p>
        <button className="copy-btn" onClick={copy}>
          {copied ? <FiCheck /> : <FiCopy />} {copied ? 'Copied!' : 'Copy Address'}
        </button>
      </div>
    </div>
  );
};

export default WalletAddressModal;