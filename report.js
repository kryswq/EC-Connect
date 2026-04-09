// report.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getDatabase, ref, push, set, onValue, query, orderByChild, equalTo, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const dbFirestore = getFirestore(app);
const dbRealtime = getDatabase(app);

window.fbAuth = auth;
window.fbDb = dbFirestore;
window.fbRtdb = dbRealtime;
window.fbFunctions = { onAuthStateChanged, signOut, doc, getDoc, ref, push, set, onValue, query, orderByChild, equalTo, serverTimestamp };

console.log("Firebase initialized for Report Page!");

// Cloudinary Config
const cloudName = 'dgoho5phg'; 
const uploadPreset = 'Report'; 

// Global Storage for fetched reports (so we can view them in the modal)
window.allUserReports = {};

// ==========================================
// 1. INITIALIZATION & LISTENER
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let currentUserName = "Citizen";
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            
            // Get Profile details for Sidebar
            try {
                const docSnap = await getDoc(doc(dbFirestore, "profile", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    currentUserName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
                    
                    const locText = data.city || "Location Not Set";
                    document.getElementById('desktop-sidebar-name').textContent = currentUserName;
                    document.getElementById('mobile-sidebar-name').textContent = currentUserName;
                    document.getElementById('desktop-sidebar-location').textContent = locText;
                    document.getElementById('mobile-sidebar-location').textContent = locText;

                    const imgUrl = data.profile_image_url || data.id_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserName)}&background=15518D&color=fff`;
                    document.getElementById('desktop-sidebar-pic').src = imgUrl;
                    document.getElementById('mobile-sidebar-pic').src = imgUrl;
                }
            } catch (e) { console.error(e); }

            // Hook up form submission
            document.getElementById('report-form').addEventListener('submit', function(e) {
                window.submitReport(e, currentUserId, currentUserName);
            });

            // Fetch Realtime Reports
            const listContainer = document.getElementById('reports-list');
            const reportQuery = query(ref(dbRealtime, "reports"), orderByChild("userId"), equalTo(currentUserId));

            onValue(reportQuery, (snapshot) => {
                window.allUserReports = {}; // Reset local cache
                
                if(!snapshot.exists()) {
                    listContainer.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-center">
                            <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <i class="fa-solid fa-comment-slash text-3xl text-gray-300"></i>
                            </div>
                            <h3 class="text-lg font-bold text-gray-700">No reports found</h3>
                            <p class="text-gray-400 text-sm mt-1">Issues you report will appear here.</p>
                        </div>`;
                    return;
                }

                let reportsArray = [];
                snapshot.forEach(child => { 
                    const rep = { id: child.key, ...child.val() };
                    reportsArray.push(rep); 
                    window.allUserReports[rep.id] = rep; // Store in cache for Modal
                });
                
                reportsArray.sort((a, b) => b.createdAt - a.createdAt); // Newest first

                listContainer.innerHTML = '';
                reportsArray.forEach(rep => {
                    const dateObj = new Date(rep.createdAt);
                    const readableDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    
                    const cssStatus = rep.status.replace(/\s+/g, '');
                    const statusClass = `status-${cssStatus}`; 

                    let imgHtml = `<div class="w-16 h-16 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0"><i class="fa-solid fa-image"></i></div>`;
                    if (rep.images && rep.images.length > 0) {
                        imgHtml = `<img src="${rep.images[0]}" class="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-100">`;
                    }

                    // Dinagdagan natin ng onclick para lumabas yung Modal
                    listContainer.innerHTML += `
                        <div onclick="window.viewReportDetails('${rep.id}')" class="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex gap-4 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                            ${imgHtml}
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-start mb-1">
                                    <h4 class="font-bold text-gray-900 text-sm truncate pr-2 group-hover:text-brand-primary">${rep.description}</h4>
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass} uppercase tracking-wider shrink-0">${rep.status}</span>
                                </div>
                                <p class="text-xs text-gray-500 font-medium mb-1 truncate">
                                    <i class="fa-solid fa-map-pin text-red-500 mr-1"></i> ${rep.latitude.toFixed(4)}, ${rep.longitude.toFixed(4)}
                                </p>
                                <p class="text-[10px] text-gray-400 font-semibold"><i class="fa-regular fa-clock mr-1"></i> ${readableDate}</p>
                            </div>
                        </div>
                    `;
                });
            });

        } else {
            window.location.href = 'index.html';
        }
    });
});

// ==========================================
// 2. VIEW REPORT DETAILS (Post-Submit Modal)
// ==========================================
window.viewReportDetails = function(reportId) {
    const rep = window.allUserReports[reportId];
    if(!rep) return;

    // Status Badge
    const cssStatus = rep.status.replace(/\s+/g, '');
    const statusLabel = document.getElementById('det-status');
    statusLabel.textContent = rep.status;
    statusLabel.className = `text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider status-${cssStatus}`;

    // Texts
    document.getElementById('det-desc').textContent = rep.description;
    document.getElementById('det-loc').innerHTML = `<i class="fa-solid fa-map-pin mr-1.5"></i> ${rep.latitude.toFixed(4)}, ${rep.longitude.toFixed(4)}`;

    // Images
    const imgContainer = document.getElementById('det-images');
    const imgSection = document.getElementById('det-img-section');
    imgContainer.innerHTML = '';
    
    if (rep.images && rep.images.length > 0) {
        imgSection.classList.remove('hidden');
        rep.images.forEach(imgSrc => {
            imgContainer.innerHTML += `<img src="${imgSrc}" class="w-24 h-24 object-cover rounded-lg shadow-sm border border-gray-200 shrink-0">`;
        });
    } else {
        imgSection.classList.add('hidden');
    }

    document.getElementById('details-modal').classList.remove('hidden');
};

// ==========================================
// 3. FORM HELPERS (Images & GPS)
// ==========================================
window.handleImageSelect = function() {
    const input = document.getElementById('report-images');
    const previewContainer = document.getElementById('image-preview-container');
    const files = Array.from(input.files);
    
    previewContainer.innerHTML = ''; 
    
    if (files.length > 5) {
        alert("You can only upload up to 5 images.");
        input.value = ''; 
        previewContainer.classList.add('hidden');
        return;
    }

    if (files.length > 0) {
        previewContainer.classList.remove('hidden');
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = "w-full h-16 object-cover rounded-lg shadow-sm border border-gray-200";
                previewContainer.appendChild(img);
            }
            reader.readAsDataURL(file);
        });
    } else {
        previewContainer.classList.add('hidden');
    }
};

window.getLocation = function() {
    const statusLabel = document.getElementById('location-status');
    const latInput = document.getElementById('report-lat');
    const longInput = document.getElementById('report-long');
    const btnLoc = document.getElementById('btn-location');
    
    btnLoc.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Locating...';
    btnLoc.disabled = true;
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                latInput.value = position.coords.latitude;
                longInput.value = position.coords.longitude;
                
                statusLabel.innerHTML = `<i class="fa-solid fa-map-pin text-red-500"></i> Pinned: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                statusLabel.classList.remove('hidden', 'text-red-500');
                statusLabel.classList.add('text-green-600');
                
                btnLoc.innerHTML = '<i class="fa-solid fa-check"></i> Location Pinned';
                btnLoc.classList.replace('bg-brand-primary', 'bg-green-600');
                btnLoc.classList.replace('hover:bg-[#0f3b68]', 'hover:bg-green-700');
            }, 
            (error) => {
                statusLabel.textContent = `Error: ${error.message}. Please enable location services.`;
                statusLabel.classList.remove('hidden', 'text-green-600');
                statusLabel.classList.add('text-red-500');
                btnLoc.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Get Location';
                btnLoc.disabled = false;
            },
            { enableHighAccuracy: true } 
        );
    } else {
        alert("Geolocation is not supported by your browser.");
        btnLoc.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Get Location';
        btnLoc.disabled = false;
    }
};

// ==========================================
// 4. SUBMIT REPORT LOGIC
// ==========================================
window.submitReport = async function(e, currentUserId, currentUserName) {
    e.preventDefault();
    
    const description = document.getElementById('report-description').value;
    const lat = document.getElementById('report-lat').value;
    const long = document.getElementById('report-long').value;
    const imageFiles = document.getElementById('report-images').files;
    const msgBox = document.getElementById('report-msg');
    const btn = document.getElementById('btn-submit-report');

    if (!lat || !long) {
        msgBox.textContent = "Please pin your location first.";
        msgBox.className = "p-3 rounded-xl text-sm font-bold text-center bg-red-50 text-red-600 block mt-2";
        msgBox.classList.remove('hidden');
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting Report...';
    btn.disabled = true;
    msgBox.classList.add('hidden');

    try {
        // 1. Fetch Contact and Address in the background
        let userContact = "Not provided";
        let userAddress = "Location Not Set";
        
        const docRef = doc(dbFirestore, "profile", currentUserId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            userContact = data.mobile_number || data.phone || "Not provided";
            const addressParts = [data.barangay, data.city, data.province].filter(Boolean);
            if (addressParts.length > 0) userAddress = addressParts.join(', ');
        }

        // 2. Upload Images to Cloudinary
        let uploadedImageUrls = [];
        if (imageFiles.length > 0) {
            msgBox.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Uploading ${imageFiles.length} image(s)...`;
            msgBox.className = "p-3 rounded-xl text-sm font-bold text-center bg-blue-50 text-blue-600 block mt-2";
            msgBox.classList.remove('hidden');

            for (let i = 0; i < imageFiles.length; i++) {
                const formData = new FormData();
                formData.append('file', imageFiles[i]);
                formData.append('upload_preset', uploadPreset);

                const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error("Image upload failed.");
                const imgData = await response.json();
                uploadedImageUrls.push(imgData.secure_url);
            }
        }

        msgBox.innerHTML = `<i class="fa-solid fa-database"></i> Saving report...`;

        // 3. Save to Firebase Realtime Database
        const newReportRef = push(ref(dbRealtime, "reports"));
        await set(newReportRef, {
            userId: currentUserId,
            userName: currentUserName,
            userContact: userContact,       // Na-save na
            userAddress: userAddress,       // Na-save na
            description: description,
            latitude: parseFloat(lat),
            longitude: parseFloat(long),
            images: uploadedImageUrls, 
            status: "Pending", 
            createdAt: serverTimestamp()
        });

        // 4. Success Reset
        msgBox.textContent = "Report successfully submitted! Salamat sa tulong.";
        msgBox.className = "p-3 rounded-xl text-sm font-bold text-center bg-green-50 text-green-600 block mt-2";
        
        document.getElementById('report-form').reset();
        document.getElementById('image-preview-container').innerHTML = '';
        document.getElementById('image-preview-container').classList.add('hidden');
        document.getElementById('report-lat').value = '';
        document.getElementById('report-long').value = '';
        
        const btnLoc = document.getElementById('btn-location');
        btnLoc.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Get Current Location';
        btnLoc.classList.replace('bg-green-600', 'bg-brand-primary');
        btnLoc.classList.replace('hover:bg-green-700', 'hover:bg-[#0f3b68]');
        btnLoc.disabled = false;
        document.getElementById('location-status').classList.add('hidden');

        setTimeout(() => { msgBox.classList.add('hidden'); }, 5000);

    } catch (error) {
        console.error(error);
        msgBox.textContent = "Submission failed. Please check your connection.";
        msgBox.className = "p-3 rounded-xl text-sm font-bold text-center bg-red-50 text-red-600 block mt-2";
        msgBox.classList.remove('hidden');
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Report';
        btn.disabled = false;
    }
};

window.handleLogout = () => signOut(auth).then(() => window.location.href = 'index.html');
