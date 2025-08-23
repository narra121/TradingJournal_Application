// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate that environment variables are loaded
if (!firebaseConfig.apiKey) {
  console.error("Firebase API Key is missing. Please check your .env file and Vite configuration.");
}
if (!firebaseConfig.authDomain) {
  console.error("Firebase Auth Domain is missing. Please check your .env file and Vite configuration.");
}
if (!firebaseConfig.projectId) {
  console.error("Firebase Project ID is missing. Please check your .env file and Vite configuration.");
}
if (!firebaseConfig.storageBucket) {
  console.error("Firebase Storage Bucket is missing. Please check your .env file and Vite configuration.");
}
if (!firebaseConfig.messagingSenderId) {
  console.error("Firebase Messaging Sender ID is missing. Please check your .env file and Vite configuration.");
}
if (!firebaseConfig.appId) {
  console.error("Firebase App ID is missing. Please check your .env file and Vite configuration.");
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
// const analytics = getAnalytics(app);
