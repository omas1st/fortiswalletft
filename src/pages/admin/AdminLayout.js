import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiUsers, FiShield, FiCheckSquare, FiSliders, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const tabs = [
  { to: '/admin/users', label: 'Users Details', icon: <FiUsers /> },
  { to: '/admin/verification', label: 'User Verification', icon: <FiShield /> },
  { to: '/admin/approvals', label: 'Admin Approval', icon: <FiCheckSquare /> },
  { to: '/admin/settings', label: 'Settings', icon: <FiSliders /> },
];

const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-brand">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Fortis" />
          <span>Fortis Admin</span>
        </div>
        <button className="icon-btn logout" onClick={handleLogout} aria-label="Logout">
          <FiLogOut />
        </button>
      </header>

      <nav className="admin-tabs">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            {t.icon}
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;