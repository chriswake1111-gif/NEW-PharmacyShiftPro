// IMPORTANT: For Vite applications, environment variables must begin with VITE_
// We use (import.meta as any).env to avoid TypeScript errors when vite types are not loaded.

export const firebaseConfig = {
  apiKey: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_API_KEY) || "AIzaSyC7wEuKNTB7ZdvZDgf8woscmExbalHjqBw",
  authDomain: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN) || "new-pharmacyshiftpro.firebaseapp.com",
  projectId: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_PROJECT_ID) || "new-pharmacyshiftpro",
  storageBucket: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET) || "new-pharmacyshiftpro.firebasestorage.app",
  messagingSenderId: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID) || "135841144238",
  appId: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_APP_ID) || "1:135841144238:web:9b6c5869190537a462bc3f",
  measurementId: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID)
};

// Check if config is actually set correctly
export const isFirebaseConfigured = () => {
  const hasKey = firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;
  if (!hasKey) {
    console.warn("Firebase Configuration Missing: API Key is empty.");
  }
  return hasKey;
};
