// guide.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

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
const dbFirestore = getFirestore(app);

window.fbAuth = auth;
window.fbDb = dbFirestore;

console.log("Firebase initialized for Citizen Guide!");

window.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
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
            window.location.href = 'index.html';
        }
    });
});

window.handleLogout = () => signOut(auth).then(() => window.location.href = 'index.html');

// ==========================================
// TEXT TO SPEECH FEATURE (Web Speech API)
// ==========================================
window.currentUtterance = null; // Global variable to keep track of speaking

window.readGuide = function(buttonElement, titleId, descId, listId) {
    // 1. Stop current speech if any
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        // If they clicked the same button that was playing, just stop it and return.
        if (buttonElement.classList.contains('speaking-active')) {
            resetAllSpeakerButtons();
            return;
        }
    }

    // Reset all buttons styling
    resetAllSpeakerButtons();

    // 2. Gather the text to read
    const titleText = document.getElementById(titleId).textContent;
    const descText = document.getElementById(descId).textContent;
    
    let listText = "";
    const listItems = document.getElementById(listId).querySelectorAll('li');
    listItems.forEach((li, index) => {
        // Find the actual text content inside the span
        const textSpan = li.querySelector('span:last-child');
        if(textSpan) {
            listText += `Step ${index + 1}. ${textSpan.textContent}. `;
        }
    });

    const fullTextToRead = `${titleText}. ${descText}. ${listText}`;

    // 3. Configure and Start Speech
    window.currentUtterance = new SpeechSynthesisUtterance(fullTextToRead);
    window.currentUtterance.lang = 'en-PH'; // Try Philippine English voice if available
    window.currentUtterance.rate = 0.9; // Slightly slower for better understanding

    // Change button styling while speaking
    buttonElement.classList.add('speaking-active');
    buttonElement.innerHTML = '<i class="fa-solid fa-volume-high fa-beat"></i>';
    buttonElement.classList.replace('bg-gray-100', 'bg-brand-primary');
    buttonElement.classList.replace('text-gray-500', 'text-white');

    window.currentUtterance.onend = function() {
        resetAllSpeakerButtons();
    };

    window.speechSynthesis.speak(window.currentUtterance);
};

function resetAllSpeakerButtons() {
    const buttons = document.querySelectorAll('.speaker-btn');
    buttons.forEach(btn => {
        btn.classList.remove('speaking-active');
        btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        btn.classList.add('bg-gray-100', 'text-gray-500');
        btn.classList.remove('bg-brand-primary', 'text-white');
    });
}
