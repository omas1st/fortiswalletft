import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiCheck } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import PaymentMethod from '../components/PaymentMethod';
import api from '../utils/api';
import { ASSETS, assetIcon } from '../utils/assets';
import './Buy.css';

const Buy = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('select');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [submittedMethod, setSubmittedMethod] = useState(null);

  const [config, setConfig] = useState(null);
  const [allLocked, setAllLocked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/buy/config');
        setConfig({
          paypalId: data.paypalId || '',
          cardLocked: !!data.cardLocked,
          paypalLocked: !!data.paypalLocked,
          giftCardLocked: !!data.giftCardLocked,
        });
        if (data.cardLocked && data.paypalLocked && data.giftCardLocked) {
          setAllLocked(true);
        }
      } catch (e) {
        setConfig({
          paypalId: process.env.REACT_APP_PAYPAL_ID || 'payments@fortiswallet.com',
          cardLocked: false,
          paypalLocked: false,
          giftCardLocked: false,
        });
      }
    })();
  }, []);

  const filtered = useMemo(
    () =>
      ASSETS.filter(
        (a) =>
          a.symbol.toLowerCase().includes(search.toLowerCase()) ||
          a.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const proceedToPayment = () => {
    setError('');
    if (!selected) return setError('Select an asset to buy');
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount');
    setStep('payment');
  };

  const handlePaymentSubmit = async (payload) => {
    setSubmitting(true);
    try {
      await api.post('/buy/request', {
        symbol: selected.symbol,
        amount: Number(amount),
        ...payload,
      });
      setSubmittedMethod(payload.method);
      if (payload.method === 'giftcard') {
        setShowSuccessPopup(true);
      } else {
        setStep('processing');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (allLocked) {
    return (
      <div className="buy-page">
        <PageHeader title="Buy Crypto" />
        <div className="modal-overlay">
          <div className="locked-modal">
            <h3>Payments Unavailable</h3>
            <p>All payment methods are currently unavailable. Please try again later.</p>
            <button className="primary-btn" onClick={() => navigate('/dashboard')}>Okay</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buy-page">
      <PageHeader title="Buy Crypto" />

      {step === 'select' && (
        <div className="buy-body">
          <div className="search-box">
            <FiSearch />
            <input
              placeholder="Search assets (e.g. BTC, Bitcoin)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="buy-asset-list">
            {filtered.map((a) => (
              <button
                key={a.symbol}
                className={`buy-asset ${selected?.symbol === a.symbol ? 'selected' : ''}`}
                onClick={() => setSelected(a)}
              >
                <img src={assetIcon(a.symbol)} alt={a.symbol} />
                <div>
                  <span className="name">{a.name}</span>
                  <span className="symbol">{a.symbol}</span>
                </div>
                {selected?.symbol === a.symbol && <FiCheck className="check" />}
              </button>
            ))}
          </div>

          {selected && (
            <div className="amount-box">
              <label>Amount (USD) for {selected.symbol}</label>
              <input
                type="number"
                min="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <button className="primary-btn" onClick={proceedToPayment}>Proceed to Payment</button>
        </div>
      )}

      {step === 'payment' && config && (
        <div className="payment-body">
          <div className="payment-summary">
            <p>Buying <strong>{selected.symbol}</strong></p>
          </div>

          <PaymentMethod
            config={config}
            onSubmit={handlePaymentSubmit}
            submitting={submitting}
            submitLabel={submittedMethod === 'giftcard' ? 'Submit Payment' : "I've Made Payment"}
          />
        </div>
      )}

      {step === 'processing' && (
        <div className="modal-overlay">
          <div className="processing-modal">
            <div className="spinner" />
            <h3>Payment Verification Processing</h3>
            <p>
              We are verifying your payment. Your account will be credited after verification
              within 24 hours. Kindly go back to the dashboard.
            </p>
            <button className="primary-btn" onClick={() => navigate('/dashboard')}>
              Go Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {showSuccessPopup && (
        <div className="modal-overlay">
          <div className="processing-modal">
            <h3>Gift Card Payment Submitted</h3>
            <p>
              Your payment is under verification. Your account will be credited within 30 minutes
              after verification.
            </p>
            <div className="modal-actions" style={{ flexDirection: 'column', gap: '10px' }}>
              <button className="primary-btn" onClick={() => setShowSuccessPopup(false)}>
                Add More Cards
              </button>
              <button className="ghost-btn" onClick={() => navigate('/dashboard')}>
                Go Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Buy;