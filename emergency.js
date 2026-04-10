// emergency.js
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
window.fbFunctions = { onAuthStateChanged, signOut, doc, getDoc };

window.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const docSnap = await getDoc(doc(dbFirestore, "profile", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
                    const locText = data.city || "Location Not Set";
                    
                    document.getElementById('desktop-sidebar-name').textContent = fullName;
                    document.getElementById('mobile-sidebar-name').textContent = fullName;
                    document.getElementById('desktop-sidebar-location').textContent = locText;
                    document.getElementById('mobile-sidebar-location').textContent = locText;

                    const imgUrl = data.profile_image_url || data.id_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=15518D&color=fff`;
                    document.getElementById('desktop-sidebar-pic').src = imgUrl;
                    document.getElementById('mobile-sidebar-pic').src = imgUrl;
                }
            } catch (e) { console.error(e); }
            
            window.pingEmergencyLocation();
        } else {
            window.location.href = 'index.html';
        }
    });
});

window.pingEmergencyLocation = function() {
    const locStatus = document.getElementById('location-status');
    const locCoords = document.getElementById('location-coords');
    const yourLocationText = document.getElementById('your-location-text');
    const hotlinesContainer = document.getElementById('hotlines-container');

    locStatus.innerHTML = '<i class="fa-solid fa-satellite-dish fa-beat text-brand-primary mr-1.5"></i> Searching for GPS signal...';
    locCoords.textContent = "Detecting coordinates...";
    yourLocationText.textContent = "Detecting...";
    
    hotlinesContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full py-10 text-brand-primary/40">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-3 text-brand-primary"></i>
            <p class="font-medium text-sm text-brand-primary">Locating nearby hotlines...</p>
        </div>`;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            locCoords.textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
            
            try {
                locStatus.innerHTML = '<i class="fa-solid fa-map-location-dot text-brand-primary mr-1.5"></i> Reverse geocoding location...';
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                const data = await response.json();
                
                const detectedCity = data.address.city || data.address.town || data.address.municipality || data.address.village || "Unknown Area";
                // FIX: Check multiple common keys for barangay in OSM data
                const barangayName = data.address.village || data.address.quarter || data.address.suburb || data.address.neighbourhood || data.address.hamlet || "";
                
                // Display simple location
                if(barangayName && detectedCity !== "Unknown Area") {
                    yourLocationText.textContent = `${barangayName}, ${detectedCity}`;
                } else if (detectedCity !== "Unknown Area") {
                    yourLocationText.textContent = detectedCity;
                } else {
                     yourLocationText.textContent = "Location Unknown";
                }

                if (detectedCity && detectedCity !== "Unknown Area") {
                    locStatus.innerHTML = `<i class="fa-solid fa-location-dot text-brand-accent mr-1.5"></i> Location verified.`;
                    fetchHotlines(detectedCity.toLowerCase());
                } else {
                    locStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-red-500 mr-1.5"></i> Area detected, but city name is unknown.';
                    fetchHotlines("unknown");
                }
            } catch (error) {
                console.error("Geocoding error:", error);
                locStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-red-500 mr-1.5"></i> Error analyzing location.';
                yourLocationText.textContent = "Error";
                hotlinesContainer.innerHTML = '<p class="text-red-500 font-medium text-center">Could not load hotlines due to network error.</p>';
            }

        }, (error) => {
            locStatus.innerHTML = '<i class="fa-solid fa-location-crosshairs text-red-500 mr-1.5"></i> GPS Signal Failed';
            locCoords.textContent = error.message;
            yourLocationText.textContent = "Access Denied";
            hotlinesContainer.innerHTML = `
                <div class="text-center py-10">
                    <i class="fa-solid fa-location-crosshairs text-4xl text-red-500 mb-3"></i>
                    <h3 class="text-lg font-bold text-gray-700">Location Access Denied</h3>
                    <p class="text-gray-500 text-sm mt-1">Please enable GPS/Location permissions to see emergency numbers.</p>
                </div>`;
        }, { enableHighAccuracy: true });
    } else {
        locStatus.textContent = "Geolocation is not supported.";
        yourLocationText.textContent = "Unsupported";
    }
};

async function fetchHotlines(cityKey) {
    const container = document.getElementById('hotlines-container');
    const headerTitle = document.getElementById('hotline-area-title');
    
    try {
        const response = await fetch('hotlines.json');
        const db = await response.json();
        
        let matchFound = false;
        let cityData = null;

        for (const key in db) {
            if (cityKey.includes(key) || key.includes(cityKey)) {
                matchFound = true;
                cityData = db[key];
                break;
            }
        }

        if (matchFound && cityData) {
            headerTitle.textContent = `Hotlines for ${cityData.displayName}`;
            container.innerHTML = '';
            
            cityData.contacts.forEach(contact => {
                container.innerHTML += `
                    <div class="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:shadow-md transition-all group">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-brand-primary text-xl">
                                <i class="fa-solid ${contact.icon}"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">${contact.type}</p>
                                <p class="text-lg font-bold text-brand-primary">${contact.number}</p>
                            </div>
                        </div>
                        <a href="tel:${contact.number}" class="flex items-center justify-center w-10 h-10 rounded-xl border border-brand-primary/20 transition-all shadow-sm text-brand-primary bg-brand-primary/5 hover:text-white hover:bg-brand-primary">
                            <i class="fa-solid fa-phone"></i>
                        </a>
                    </div>
                `;
            });
        } else {
            headerTitle.textContent = "Area Not Registered";
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center py-10">
                    <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                        <i class="fa-solid fa-house-circle-xmark text-3xl text-red-500"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-700">Location Not Registered</h3>
                    <p class="text-gray-500 text-sm mt-1 max-w-xs">We currently do not have the emergency hotlines for your specific area in our database.</p>
                </div>`;
        }

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p class="text-red-500 text-center font-bold">Failed to load hotline database.</p>';
    }
}

window.handleLogout = () => window.fbFunctions.signOut(window.fbAuth).then(() => window.location.href = 'index.html');
