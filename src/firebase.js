+16
-16

// src/firebase.js␊
import { initializeApp } from "firebase/app";␊
import { getAuth } from "firebase/auth";␊
import { getFirestore } from "firebase/firestore";␊
␊
const firebaseConfig = {␊
  apiKey: "AIzaSyD1MzFkoOcvBHiKhm9ii-XbTtJns6VlLno",␊
  authDomain: "duncantoystore-f5a3d.firebaseapp.com",␊
  projectId: "duncantoystore-f5a3d",␊
  storageBucket: "duncantoystore-f5a3d.firebasestorage.app",␊
  messagingSenderId: "712063855287",␊
  appId: "1:712063855287:web:26f425cf54e50418b93b32",␊
};␊
␊
const app = initializeApp(firebaseConfig);␊
export const auth = getAuth(app);␊
export const db = getFirestore(app);␊
