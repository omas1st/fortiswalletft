import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { useAuth } from './context/AuthContext';

import Home from './pages/Home';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import UserDashboard from './pages/UserDashboard';
import Buy from './pages/Buy';
import Swap from './pages/Swap';
import Send from './pages/Send';
import Withdraw from './pages/Withdraw';
import Settings from './pages/Settings';

import AdminLayout from './pages/admin/AdminLayout';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserEdit from './pages/admin/AdminUserEdit';
import AdminVerification from './pages/admin/AdminVerification';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminSettings from './pages/admin/AdminSettings';

const ProtectedRoute = ({ children, role }) => {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
};

const PublicOnly = ({ children }) => {
  const { user, token } = useAuth();
  if (token && user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicOnly><Home /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
      <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />

      <Route path="/dashboard" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/buy" element={<ProtectedRoute role="user"><Buy /></ProtectedRoute>} />
      <Route path="/swap" element={<ProtectedRoute role="user"><Swap /></ProtectedRoute>} />
      <Route path="/send" element={<ProtectedRoute role="user"><Send /></ProtectedRoute>} />
      <Route path="/withdraw" element={<ProtectedRoute role="user"><Withdraw /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute role="user"><Settings /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/users" replace />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="users/:id" element={<AdminUserEdit />} />
        <Route path="verification" element={<AdminVerification />} />
        <Route path="approvals" element={<AdminApprovals />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;