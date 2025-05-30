import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration - use dummy values for emulator mode
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mortgage-firebase-firebase',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-XXXXXXXXXX'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
  const firestoreEmulatorHost = import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  
  try {
    // Connect to Auth emulator
    connectAuthEmulator(auth, `http://${authEmulatorHost}`, { disableWarnings: true });
    console.log('🔥 Firebase Auth emulator connected:', `http://${authEmulatorHost}`);
    
    // Parse host and port for Firestore emulator
    const [firestoreHost, firestorePort] = firestoreEmulatorHost.split(':');
    connectFirestoreEmulator(db, firestoreHost.trim(), parseInt(firestorePort) || 8080);
    console.log('🔥 Firebase Firestore emulator connected:', `${firestoreHost}:${firestorePort}`);
    
  } catch (error) {
    // Emulators might already be connected
    if (error instanceof Error && error.message && error.message.includes('already')) {
      console.log('✅ Firebase emulators already connected');
    } else {
      console.warn('⚠️ Firebase emulator connection issue:', error instanceof Error ? error.message : String(error));
    }
  }
}

// Debug: Log the current configuration
console.log('🔧 Firebase configuration:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  useEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR,
  authEmulatorHost: import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST,
  isDev: import.meta.env.DEV,
  mode: import.meta.env.MODE
});

// Additional debug: Check if emulator connection should happen
console.log('🔍 Emulator connection check:', {
  isDev: import.meta.env.DEV,
  useEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR,
  useEmulatorString: String(import.meta.env.VITE_USE_FIREBASE_EMULATOR),
  shouldConnect: import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
});

export default app;