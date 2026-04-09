// request.js
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

console.log("Firebase initialized for Request Page!");

// Cloudinary Config
const cloudName = 'dgoho5phg'; 
const uploadPreset = 'ec_connect'; 

// Global Storage
window.allUserRequests = {};
window.pendingRequestData = null;

// ==========================================
// 1. INITIALIZATION & LISTENER
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let currentUserName = "Citizen";
    let currentUserMobile = "Not provided";
    let currentUserAddress = "Location Not Set";
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            
            // Get Profile details for Sidebar & Request Data
            try {
                const docSnap = await getDoc(doc(dbFirestore, "profile", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    currentUserName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
                    
                    // Explicitly targeting 'mobile' field
                    currentUserMobile = data.mobile || data.mobile_number || "Not provided";
                    
                    const addressParts = [data.barangay, data.city, data.province].filter(Boolean);
                    if (addressParts.length > 0) currentUserAddress = addressParts.join(', ');
                    
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

            // Hook up form submission to Trigger Preview
            document.getElementById('request-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const docType = document.getElementById('req-type').value;
                const purpose = document.getElementById('req-purpose').value;
                const idImages = document.getElementById('req-id-images').files;
                const msgBox = document.getElementById('request-msg');

                if (idImages.length === 0) {
                    msgBox.textContent = "Please attach at least 1 Valid ID.";
                    msgBox.className = "p-3 rounded-xl text-sm font-bold text-center bg-red-50 text-red-600 block mt-2";
                    msgBox.classList.remove('hidden');
                    return;
                }
                msgBox.classList.add('hidden');

                // Save pending data
                window.pendingRequestData = {
                    currentUserId, currentUserName, currentUserMobile, currentUserAddress,
                    docType, purpose, idImages
                };

                // Populate Preview Modal
                document.getElementById('prev-name').textContent = currentUserName;
                document.getElementById('prev-number').textContent = currentUserMobile;
                document.getElementById('prev-address').textContent = currentUserAddress;
                document.getElementById('prev-doctype').textContent = docType;
                document.getElementById('prev-purpose').textContent = purpose;

                // Populate Images in Preview
                const previewImagesContainer = document.getElementById('prev-images');
                const formImageContainer = document.getElementById('id-preview-container');
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

                document.getElementById('preview-modal').classList.remove('hidden');
            });

            // Fetch Realtime Requests for the List
            const listContainer = document.getElementById('requests-list');
            const requestQuery = query(ref(dbRealtime, "requests"), orderByChild("userId"), equalTo(currentUserId));

            onValue(requestQuery, (snapshot) => {
                window.allUserRequests = {}; 
                
                if(!snapshot.exists()) {
                    listContainer.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full text-center">
                            <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <i class="fa-solid fa-folder-open text-3xl text-gray-300"></i>
                            </div>
                            <h3 class="text-lg font-bold text-gray-700">No requests yet</h3>
                            <p class="text-gray-400 text-sm mt-1">Documents you request will appear here.</p>
                        </div>`;
                    return;
                }

                let reqArray = [];
                snapshot.forEach(child => { 
                    const req = { id: child.key, ...child.val() };
                    reqArray.push(req); 
                    window.allUserRequests[req.id] = req; 
                });
                
                reqArray.sort((a, b) => b.createdAt - a.createdAt); // Newest first

                listContainer.innerHTML = '';
                reqArray.forEach(req => {
                    const dateObj = new Date(req.createdAt);
                    const readableDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    
                    const cssStatus = req.status.replace(/[^a-zA-Z0-9]/g, '');
                    const statusClass = `status-${cssStatus}`; 

                    listContainer.innerHTML += `
                        <div onclick="window.viewRequestDetails('${req.id}')" class="p-4 rounded-2xl border border-gray-100 bg-gray-50 flex gap-4 hover:bg-white hover:shadow-md transition-all cursor-pointer group">
                            <div class="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0 transition-colors group-hover:bg-brand-primary group-hover:text-white">
                                <i class="fa-solid fa-file-contract text-lg"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-start mb-1">
                                    <h4 class="font-bold text-gray-900 text-sm truncate pr-2 group-hover:text-brand-primary">${req.documentType}</h4>
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass} uppercase tracking-wider shrink-0">${req.status}</span>
                                </div>
                                <p class="text-xs text-gray-500 font-medium mb-1 truncate">Purpose: ${req.purpose}</p>
                                <p class="text-[10px] text-gray-400 font-semibold"><i class="fa-regular fa-clock mr-1"></i> Requested on ${readableDate}</p>
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
// 2. CONFIRM & SUBMIT TO FIREBASE
// ==========================================
window.confirmRequestSubmit = async function() {
    if (!window.pendingRequestData) return;

    const { currentUserId, currentUserName, currentUserMobile, currentUserAddress, docType, purpose, idImages } = window.pendingRequestData;
    
    const btnConfirm = document.getElementById('btn-confirm-submit');
    const msgBox = document.getElementById('request-msg');

    btnConfirm.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
    btnConfirm.disabled = true;

    try {
        let uploadedIdUrls = [];

        // Upload IDs to Cloudinary
        if (idImages.length > 0) {
            btnConfirm.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading ID...';
            for (let i = 0; i < idImages.length; i++) {
                const formData = new FormData();
                formData.append('file', idImages[i]);
                formData.append('upload_preset', uploadPreset);

                const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error("ID upload failed.");
                const imgData = await response.json();
                uploadedIdUrls.push(imgData.secure_url);
            }
        }

        btnConfirm.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving Request...';

        // Save to Firebase Requests Node
        const newReqRef = push(ref(dbRealtime, "requests"));
        await set(newReqRef, {
            userId: currentUserId,
            userName: currentUserName,
            userMobile: currentUserMobile, // Specifically saved
            userAddress: currentUserAddress,
            documentType: docType,
            purpose: purpose,
            attachedIDs: uploadedIdUrls,
            status: "Pending", 
            createdAt: serverTimestamp()
        });

        window.closePreview();
        
        msgBox.textContent = "Document request successfully submitted! Please wait for updates.";
        msgBox.className = "p-3 rounded-xl text-sm font-bold text-center bg-green-50 text-green-600 block mt-2";
        msgBox.classList.remove('hidden');
        
        document.getElementById('request-form').reset();
        document.getElementById('id-preview-container').innerHTML = '';
        document.getElementById('id-preview-container').classList.add('hidden');

        setTimeout(() => { msgBox.classList.add('hidden'); }, 5000);
        window.pendingRequestData = null;

    } catch (error) {
        console.error(error);
        window.closePreview();
        msgBox.textContent = "Submission failed. Please check your connection.";
        msgBox.className = "p-3 rounded-xl text-sm font-bold text-center bg-red-50 text-red-600 block mt-2";
        msgBox.classList.remove('hidden');
    } finally {
        btnConfirm.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Confirm Request';
        btnConfirm.disabled = false;
    }
};

// ==========================================
// 3. VIEW PROGRESS MODAL
// ==========================================
window.viewRequestDetails = function(reqId) {
    const req = window.allUserRequests[reqId];
    if(!req) return;

    const cssStatus = req.status.replace(/[^a-zA-Z0-9]/g, '');
    const statusLabel = document.getElementById('det-status');
    statusLabel.textContent = req.status;
    statusLabel.className = `text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider status-${cssStatus}`;

    document.getElementById('det-doctype').textContent = req.documentType;
    document.getElementById('det-purpose').textContent = req.purpose;

    const imgContainer = document.getElementById('det-images');
    const imgSection = document.getElementById('det-img-section');
    imgContainer.innerHTML = '';
    
    if (req.attachedIDs && req.attachedIDs.length > 0) {
        imgSection.classList.remove('hidden');
        req.attachedIDs.forEach(imgSrc => {
            imgContainer.innerHTML += `<img src="${imgSrc}" class="w-24 h-24 object-cover rounded-lg shadow-sm border border-gray-200 shrink-0">`;
        });
    } else {
        imgSection.classList.add('hidden');
    }

    document.getElementById('details-modal').classList.remove('hidden');
};

// ==========================================
// 4. HELPERS
// ==========================================
window.handleIdSelect = function() {
    const input = document.getElementById('req-id-images');
    const previewContainer = document.getElementById('id-preview-container');
    const files = Array.from(input.files);
    
    previewContainer.innerHTML = ''; 
    
    if (files.length > 2) {
        alert("You can only upload up to 2 images for your Valid ID.");
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
                img.className = "w-full h-20 object-cover rounded-lg shadow-sm border border-gray-200";
                previewContainer.appendChild(img);
            }
            reader.readAsDataURL(file);
        });
    } else {
        previewContainer.classList.add('hidden');
    }
};

window.closePreview = function() {
    document.getElementById('preview-modal').classList.add('hidden');
};

window.closeDetails = function() {
    document.getElementById('details-modal').classList.add('hidden');
};

window.handleLogout = () => signOut(auth).then(() => window.location.href = 'index.html');
