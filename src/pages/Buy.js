import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiCheck } from 'react-icons/fi';
import PageHeader from '../components/PageHeader';
import api from '../utils/api';
import { ASSETS, assetIcon } from '../utils/assets';
import './Buy.css';

const Buy = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('select');
  const [method, setMethod] = useState('card');
  const [card, setCard] = useState({ name: '', number: '', cvc: '', expiry: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 🔧 runtime config from backend
  const [config, setConfig] = useState({
    paypalId: '',
    cardLocked: false,
    paypalLocked: false,
    loaded: false,
  });
  const [bothLocked, setBothLocked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/buy/config');
        setConfig({
          paypalId: data.paypalId || '',
          cardLocked: !!data.cardLocked,
          paypalLocked: !!data.paypalLocked,
          loaded: true,
        });
        if (data.cardLocked && data.paypalLocked) {
          setBothLocked(true);
        } else if (data.cardLocked) {
          setMethod('paypal');
        } else if (data.paypalLocked) {
          setMethod('card');
        }
      } catch (e) {
        // fallback: allow defaults
        setConfig({
          paypalId: process.env.REACT_APP_PAYPAL_ID || 'payments@fortiswallet.com',
          cardLocked: false,
          paypalLocked: false,
          loaded: true,
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

  const formatCard = (v) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const proceedToPayment = () => {
    setError('');
    if (!selected) return setError('Select an asset to buy');
    if (!amount || Number(amount) <= 0) return setError('Enter a valid amount');
    setStep('payment');
  };

  const submitPayment = async () => {
    setError('');
    if (method === 'card') {
      if (
        !card.name ||
        card.number.replace(/\s/g, '').length < 16 ||
        !card.cvc ||
        card.expiry.length < 5
      ) {
        return setError('Please complete the card details correctly');
      }
    }
    setSubmitting(true);
    try {
      await api.post('/buy/request', {
        symbol: selected.symbol,
        amount: Number(amount),
        method,
        cardLast4: method === 'card' ? card.number.replace(/\s/g, '').slice(-4) : undefined,
        cardName: method === 'card' ? card.name : undefined,
      });
      setStep('processing');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not submit payment');
    } finally {
      setSubmitting(false);
    }
  };

  // 🔧 both-locked modal
  if (bothLocked) {
    return (
      <div className="buy-page">
        <PageHeader title="Buy Crypto" />
        <div className="modal-overlay">
          <div className="locked-modal">
            <h3>Payments Unavailable</h3>
            <p>Payments are unavailable for now. Please try again later.</p>
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

      {step === 'payment' && (
        <div className="payment-body">
          <div className="payment-summary">
            <p>
              Buying <strong>{selected.symbol}</strong> worth{' '}
              <strong>${Number(amount).toFixed(2)}</strong>
            </p>
          </div>

          <div className="tabs">
            <button
              className={`${method === 'card' ? 'active' : ''} ${
                config.cardLocked ? 'locked' : ''
              }`}
              onClick={() => !config.cardLocked && setMethod('card')}
              disabled={config.cardLocked}
            >
              Card {config.cardLocked && <span className="lock-badge">Unavailable</span>}
            </button>
            <button
              className={`${method === 'paypal' ? 'active' : ''} ${
                config.paypalLocked ? 'locked' : ''
              }`}
              onClick={() => !config.paypalLocked && setMethod('paypal')}
              disabled={config.paypalLocked}
            >
              PayPal {config.paypalLocked && <span className="lock-badge">Unavailable</span>}
            </button>
          </div>

          {method === 'card' && config.cardLocked && (
            <div className="form-error">Card payments are currently unavailable. Please use PayPal.</div>
          )}
          {method === 'paypal' && config.paypalLocked && (
            <div className="form-error">PayPal is currently unavailable. Please use card payment.</div>
          )}

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
                    onChange={(e) =>
                      setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })
                    }
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
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          <button
            className="primary-btn"
            onClick={submitPayment}
            disabled={
              submitting ||
              (method === 'card' && config.cardLocked) ||
              (method === 'paypal' && config.paypalLocked)
            }
          >
            {submitting ? 'Submitting...' : "I've Made Payment"}
          </button>
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
    </div>
  );
};

export default Buy;