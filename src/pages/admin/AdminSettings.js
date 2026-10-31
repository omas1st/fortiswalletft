import React, { useCallback, useEffect, useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import api from '../../utils/api';
import './AdminSettings.css';

const Section = ({ id, title, subtitle, open, onToggle, children }) => (
  <div className="settings-section">
    <button className="settings-section-head" onClick={() => onToggle(id)}>
      <span className="section-title-wrap">
        <span className="section-title">{title}</span>
        {subtitle && <span className="section-subtitle">{subtitle}</span>}
      </span>
      {open ? <FiChevronDown /> : <FiChevronRight />}
    </button>
    {open && <div className="settings-section-body">{children}</div>}
  </div>
);

const AdminSettings = () => {
  const [assets, setAssets] = useState([]);
  const [edits, setEdits] = useState({});
  const [paypalId, setPaypalId] = useState('');
  const [paypalDraft, setPaypalDraft] = useState('');
  const [cardLocked, setCardLocked] = useState(false);
  const [paypalLocked, setPaypalLocked] = useState(false);
  const [giftCardLocked, setGiftCardLocked] = useState(false);

  const [openSection, setOpenSection] = useState('assets');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPaypal, setSavingPaypal] = useState(false);
  const [savingLocks, setSavingLocks] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/settings');
      const list = data.assets || [];
      setAssets(list);
      const e = {};
      list.forEach((a) => {
        e[a.symbol] = a.percent;
      });
      setEdits(e);
      setPaypalId(data.paypalId || '');
      setPaypalDraft(data.paypalId || '');
      setCardLocked(!!data.cardLocked);
      setPaypalLocked(!!data.paypalLocked);
      setGiftCardLocked(!!data.giftCardLocked);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSection = (id) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  const saveAssets = async () => {
    setMsg('');
    setError('');
    setSaving(true);
    try {
      for (const a of assets) {
        await api.put(`/admin/settings/assets/${a.symbol}`, {
          percent: Number(edits[a.symbol]) || 0,
        });
      }
      setMsg('Asset percentages updated');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update percentages');
    } finally {
      setSaving(false);
    }
  };

  const savePaypal = async () => {
    setMsg('');
    setError('');
    if (!paypalDraft.trim()) return setError('PayPal ID cannot be empty');
    setSavingPaypal(true);
    try {
      const { data } = await api.put('/admin/settings/paypal', { paypalId: paypalDraft.trim() });
      setPaypalId(data.paypalId);
      setPaypalDraft(data.paypalId);
      setMsg('PayPal ID updated');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update PayPal ID');
    } finally {
      setSavingPaypal(false);
    }
  };

  const saveLocks = async () => {
    setMsg('');
    setError('');
    setSavingLocks(true);
    try {
      await api.put('/admin/settings/payment-locks', { cardLocked, paypalLocked, giftCardLocked });
      setMsg('Payment locks updated');
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not update payment locks');
    } finally {
      setSavingLocks(false);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="admin-settings">
      <h2>Settings</h2>
      {error && <div className="form-error">{error}</div>}
      {msg && <div className="form-info">{msg}</div>}

      <Section
        id="assets"
        title="Daily Asset Percentage Increase"
        subtitle="Adjust the daily % growth for each asset"
        open={openSection === 'assets'}
        onToggle={toggleSection}
      >
        <div className="percent-list">
          {assets.map((a) => (
            <div key={a.symbol} className="percent-row">
              <span className="symbol">
                {a.symbol} — {a.name}
              </span>
              <input
                type="number"
                step="0.01"
                value={edits[a.symbol] ?? ''}
                onChange={(e) => setEdits({ ...edits, [a.symbol]: e.target.value })}
              />
              <span className="unit">% / day</span>
            </div>
          ))}
          {assets.length === 0 && <p className="empty">No assets configured</p>}
        </div>
        <button className="primary-btn" onClick={saveAssets} disabled={saving}>
          {saving ? 'Saving...' : 'Save Asset Percentages'}
        </button>
      </Section>

      <Section
        id="paypal"
        title="PayPal Settings"
        subtitle="The PayPal ID displayed to all users on the Buy page"
        open={openSection === 'paypal'}
        onToggle={toggleSection}
      >
        <label>PayPal ID (Email or PayPal.me link)</label>
        <input
          value={paypalDraft}
          onChange={(e) => setPaypalDraft(e.target.value)}
          placeholder="e.g. payments@fortiswallet.com"
        />
        <p className="edit-hint">
          Currently live: <strong>{paypalId || '(not set)'}</strong>
        </p>
        <button className="primary-btn" onClick={savePaypal} disabled={savingPaypal}>
          {savingPaypal ? 'Saving...' : 'Save PayPal ID'}
        </button>
      </Section>

      <Section
        id="locks"
        title="Payment Method Locks"
        subtitle="Temporarily disable payment methods for all users"
        open={openSection === 'locks'}
        onToggle={toggleSection}
      >
        <div className="lock-row">
          <div className="lock-info">
            <span className="lock-title">Lock Card Payment</span>
            <span className="lock-desc">Users will see "Card unavailable" on the Buy page.</span>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={cardLocked} onChange={(e) => setCardLocked(e.target.checked)} />
            <span className="slider" />
          </label>
        </div>

        <div className="lock-row">
          <div className="lock-info">
            <span className="lock-title">Lock PayPal Payment</span>
            <span className="lock-desc">Users will see "PayPal unavailable" on the Buy page.</span>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={paypalLocked} onChange={(e) => setPaypalLocked(e.target.checked)} />
            <span className="slider" />
          </label>
        </div>

        <div className="lock-row">
          <div className="lock-info">
            <span className="lock-title">Lock Gift Card Payment</span>
            <span className="lock-desc">Users will see "Gift Card unavailable" on the Buy page.</span>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={giftCardLocked} onChange={(e) => setGiftCardLocked(e.target.checked)} />
            <span className="slider" />
          </label>
        </div>

        {cardLocked && paypalLocked && giftCardLocked && (
          <div className="form-error">
            All methods are locked — users will see "Payments unavailable for now" and will be redirected to their dashboard.
          </div>
        )}

        <button className="primary-btn" onClick={saveLocks} disabled={savingLocks}>
          {savingLocks ? 'Saving...' : 'Save Payment Locks'}
        </button>
      </Section>
    </div>
  );
};

export default AdminSettings;