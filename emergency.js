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
    // 1. Sidebar Profile Loader
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
            
            // 2. Trigger Emergency Ping automatically
            window.pingEmergencyLocation();
        } else {
            window.location.href = 'index.html';
        }
    });
});

window.pingEmergencyLocation = function() {
    const locStatus = document.getElementById('location-status');
    const locCoords = document.getElementById('location-coords');
    const hotlinesContainer = document.getElementById('hotlines-container');

    locStatus.innerHTML = '<i class="fa-solid fa-satellite-dish fa-beat"></i> Searching for GPS signal...';
    locCoords.textContent = "Detecting coordinates...";
    hotlinesContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full py-10 text-brand-primary/40">
            <i class="fa-solid fa-circle-notch fa-spin text-4xl mb-3"></i>
            <p class="font-medium text-sm">Locating nearby hotlines...</p>
        </div>`;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            locCoords.textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
            
            try {
                // 3. Reverse Geocoding (Kunin ang pangalan ng City/Municipality gamit ang Coordinates)
                locStatus.innerHTML = '<i class="fa-solid fa-map-location-dot"></i> Analyzing area...';
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                const data = await response.json();
                
                // Hanapin ang city, town, o municipality
                const detectedCity = data.address.city || data.address.town || data.address.municipality || data.address.village;
                
                if (detectedCity) {
                    locStatus.innerHTML = `<i class="fa-solid fa-location-dot"></i> You are in <span class="font-bold text-gray-900">${detectedCity}</span>`;
                    // 4. Fetch the Hotlines from JSON
                    fetchHotlines(detectedCity.toLowerCase());
                } else {
                    locStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-yellow-500"></i> Area detected, but city name is unknown.';
                    fetchHotlines("unknown");
                }
            } catch (error) {
                console.error("Geocoding error:", error);
                locStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-red-500"></i> Error analyzing location.';
                hotlinesContainer.innerHTML = '<p class="text-red-500 font-medium text-center">Could not load hotlines due to network error.</p>';
            }

        }, (error) => {
            locStatus.innerHTML = '<i class="fa-solid fa-location-crosshairs text-red-500"></i> GPS Signal Failed';
            locCoords.textContent = error.message;
            hotlinesContainer.innerHTML = `
                <div class="text-center py-10">
                    <i class="fa-solid fa-location-crosshairs text-4xl text-red-300 mb-3"></i>
                    <h3 class="text-lg font-bold text-gray-700">Location Access Denied</h3>
                    <p class="text-gray-500 text-sm mt-1">Please enable GPS/Location permissions to see emergency numbers.</p>
                </div>`;
        }, { enableHighAccuracy: true });
    } else {
        locStatus.textContent = "Geolocation is not supported.";
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

        // Simpleng paghahanap para kahit "General Trias" ang nasa map, match sa "general trias"
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
                const colorCode = contact.color === 'red' ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-600' :
                                  contact.color === 'blue' ? 'text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-600' :
                                  contact.color === 'green' ? 'text-green-600 bg-green-50 border-green-100 hover:bg-green-600' :
                                  'text-orange-600 bg-orange-50 border-orange-100 hover:bg-orange-600';

                const iconColor = contact.color === 'red' ? 'text-red-500' :
                                  contact.color === 'blue' ? 'text-blue-500' :
                                  contact.color === 'green' ? 'text-green-500' : 'text-orange-500';

                container.innerHTML += `
                    <div class="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:shadow-md transition-all group">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center ${iconColor} text-xl">
                                <i class="fa-solid ${contact.icon}"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">${contact.type}</p>
                                <p class="text-lg font-bold text-gray-900">${contact.number}</p>
                            </div>
                        </div>
                        <a href="tel:${contact.number}" class="flex items-center justify-center w-10 h-10 rounded-xl border ${colorCode} hover:text-white transition-all shadow-sm">
                            <i class="fa-solid fa-phone"></i>
                        </a>
                    </div>
                `;
            });
        } else {
            headerTitle.textContent = "Area Not Registered";
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full text-center py-10">
                    <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                        <i class="fa-solid fa-house-circle-xmark text-3xl text-gray-300"></i>
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
