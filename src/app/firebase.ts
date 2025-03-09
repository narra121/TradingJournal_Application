// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAApvQ-SHupyAMfTAGIPJrb7vmTfk3-UPk",
  authDomain: "journal-dacb5.firebaseapp.com",
  projectId: "journal-dacb5",
  storageBucket: "journal-dacb5.firebasestorage.app",
  messagingSenderId: "948765740869",
  appId: "1:948765740869:web:baf50cb3bca3522775b82c",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
const analytics = getAnalytics(app);
