import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Build config from Vite env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
} as const;

function hasRequiredFirebaseConfig(cfg: typeof firebaseConfig) {
  // At minimum apiKey, authDomain, projectId, appId are typically required for web apps
  return Boolean(
    cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId &&
    String(cfg.apiKey).length > 10
  );
}

let app: ReturnType<typeof initializeApp> | undefined;
let _auth: ReturnType<typeof getAuth> | undefined;
let _db: ReturnType<typeof getFirestore> | undefined;
let _googleProvider: GoogleAuthProvider | undefined;
let _available = false;

try {
  if (hasRequiredFirebaseConfig(firebaseConfig)) {
    app = initializeApp(firebaseConfig);
    _auth = getAuth(app);
    _db = getFirestore(app);
    _googleProvider = new GoogleAuthProvider();
    _available = true;
  } else {
    console.warn('[firebase] Missing or invalid Firebase config. Auth disabled.');
  }
} catch (err) {
  console.error('[firebase] Failed to initialize Firebase:', err);
  _available = false;
}

export const firebaseAvailable = _available;
export const auth = _auth as any; // guarded usage in consumers
export const db = _db as any;
export const googleProvider = _googleProvider as any;

export default app as any;