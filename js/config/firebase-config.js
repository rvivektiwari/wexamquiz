// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot, collection, query, orderBy, increment, addDoc, serverTimestamp, where, getDocs, limit, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDxquodcM8VO65MjEKt6J0wlhtYjfm8iLk",
    authDomain: "english-efa3c.firebaseapp.com",
    projectId: "english-efa3c",
    storageBucket: "english-efa3c.firebasestorage.app",
    messagingSenderId: "727201817701",
    appId: "1:727201817701:web:e47ae3688df652988a128c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Initialize Firestore with persistent cache
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, onSnapshot, collection, query, orderBy, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail, increment, addDoc, serverTimestamp, where, getDocs, limit, Timestamp };

