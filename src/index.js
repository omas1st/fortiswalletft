import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import './utils/pwa';
import App from './App';
import { AuthProvider } from './context/AuthContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // 🔧 When a new SW is waiting, activate it + reload once
        const activateIfWaiting = (worker) => {
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'activated' && navigator.serviceWorker.controller) {
              // A previous controller existed → this is an update, reload once
              window.location.reload();
            }
          });
        };

        if (reg.waiting) activateIfWaiting(reg.waiting);

        reg.addEventListener('updatefound', () => {
          activateIfWaiting(reg.installing);
        });

        // Check for a new SW every 60s (open tabs get new builds fast)
        setInterval(() => reg.update().catch(() => {}), 60000);
      })
      .catch(() => {});
  });

  // If the controller changes while the page is open, refresh once
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}