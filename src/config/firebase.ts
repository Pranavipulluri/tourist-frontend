// Firebase configuration
import { getAnalytics } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';
import { connectStorageEmulator, getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC6ZkmDxMmmUPS81-3j4Xe9NseJQeCRJUE",
  authDomain: "wakanda-82bdd.firebaseapp.com",
  projectId: "wakanda-82bdd",
  storageBucket: "wakanda-82bdd.firebasestorage.app",
  messagingSenderId: "894040632526",
  appId: "1:894040632526:web:9200b181c13686b774349f",
  measurementId: "G-NCD2J82G71"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = getAnalytics(app);

// Initialize messaging for push notifications
let messaging: any = null;
try {
  messaging = getMessaging(app);
} catch (error) {
  console.log('Messaging not supported in this environment');
}
export { messaging };

// Connect to emulators in development
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     (typeof window !== 'undefined' && window.location.hostname === 'localhost');

if (isDevelopment) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    console.log('Emulators already connected or not available');
  }
}

export default app;