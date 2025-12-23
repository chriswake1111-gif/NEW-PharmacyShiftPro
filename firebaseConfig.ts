// IMPORTANT: For Vite applications, environment variables must begin with VITE_
// We use (import.meta as any).env to avoid TypeScript errors when vite types are not loaded.

export const firebaseConfig = {
  apiKey: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_API_KEY) || "",
  authDomain: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN) || "",
  projectId: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_PROJECT_ID) || "",
  storageBucket: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET) || "",
  messagingSenderId: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID) || "",
  appId: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_APP_ID) || "",
  measurementId: ((import.meta as any).env && (import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID) || ""
};

// Check if config is actually set correctly
export const isFirebaseConfigured = () => {
  const hasKey = firebaseConfig.apiKey && firebaseConfig.apiKey.length > 0;
  if (!hasKey) {
    console.warn("Firebase Configuration Missing: API Key is empty. Please set VITE_FIREBASE_API_KEY in your environment variables.");
  }
  return hasKey;
};