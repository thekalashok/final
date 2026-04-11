import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Validate Connection to Firestore
async function testConnection() {
  try {
    console.log(`Testing connection to Firestore database: ${firebaseConfig.firestoreDatabaseId || '(default)'}`);
    // Attempt to fetch a non-existent doc to test connection
    await getDocFromServer(doc(db, '_test_', 'connection'));
    console.log("Firestore connection test completed (successfully reached backend).");
  } catch (error: any) {
    if (error.code === 'unavailable') {
      console.error("Firestore backend is currently unavailable. This may be a temporary network issue or the database is still provisioning.");
    } else if (error.message && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    } else {
      // Other errors (like permission denied or not found) actually mean we REACHED the server
      console.log("Firestore connection test reached the server (received expected error for test doc).");
    }
  }
}

testConnection();
