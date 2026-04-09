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

// I-attach sa window para magamit sa HTML
window.fbAuth = auth;
window.fbDb = dbFirestore;
window.fbRtdb = dbRealtime;
window.fbFunctions = { onAuthStateChanged, signOut, doc, getDoc, ref, push, set, onValue, query, orderByChild, equalTo, serverTimestamp };

console.log("Firebase initialized for Report Page!");

// ==========================================
// PANG-CLOUDINARY CONFIG
// ==========================================
const cloudName = 'dgoho5phg'; 
const uploadPreset = 'ec_connect'; 

// Global variable to hold data for the preview modal
window.pendingReportData = null;

// ==========================================
// IMAGE PREVIEW LOGIC (Form)
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

// ==========================================
// GEOLOCATION LOGIC (GPS)
// ==========================================
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
// 1. TRIGGER PREVIEW MODAL
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

    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Preparing Preview...';
    btn.disabled = true;
    msgBox.classList.add('hidden');

    try {
        // Kunin ang kumpletong details mula sa Firestore Profile
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

        // I-save pansamantala ang data
        window.pendingReportData = {
            currentUserId,
            currentUserName,
            userContact,
            userAddress,
            description,
            lat,
            long,
            imageFiles
        };

        // I-populate ang Preview Modal HTML
        document.getElementById('prev-name').textContent = currentUserName;
        document.getElementById('prev-number').textContent = userContact;
        document.getElementById('prev-address').textContent = userAddress;
        document.getElementById('prev-desc').textContent = description;
        document.getElementById('prev-loc').innerHTML = `<i class="fa-solid fa-map-pin mr-1.5"></i> ${parseFloat(lat).toFixed(4)}, ${parseFloat(long).toFixed(4)}`;

        // I-populate ang Preview Images
        const previewImagesContainer = document.getElementById('prev-images');
        const formImageContainer = document.getElementById('image-preview-container');
        const imgSection = document.getElementById('prev-img-section');
        
        previewImagesContainer.innerHTML = '';
        if (formImageContainer.children.length > 0) {
            imgSection.classList.remove('hidden');
            Array.from(formImageContainer.children).forEach(img => {
                const clone = img.cloneNode(true);
                clone.className = "w-20 h-20 object-cover rounded-lg shadow-sm border border-gray-200 shrink-0";
                previewImagesContainer.appendChild(clone);
            });
        } else {
            imgSection.classList.add('hidden');
        }

        // Ipakita ang modal
        document.getElementById('preview-modal').classList.remove('hidden');

    } catch (error) {
        console.error("Error loading preview:", error);
        msgBox.textContent = "Error loading user details.";
        msgBox.classList.remove('hidden');
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-eye"></i> Review & Submit';
        btn.disabled = false;
    }
};

// ==========================================
// 2. ACTUAL SUBMIT TO FIREBASE (Confirmed)
// ==========================================
window.confirmReportSubmit = async function() {
    if (!window.pendingReportData) return;

    const { currentUserId, currentUserName, userContact, userAddress, description, lat, long, imageFiles } = window.pendingReportData;
    
    const btnConfirm = document.getElementById('btn-confirm-submit');
    const msgBox = document.getElementById('report-msg');

    btnConfirm.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
    btnConfirm.disabled = true;

    try {
        let uploadedImageUrls = [];

        // Upload to Cloudinary
        if (imageFiles.length > 0) {
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

        // Save to Firebase (kasama na contact at address)
        const newReportRef = push(ref(dbRealtime, "reports"));
        await set(newReportRef, {
            userId: currentUserId,
            userName: currentUserName,
            userContact: userContact,
            userAddress: userAddress,
            description: description,
            latitude: parseFloat(lat),
            longitude: parseFloat(long),
            images: uploadedImageUrls,
            status: "Pending", 
            createdAt: serverTimestamp()
        });

        // Close Modal & Reset Form
        document.getElementById('preview-modal').classList.add('hidden');
        
        msgBox.textContent = "Report successfully submitted! Salamat sa tulong.";
        msgBox.className = "p-3 rounded-xl text-sm font-bold text-center bg-green-50 text-green-600 block mt-2";
        msgBox.classList.remove('hidden');
        
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
        
        // Clear pending data
        window.pendingReportData = null;

    } catch (error) {
        console.error(error);
        document.getElementById('preview-modal').classList.add('hidden');
        msgBox.textContent = "Submission failed. Please check your connection.";
        msgBox.className = "p-3 rounded-xl text-sm font-bold text-center bg-red-50 text-red-600 block mt-2";
        msgBox.classList.remove('hidden');
    } finally {
        btnConfirm.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Confirm Submit';
        btnConfirm.disabled = false;
    }
};

window.closePreview = function() {
    document.getElementById('preview-modal').classList.add('hidden');
};
