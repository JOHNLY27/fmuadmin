import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAEOEPEdbUgz4BwJIk5mX7D4US5Agm6avE",
  authDomain: "fetchmeup-727fe.firebaseapp.com",
  projectId: "fetchmeup-727fe",
  storageBucket: "fetchmeup-727fe.firebasestorage.app",
  messagingSenderId: "549661622643",
  appId: "1:549661622643:web:617fdae14421fa6c93c506",
  measurementId: "G-99KJJCFG4G"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
