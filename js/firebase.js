console.log("FIREBASE CARGADO");

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
  updateDoc,
  increment,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBeOx072-hBkqmMC9nJVeHExJbY55ZsAS8",
  authDomain: "paginanova-11b8b.firebaseapp.com",
  projectId: "paginanova-11b8b",
  storageBucket: "paginanova-11b8b.firebasestorage.app",
  messagingSenderId: "639253914757",
  appId: "1:639253914757:web:9da3928f8dbb19e3d375ec"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

export {
  auth,
  provider,
  signInWithPopup,
  signOut,
  db,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp,
  where,
  updateDoc,
  increment,
  getDoc,
  onSnapshot
};