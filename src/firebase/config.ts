// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp  } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKPzQ8f3P4wsy9AHdY-QExhk1Dp23m7gI",
  authDomain: "etianguis-fa446.firebaseapp.com",
  databaseURL: "https://etianguis-fa446-default-rtdb.firebaseio.com",
  projectId: "etianguis-fa446",
  storageBucket: "etianguis-fa446.firebasestorage.app",
  messagingSenderId: "209443908411",
  appId: "1:209443908411:web:13c4af37a1b2d599b2251e",
  measurementId: "G-TZ21L209S9"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);