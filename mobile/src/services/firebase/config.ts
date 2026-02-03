import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDyiDpodbZ2yPLNFnERQAt-oXGs1-RZq4M",
  authDomain: "lalantsika-project.firebaseapp.com",
  databaseURL: "https://lalantsika-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "lalantsika-project",
  storageBucket: "lalantsika-project.firebasestorage.app",
  messagingSenderId: "681061277527",
  appId: "1:681061277527:web:ef6250570defc155512812",
  measurementId: "G-MP6R0PCT51"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics (optionnel, seulement pour le web)
let analytics;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.log('Analytics non disponible sur cette plateforme');
}

export { analytics };
export default app;
