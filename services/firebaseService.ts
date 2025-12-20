
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBYaGr06yACVb8L6Mo8vpr_PowyZ1kWpxo",
  authDomain: "oweno-chat.firebaseapp.com",
  projectId: "oweno-chat",
  storageBucket: "oweno-chat.firebasestorage.app",
  messagingSenderId: "758511269476",
  appId: "1:758511269476:web:cbdb18fccd6b1928c41171",
  measurementId: "G-GL63QNG855"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
