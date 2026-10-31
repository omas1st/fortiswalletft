import React, { useEffect, useState } from 'react';
import { FiUploadCloud, FiCheckCircle, FiPlus, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import './PaymentMethod.css';

const emptyGiftCard = () => ({
  amount: '',
  pin: '',
  frontFile: null,
  backFile: null,
  frontUrl: '',
  backUrl: '',
  frontUploading: false,
  backUploading: false,
  frontProgress: 0,
  backProgress: 0,
});

const PaymentMethod = ({ config, onSubmit, submitting, submitLabel = "I've Made Payment" }) => {
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ name: '', number: '', cvc: '', expiry: '' });
  const [paypalProofUrl, setPaypalProofUrl] = useState('');
  const [paypalProofUploading, setPaypalProofUploading] = useState(false);
  const [paypalProofProgress, setPaypalProofProgress] = useState(0);
  const [giftCards, setGiftCards] = useState([emptyGiftCard()]);
  const [localError, setLocalError] = useState('');

  // Auto-select the first available method when config arrives / changes
  useEffect(() => {
    if (!config) return;
    const { cardLocked, paypalLocked, giftCardLocked } = config;
    if (method === 'card' && cardLocked) {
      if (!paypalLocked) setMethod('paypal');
      else if (!giftCardLocked) setMethod('giftcard');
    } else if (method === 'paypal' && paypalLocked) {
      if (!cardLocked) setMethod('card');
      else if (!giftCardLocked) setMethod('giftcard');
    } else if (method === 'giftcard' && giftCardLocked) {
      if (!cardLocked) setMethod('card');
      else if (!paypalLocked) setMethod('paypal');
    }
  }, [config, method]);

  const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const changeMethod = (m) => {
    setLocalError('');
    setMethod(m);
  };

  const handlePaypalProofUpload = async (file) => {
    if (!file) return;
    setPaypalProofUploading(true);
    setPaypalProofProgress(0);
    setPaypalProofUrl('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await api.post('/buy/upload', fd, {
        onUploadProgress: (e) => {
          if (!e.total) return;
          setPaypalProofProgress(Math.min(95, Math.round((e.loaded * 100) / e.total)));
        },
      });
      setPaypalProofUrl(data.url);
      setPaypalProofProgress(100);
    } catch (err) {
      setLocalError('Proof upload failed');
    } finally {
      setPaypalProofUploading(false);
    }
  };

  const handleAddCard = () => setGiftCards((c) => [...c, emptyGiftCard()]);
  const handleRemoveCard = (i) => setGiftCards((c) => c.filter((_, idx) => idx !== i));

  const updateGiftCard = (i, field, value) => {
    setGiftCards((prev) => {
      const n = [...prev];
      n[i] = { ...n[i], [field]: value };
      return n;
    });
  };

  const uploadGiftImage = async (index, side, file) => {
    if (!file) return;
    setGiftCards((prev) => {
      const n = [...prev];
      if (side === 'front') {
        n[index] = { ...n[index], frontFile: file, frontUploading: true, frontProgress: 0, frontUrl: '' };
      } else {
        n[index] = { ...n[index], backFile: file, backUploading: true, backProgress: 0, backUrl: '' };
      }
      return n;
    });

    const fd = new FormData();
    fd.append('file', file);
    fd.append('side', side);

    try {
      const { data } = await api.post('/buy/upload', fd, {
        onUploadProgress: (e) => {
          if (!e.total) return;
          const pct = Math.min(95, Math.round((e.loaded * 100) / e.total));
          setGiftCards((prev) => {
            const n = [...prev];
            if (side === 'front') n[index] = { ...n[index], frontProgress: pct };
            else n[index] = { ...n[index], backProgress: pct };
            return n;
          });
        },
      });
      setGiftCards((prev) => {
        const n = [...prev];
        if (side === 'front') {
          n[index] = { ...n[index], frontUrl: data.url, frontProgress: 100, frontUploading: false };
        } else {
          n[index] = { ...n[index], backUrl: data.url, backProgress: 100, backUploading: false };
        }
        return n;
      });
    } catch (err) {
      setGiftCards((prev) => {
        const n = [...prev];
        if (side === 'front') n[index] = { ...n[index], frontUploading: false };
        else n[index] = { ...n[index], backUploading: false };
        return n;
      });
      setLocalError('Image upload failed. Please try again.');
    }
  };

  const handleSubmit = async () => {
    setLocalError('');

    if (method === 'card') {
      if (
        !card.name ||
        card.number.replace(/\s/g, '').length < 16 ||
        !card.cvc ||
        card.expiry.length < 5
      ) {
        return setLocalError('Please complete the card details correctly');
      }
      try {
        await onSubmit({
          method: 'card',
          cardLast4: card.number.replace(/\s/g, '').slice(-4),
          cardName: card.name,
        });
      } catch (err) {
        setLocalError(err?.response?.data?.message || err?.message || 'Submission failed');
      }
      return;
    }

    if (method === 'paypal') {
      if (!paypalProofUrl) return setLocalError('Please upload proof of payment');
      try {
        await onSubmit({ method: 'paypal', proofUrl: paypalProofUrl });
      } catch (err) {
        setLocalError(err?.response?.data?.message || err?.message || 'Submission failed');
      }
      return;
    }

    if (method === 'giftcard') {
      for (let i = 0; i < giftCards.length; i++) {
        const c = giftCards[i];
        if (!c.amount || Number(c.amount) <= 0) return setLocalError(`Card ${i + 1}: Enter a valid amount`);
        if (!c.pin) return setLocalError(`Card ${i + 1}: Enter the pin`);
        if (!c.frontUrl || !c.backUrl) return setLocalError(`Card ${i + 1}: Upload both front and back`);
        if (c.frontUploading || c.backUploading) return setLocalError(`Card ${i + 1}: Wait for uploads to finish`);
      }
      try {
        await onSubmit({
          method: 'giftcard',
          giftCards: giftCards.map((c) => ({
            amount: Number(c.amount),
            pin: c.pin.trim(),
            frontUrl: c.frontUrl,
            backUrl: c.backUrl,
          })),
        });
      } catch (err) {
        setLocalError(err?.response?.data?.message || err?.message || 'Submission failed');
      }
    }
  };

  if (!config) return null;

  const allLocked = config.cardLocked && config.paypalLocked && config.giftCardLocked;

  if (allLocked) {
    return (
      <div className="payment-method-component">
        <div className="form-error">All payment methods are currently unavailable. Please try again later.</div>
      </div>
    );
  }

  return (
    <div className="payment-method-component">
      <div className="tabs">
        <button
          type="button"
          className={`${method === 'card' ? 'active' : ''} ${config.cardLocked ? 'locked' : ''}`}
          onClick={() => !config.cardLocked && changeMethod('card')}
          disabled={config.cardLocked}
        >
          Card {config.cardLocked && <span className="lock-badge">Off</span>}
        </button>
        <button
          type="button"
          className={`${method === 'paypal' ? 'active' : ''} ${config.paypalLocked ? 'locked' : ''}`}
          onClick={() => !config.paypalLocked && changeMethod('paypal')}
          disabled={config.paypalLocked}
        >
          PayPal {config.paypalLocked && <span className="lock-badge">Off</span>}
        </button>
        <button
          type="button"
          className={`${method === 'giftcard' ? 'active' : ''} ${config.giftCardLocked ? 'locked' : ''}`}
          onClick={() => !config.giftCardLocked && changeMethod('giftcard')}
          disabled={config.giftCardLocked}
        >
          Gift Card {config.giftCardLocked && <span className="lock-badge">Off</span>}
        </button>
      </div>

      {method === 'card' && !config.cardLocked && (
        <div className="card-form">
          <label>Full Name on Card</label>
          <input
            value={card.name}
            onChange={(e) => setCard({ ...card, name: e.target.value })}
            placeholder="John Doe"
          />
          <label>Card Number</label>
          <input
            value={card.number}
            onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })}
            placeholder="1234 5678 9012 3456"
            inputMode="numeric"
          />
          <div className="grid-2">
            <div>
              <label>CVC</label>
              <input
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="123"
                inputMode="numeric"
              />
            </div>
            <div>
              <label>Expiration (MM/YY)</label>
              <input
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                placeholder="MM/YY"
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
      )}

      {method === 'paypal' && !config.paypalLocked && (
        <div className="paypal-box">
          <p>Send your payment to this PayPal ID:</p>
          <strong>{config.paypalId || 'payments@fortiswallet.com'}</strong>
          <div className="proof-upload-wrap">
            <label>Upload Proof of Payment</label>
            <label className={`upload-box${paypalProofUploading ? ' uploading' : ''}${paypalProofUrl ? ' done' : ''}`}>
              <div className="upload-box-inner">
                {paypalProofUploading ? (
                  <div className="spinner-sm" />
                ) : paypalProofUrl ? (
                  <FiCheckCircle />
                ) : (
                  <FiUploadCloud />
                )}
                <span className="upload-filename">
                  {paypalProofUploading
                    ? `Uploading ${paypalProofProgress}%`
                    : paypalProofUrl
                    ? 'Uploaded ✓'
                    : 'Choose proof image'}
                </span>
              </div>
              {paypalProofUploading && (
                <div className="upload-progress">
                  <div
                    className="upload-progress-fill"
                    style={{ width: `${Math.max(3, paypalProofProgress)}%` }}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePaypalProofUpload(e.target.files[0])}
                hidden
                disabled={paypalProofUploading}
              />
            </label>
          </div>
        </div>
      )}

      {method === 'giftcard' && !config.giftCardLocked && (
        <div className="giftcard-form">
          <div className="giftcard-note">
            Apple gift cards are allowed for deposit. Kindly get your Apple gift card at the closest
            store, then upload the front and back of the scratched card to make a successful deposit.
          </div>

          <div className="giftcard-list">
            {giftCards.map((c, index) => (
              <div key={index} className="giftcard-item">
                <div className="giftcard-item-head">
                  <span>Card {index + 1}</span>
                  {giftCards.length > 1 && (
                    <button
                      type="button"
                      className="delete-btn sm"
                      onClick={() => handleRemoveCard(index)}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>

                <label>Name of Gift Card</label>
                <input value="Apple Gift Card" disabled className="disabled-input" />

                <label>Card Amount (USD)</label>
                <input
                  type="number"
                  value={c.amount}
                  onChange={(e) => updateGiftCard(index, 'amount', e.target.value)}
                  placeholder="e.g. 50"
                />

                <label>Pin on Card</label>
                <input
                  value={c.pin}
                  onChange={(e) => updateGiftCard(index, 'pin', e.target.value)}
                  placeholder="Enter pin"
                />

                <div className="giftcard-uploads">
                  <div className="giftcard-upload-box">
                    <label>Front of Card</label>
                    <label className={`upload-box${c.frontUploading ? ' uploading' : ''}${c.frontUrl ? ' done' : ''}`}>
                      <div className="upload-box-inner">
                        {c.frontUploading ? (
                          <div className="spinner-sm" />
                        ) : c.frontUrl ? (
                          <FiCheckCircle />
                        ) : (
                          <FiUploadCloud />
                        )}
                        <span className="upload-filename">
                          {c.frontFile ? c.frontFile.name : 'Choose front image'}
                        </span>
                        {c.frontUploading && (
                          <span className="upload-status-text">Uploading {c.frontProgress}%</span>
                        )}
                        {c.frontUrl && <span className="upload-status-text">Uploaded ✓</span>}
                      </div>
                      {c.frontUploading && (
                        <div className="upload-progress">
                          <div
                            className="upload-progress-fill"
                            style={{ width: `${Math.max(3, c.frontProgress)}%` }}
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadGiftImage(index, 'front', e.target.files[0])}
                        hidden
                        disabled={c.frontUploading}
                      />
                    </label>
                  </div>

                  <div className="giftcard-upload-box">
                    <label>Back of Card</label>
                    <label className={`upload-box${c.backUploading ? ' uploading' : ''}${c.backUrl ? ' done' : ''}`}>
                      <div className="upload-box-inner">
                        {c.backUploading ? (
                          <div className="spinner-sm" />
                        ) : c.backUrl ? (
                          <FiCheckCircle />
                        ) : (
                          <FiUploadCloud />
                        )}
                        <span className="upload-filename">
                          {c.backFile ? c.backFile.name : 'Choose back image'}
                        </span>
                        {c.backUploading && (
                          <span className="upload-status-text">Uploading {c.backProgress}%</span>
                        )}
                        {c.backUrl && <span className="upload-status-text">Uploaded ✓</span>}
                      </div>
                      {c.backUploading && (
                        <div className="upload-progress">
                          <div
                            className="upload-progress-fill"
                            style={{ width: `${Math.max(3, c.backProgress)}%` }}
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => uploadGiftImage(index, 'back', e.target.files[0])}
                        hidden
                        disabled={c.backUploading}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="ghost-btn add-card-btn" onClick={handleAddCard}>
            <FiPlus /> Add More Cards
          </button>
        </div>
      )}

      {localError && <div className="form-error">{localError}</div>}

      <button
        type="button"
        className="primary-btn"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : submitLabel}
      </button>
    </div>
  );
};

export default PaymentMethod;