
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Print version to console to help debugging cache issues
console.log('%c PharmacyShiftPro v1.3 Loaded ', 'background: #0284c7; color: #fff; border-radius: 4px; padding: 4px; font-weight: bold;');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}
