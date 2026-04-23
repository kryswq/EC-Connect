// services.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBBsWGhsw7hHMOGu4QpLEOjNjKCjq_l2a0",
    authDomain: "fir-ai-app-96845.firebaseapp.com",
    databaseURL: "https://fir-ai-app-96845-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fir-ai-app-96845",
    storageBucket: "fir-ai-app-96845.firebasestorage.app",
    messagingSenderId: "564401363339",
    appId: "1:564401363339:web:f971caecec0f6f1af5778e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const dbFirestore = getFirestore(app);

window.fbAuth = auth;
window.fbDb = dbFirestore;

console.log("Firebase initialized for Services Page!");

// ==========================================
// 1. INITIALIZATION & LISTENER
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Get Profile details for Sidebar
            try {
                const docSnap = await getDoc(doc(dbFirestore, "profile", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const currentUserName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
                    const locText = data.city || "Location Not Set";
                    
                    if(document.getElementById('desktop-sidebar-name')) document.getElementById('desktop-sidebar-name').textContent = currentUserName;
                    if(document.getElementById('mobile-sidebar-name')) document.getElementById('mobile-sidebar-name').textContent = currentUserName;
                    if(document.getElementById('desktop-sidebar-location')) document.getElementById('desktop-sidebar-location').textContent = locText;
                    if(document.getElementById('mobile-sidebar-location')) document.getElementById('mobile-sidebar-location').textContent = locText;

                    const imgUrl = data.profile_image_url || data.id_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserName)}&background=15518D&color=fff`;
                    if(document.getElementById('desktop-sidebar-pic')) document.getElementById('desktop-sidebar-pic').src = imgUrl;
                    if(document.getElementById('mobile-sidebar-pic')) document.getElementById('mobile-sidebar-pic').src = imgUrl;
                }
            } catch (e) { 
                console.error("Error fetching profile:", e); 
            }
        } else {
            // If not logged in, redirect to login page
            window.location.href = 'index.html';
        }
    });
});

// Logout Function
window.handleLogout = () => signOut(auth).then(() => window.location.href = 'index.html');
