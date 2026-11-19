import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';

// Register Service Worker for PWA & Instant Mobile Order Notifications
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('✅ [PWA] Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ [PWA] Service Worker registration failed:', err.message);
      });
  };

  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}

const googleClientId =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '241648587834-i2usudn3sdi0b8sgoavritp7pbqdke1h.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);


