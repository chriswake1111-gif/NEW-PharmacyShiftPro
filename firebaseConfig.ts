
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

/**
 * Check if the Firebase configuration is complete.
 * This prevents the app from hanging when cloud features are triggered without keys.
 */
export const isFirebaseConfigured = () => {
  const essentialKeys = ['apiKey', 'projectId', 'appId'];
  const missingKeys = essentialKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missingKeys.length > 0) {
    console.warn(`Firebase Configuration Missing: [${missingKeys.join(', ')}]. Cloud sync will be disabled.`);
    return false;
  }
  return true;
};
