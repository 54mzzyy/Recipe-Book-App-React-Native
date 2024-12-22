// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3MnRIVAUkQ-TtOG7zyA_qmEFyudcYjuc",
  authDomain: "recipebook-c8e3b.firebaseapp.com",
  projectId: "recipebook-c8e3b",
  storageBucket: "recipebook-c8e3b.firebasestorage.app",
  messagingSenderId: "657552322949",
  appId: "1:657552322949:web:a598c35d450cd3946654ec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
export const auth = getAuth(app)