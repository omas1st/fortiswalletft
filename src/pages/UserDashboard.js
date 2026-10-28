import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FiCopy, FiSettings, FiBell, FiDownload, FiLogOut, FiChevronDown, FiPlus,
  FiTrendingUp, FiCreditCard, FiRefreshCw, FiArrowUpRight, FiArrowDownLeft,
  FiX, FiEye,
} from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ASSETS, assetIcon } from '../utils/assets';
import AssetChartModal from '../components/AssetChartModal';
import WalletAddressModal from '../components/WalletAddressModal';
import { promptInstall } from '../utils/pwa';
import './UserDashboard.css';

const fmtUsd = (n) =>
  `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [walletOpen, setWalletOpen] = useState(false);
  const [chartAsset, setChartAsset] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [preview, setPreview] = useState(null); // 'deposited' | 'withdrawn' | 'profit'
  const [toast, setToast] = useState('');
  const [showWelcome, setShowWelcome] = useState(Boolean(location.state?.newUser));

  const loadDashboard = useCallback(async () => {
    try {
      const { data: d } = await api.get('/user/dashboard');
      setData(d);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const { data: d } = await api.get('/user/notifications');
      setNotifications(d.notifications || []);
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    loadNotifications();
    if (location.state?.newUser) {
      window.history.replaceState({}, document.title);
    }
    const interval = setInterval(() => {
      loadDashboard();
      loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadDashboard, loadNotifications, location.state]);

  const firstName = data?.user?.firstName || user?.firstName || 'User';
  const fullName = `${data?.user?.firstName || user?.firstName || ''} ${
    data?.user?.lastName || user?.lastName || ''
  }`.trim();
  const walletAddress = data?.user?.walletAddress || user?.walletAddress || '';
  const totalBalance = data?.totalBalance ?? 0;
  const totalDeposited = data?.totalDeposited ?? 0;
  const totalWithdrawn = data?.totalWithdrawn ?? 0;
  const totalProfit = data?.totalProfit ?? 0;
  const assets = data?.assets || [];
  const deposits = data?.deposits || [];
  const withdrawals = data?.withdrawals || [];
  const unread = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleInstall = async () => {
    const res = await promptInstall();
    setToast(res.message);
    setTimeout(() => setToast(''), 5000);
  };

  const openNotifications = async () => {
    setNotifOpen((o) => !o);
    if (!notifOpen && unread > 0) {
      try {
        await api.post('/user/notifications/read-all');
        setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      } catch (e) {
        /* ignore */
      }
    }
  };

  const addAsset = async (symbol) => {
    try {
      await api.post('/user/assets', { symbol });
      setAddOpen(false);
      loadDashboard();
    } catch (err) {
      setToast(err?.response?.data?.message || 'Could not add asset');
      setTimeout(() => setToast(''), 4000);
    }
  };

  const ownedSymbols = assets.map((a) => a.symbol);

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="spinner" />
        <p>Loading your wallet...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dash-header">
        <div className="dash-header-left">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Fortis" className="dash-logo" />
          <div className="dash-user" onClick={() => setMenuOpen((o) => !o)}>
            <span className="dash-user-name">{fullName || 'User'}</span>
            <FiChevronDown />
            {menuOpen && (
              <div className="dash-menu" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setWalletOpen(true);
                    setMenuOpen(false);
                  }}
                >
                  <FiCopy /> Wallet Address
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="dash-header-right">
          <button className="icon-btn" onClick={() => navigate('/settings')} aria-label="Settings">
            <FiSettings />
          </button>
          <button className="icon-btn bell" onClick={openNotifications} aria-label="Notifications">
            <FiBell />
            {unread > 0 && <span className="badge">{unread}</span>}
          </button>
          <button className="icon-btn" onClick={handleInstall} aria-label="Download App">
            <FiDownload />
          </button>
          <button className="icon-btn logout" onClick={handleLogout} aria-label="Logout">
            <FiLogOut />
          </button>
        </div>
      </header>

      {notifOpen && (
        <div className="notif-panel">
          <div className="notif-head">
            <h4>Notifications</h4>
            <button onClick={() => setNotifOpen(false)}><FiX /></button>
          </div>
          <div className="notif-list">
            {notifications.length === 0 && <p className="empty">No notifications yet</p>}
            {notifications.map((n) => (
              <div key={n._id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                <p className="notif-title">{n.title}</p>
                <p className="notif-msg">{n.message}</p>
                <span className="notif-time">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      <section className="welcome-card">
        <h2>Welcome, {firstName} 👋</h2>
        <p>Here&apos;s an overview of your Fortis Wallet.</p>
      </section>

      <section className="balance-card">
        <p className="balance-label">Total Balance</p>
        <h1 className="balance-value">{fmtUsd(totalBalance)}</h1>
      </section>

      <section className="actions">
        {[
          { label: 'Buy', icon: <FiCreditCard />, path: '/buy' },
          { label: 'Swap', icon: <FiRefreshCw />, path: '/swap' },
          { label: 'Withdraw', icon: <FiArrowDownLeft />, path: '/withdraw' },
          { label: 'Send', icon: <FiArrowUpRight />, path: '/send' },
        ].map((a) => (
          <button key={a.label} className="action-btn" onClick={() => navigate(a.path)}>
            <span className="action-icon">{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </section>

      {/* 🔧 NEW: Transactions section */}
      <section className="transactions-section">
        <h3>Transactions</h3>
        <div className="transactions-grid">
          <div className="transaction-card">
            <div className="transaction-head">
              <span className="transaction-label">Total Deposited</span>
              <button
                className="preview-btn"
                onClick={() => setPreview('deposited')}
                aria-label="Preview deposits"
                title="Preview deposits"
              >
                <FiEye />
              </button>
            </div>
            <span className="transaction-value deposited">{fmtUsd(totalDeposited)}</span>
          </div>

          <div className="transaction-card">
            <div className="transaction-head">
              <span className="transaction-label">Total Withdrawn</span>
              <button
                className="preview-btn"
                onClick={() => setPreview('withdrawn')}
                aria-label="Preview withdrawals"
                title="Preview withdrawals"
              >
                <FiEye />
              </button>
            </div>
            <span className="transaction-value withdrawn">{fmtUsd(totalWithdrawn)}</span>
          </div>

          <div className="transaction-card">
            <div className="transaction-head">
              <span className="transaction-label">Total Profit</span>
              <button
                className="preview-btn"
                onClick={() => setPreview('profit')}
                aria-label="Preview profit"
                title="Preview profit"
              >
                <FiEye />
              </button>
            </div>
            <span className="transaction-value profit">{fmtUsd(totalProfit)}</span>
          </div>
        </div>
      </section>

      <section className="assets-section">
        <div className="assets-head">
          <button className="plus-btn" onClick={() => setAddOpen(true)} aria-label="Add asset">
            <FiPlus />
          </button>
          <h3>Digital Assets</h3>
        </div>

        {assets.length === 0 && <p className="empty">You have no assets yet. Tap + to add one.</p>}

        <div className="assets-list">
          {assets.map((a) => (
            <div className="asset-row" key={a.symbol}>
              <img src={assetIcon(a.symbol)} alt={a.symbol} className="asset-icon" />
              <div className="asset-info">
                <span className="asset-name">{a.name || a.symbol}</span>
                <span className="asset-symbol">{a.symbol}</span>
              </div>
              <div className="asset-amount">
                <button
                  className="chart-btn"
                  onClick={() => setChartAsset(a)}
                  aria-label="View chart"
                  title="View chart"
                >
                  <FiTrendingUp />
                </button>
                <span className="asset-usd">{fmtUsd(a.amount)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {toast && <div className="toast">{toast}</div>}

      {walletOpen && <WalletAddressModal address={walletAddress} onClose={() => setWalletOpen(false)} />}
      {chartAsset && <AssetChartModal asset={chartAsset} onClose={() => setChartAsset(null)} />}

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="add-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Add Digital Asset</h3>
              <button onClick={() => setAddOpen(false)}><FiX /></button>
            </div>
            <div className="add-grid">
              {ASSETS.filter((a) => !ownedSymbols.includes(a.symbol)).map((a) => (
                <button key={a.symbol} className="add-item" onClick={() => addAsset(a.symbol)}>
                  <img src={assetIcon(a.symbol)} alt={a.symbol} />
                  <span>{a.symbol}</span>
                  <small>{a.name}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🔧 NEW: preview modal for deposits / withdrawals / profit */}
      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                {preview === 'deposited' && 'Deposit History'}
                {preview === 'withdrawn' && 'Withdrawal History'}
                {preview === 'profit' && 'Profit by Asset'}
              </h3>
              <button onClick={() => setPreview(null)}><FiX /></button>
            </div>

            <div className="preview-list">
              {preview === 'deposited' && (
                <>
                  {deposits.length === 0 && <p className="empty">No deposits yet</p>}
                  {deposits.map((t) => (
                    <div className="preview-row" key={t._id}>
                      <div className="preview-row-left">
                        <img src={assetIcon(t.symbol)} alt={t.symbol} className="preview-icon" />
                        <div>
                          <span className="preview-title">{t.symbol}</span>
                          <span className="preview-sub">{new Date(t.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <span className="preview-amount">+{fmtUsd(t.amount)}</span>
                    </div>
                  ))}
                </>
              )}

              {preview === 'withdrawn' && (
                <>
                  {withdrawals.length === 0 && <p className="empty">No withdrawals yet</p>}
                  {withdrawals.map((t) => (
                    <div className="preview-row" key={t._id}>
                      <div className="preview-row-left">
                        <img src={assetIcon(t.symbol)} alt={t.symbol} className="preview-icon" />
                        <div>
                          <span className="preview-title">{t.symbol}</span>
                          <span className="preview-sub">{new Date(t.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <span className="preview-amount negative">-{fmtUsd(t.amount)}</span>
                    </div>
                  ))}
                </>
              )}

              {preview === 'profit' && (
                <>
                  {assets.length === 0 && <p className="empty">No assets yet</p>}
                  {assets.length > 0 && assets.every((a) => Number(a.profit) === 0) && (
                    <p className="empty">No profit recorded yet</p>
                  )}
                  {assets.map((a) => (
                    <div className="preview-row" key={a.symbol}>
                      <div className="preview-row-left">
                        <img src={assetIcon(a.symbol)} alt={a.symbol} className="preview-icon" />
                        <div>
                          <span className="preview-title">{a.name}</span>
                          <span className="preview-sub">{a.symbol}</span>
                        </div>
                      </div>
                      <span className="preview-amount positive">+{fmtUsd(a.profit)}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showWelcome && (
        <div className="modal-overlay">
          <div className="welcome-modal">
            <h3>Welcome to Fortis Wallet 🎉</h3>
            <p>Your unique wallet address has been generated:</p>
            <div className="welcome-address">{walletAddress}</div>
            <p className="hint">Use this address to receive digital assets.</p>
            <button className="primary-btn" onClick={() => setShowWelcome(false)}>Okay</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;