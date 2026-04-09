// feed.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// FIRESTORE (Para sa Sidebar Profile Info)
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// REALTIME DATABASE (Para sa EC Feed Posts)
import { getDatabase, ref, onValue, query, orderByChild } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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
const firestoreDb = getFirestore(app);
const realtimeDb = getDatabase(app);

// Attach instances to window object
window.fbAuth = auth;
window.fbDb = firestoreDb;       // Para sa profile
window.fbRtdb = realtimeDb;      // Para sa feed

// Export functions to HTML
window.fbFunctions = {
    onAuthStateChanged,
    signOut,
    doc,
    getDoc,
    ref,
    onValue,
    query,
    orderByChild
};

console.log("Firebase initialized for CivicFeed Page!");
