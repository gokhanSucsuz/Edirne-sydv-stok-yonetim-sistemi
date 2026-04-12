import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCedoRqKf19wSxE9Uq6iT5uRKsZBLiv3kE",
  authDomain: "stok-7278b.firebaseapp.com",
  projectId: "stok-7278b",
  storageBucket: "stok-7278b.firebasestorage.app",
  messagingSenderId: "702831744223",
  appId: "1:702831744223:web:54ff3b753128e75a20c56a",
  measurementId: "G-V6RTS7J549"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
