import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Ensure storageBucket is set, fallback to appspot.com if it looks like a placeholder or is missing
const config = {
  ...firebaseConfig,
  storageBucket: firebaseConfig.storageBucket || `${firebaseConfig.projectId}.appspot.com`
};

const app = initializeApp(config);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
