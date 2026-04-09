import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// IMPORT FIREBASE REALTIME DATABASE (Pinalitan ang Firestore)
import { getDatabase, ref, get, child, onValue, query, orderByChild } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBBsWGhsw7hHMOGu4QpLEOjNjKCjq_l2a0",
    authDomain: "fir-ai-app-96845.firebaseapp.com",
    databaseURL: "https://fir-ai-app-96845-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fir-ai-app-96845",
    storageBucket: "fir-ai-app-96845.firebasestorage.app",
    messagingSenderId: "564401363339",
    appId: "1:564401363339:web:f971caecec0f6f1af5778e"
};

// Initialize Firebase Apps
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); // REALTIME DATABASE NA ITO

// Attach Firebase instances and functions to the window object
window.fbAuth = auth;
window.fbDb = db;

// Export Realtime Database functions
window.fbFunctions = {
    onAuthStateChanged,
    signOut,
    ref,
    get,
    child,
    onValue,
    query,
    orderByChild
};

console.log("Firebase Realtime Database initialized!");
