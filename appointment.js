// appointment.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

// FIRESTORE (Para sa Profile Sidebar)
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// REALTIME DATABASE (Para sa Appointments & Seats)
import { getDatabase, ref, push, set, get, onValue, query, orderByChild, equalTo, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBBsWGhsw7hHMOGu4QpLEOjNjKCjq_l2a0",
    authDomain: "fir-ai-app-96845.firebaseapp.com",
    databaseURL: "https://fir-ai-app-96845-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fir-ai-app-96845",
    storageBucket: "fir-ai-app-96845.firebasestorage.app",
    messagingSenderId: "564401363339",
    appId: "1:564401363339:web:f971caecec0f6f1af5778e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestoreDb = getFirestore(app);
const realtimeDb = getDatabase(app);

// I-attach sa window object para mabasa ng HTML
window.fbAuth = auth;
window.fbDb = firestoreDb;       
window.fbRtdb = realtimeDb;      

window.fbFunctions = {
    onAuthStateChanged, signOut, 
    doc, getDoc, 
    ref, push, set, get, onValue, query, orderByChild, equalTo, serverTimestamp
};

console.log("Firebase initialized via appointment.js!");
