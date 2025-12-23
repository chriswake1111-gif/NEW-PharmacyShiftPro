// IMPORTANT: These values are loaded from Environment Variables.
// We explicitly check both VITE_ and REACT_APP_ prefixes to support different build tools (Vite vs CRA/Next.js)
// Explicitly listing them is required for some bundlers to perform static replacement.

// @ts-ignore
const getViteEnv = (key: string) => (import.meta && import.meta.env ? import.meta.env[key] : undefined);
const getProcessEnv = (key: string) => (typeof process !== 'undefined' && process.env ? process.env[key] : undefined);

const getValue = (viteKey: string, reactKey: string) => {
  return getViteEnv(viteKey) || getProcessEnv(reactKey) || '';
};

export const firebaseConfig = {
  apiKey: getValue('VITE_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_API_KEY'),
  authDomain: getValue('VITE_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_AUTH_DOMAIN'),
  projectId: getValue('VITE_FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID'),
  storageBucket: getValue('VITE_FIREBASE_STORAGE_BUCKET', 'REACT_APP_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getValue('VITE_FIREBASE_MESSAGING_SENDER_ID', 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getValue('VITE_FIREBASE_APP_ID', 'REACT_APP_FIREBASE_APP_ID'),
  measurementId: getValue('VITE_FIREBASE_MEASUREMENT_ID', 'REACT_APP_FIREBASE_MEASUREMENT_ID')
};

// Check if config is actually set correctly
export const isFirebaseConfigured = () => {
  const hasKey = firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;
  if (!hasKey) {
    console.warn("Firebase Configuration Missing: API Key is empty.");
  }
  return hasKey;
};