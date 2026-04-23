// report.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getDatabase, ref, push, set, onValue, query, orderByChild, equalTo, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-database.js";

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

const cloudName = 'dgoho5phg'; 
const uploadPreset = 'Report'; 

window.allUserReports = {};
window.pendingReportData = null; // Store data before confirmation

// ==========================================
// UTILITY: RENDER IMAGE GRID with +X & LIGHTBOX
// ==========================================
// This function is used to consistently render images in all Modals and Previews.
window.renderImageGrid = function(containerId, imageUrlsArray) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (!imageUrlsArray || imageUrlsArray.length === 0) {
        container.parentElement.classList.add('hidden');
        return;
    }

    container.parentElement.classList.remove('hidden');
    container.className = "flex gap-2 mt-3 overflow-hidden rounded-xl w-full"; 
    
    const maxVisible = 3; 
    const visibleImgs = imageUrlsArray.slice(0, maxVisible);
    const extraCount = imageUrlsArray.length - maxVisible;

    visibleImgs.forEach((src, index) => {
        const isLastVisible = (index === maxVisible - 1);
        const hasExtra = extraCount > 0;

        const div = document.createElement('div');
        div.className = "relative flex-1 h-24 cursor-pointer hover:opacity-90 transition-opacity bg-gray-100 rounded-lg";
        // Click to open lightbox
        div.onclick = () => {
            document.getElementById('lightbox-img').src = src;
            document.getElementById('image-lightbox').classList.remove('hidden');
        };

        const img = document.createElement('img');
        img.src = src;
        img.className = "w-full h-full object-cover rounded-lg shadow-sm border border-gray-200";
        div.appendChild(img);

        if (isLastVisible && hasExtra) {
            const overlay = document.createElement('div');
            overlay.className = "absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center transition-colors hover:bg-black/70";
            const span = document.createElement('span');
            span.className = "text-white font-bold text-xl drop-shadow-md";
            span.textContent = `+${extraCount}`;
            overlay.appendChild(span);
            div.appendChild(overlay);
        }

        container.appendChild(div);
    });
};


window.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let currentUserName = "Citizen";
    let currentUserMobile = "Not provided";
    let currentUserAddress = "Location Not Set";
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUserId = user.uid;
            
            try {
                const docSnap = await getDoc(doc(dbFirestore, "profile", user.uid));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    currentUserName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
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

            // 1. INITIAL FORM SUBMIT (TRIGGERS REVIEW MODAL)
            document.getElementById('report-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                const lat = document.getElementById('report-lat').value;
                const long = document.getElementById('report-long').value;
                const desc = document.getElementById('report-description').value;
                const imageFiles = document.getElementById('report-images').files;
                const msgBox = document.getElementById('report-msg');

                if (!lat || !long) {
                    msgBox.textContent = "Please pin your location first.";
                    msgBox.className = "p-3 rounded-xl text-sm font-bold text-center bg-red-50 text-red-600 block mt-2";
                    msgBox.classList.remove('hidden');
                    return;
                }
                msgBox.classList.add('hidden');

                // Read files into Data URLs for the Preview Modal
                let dataUrls = [];
                let filesProcessed = 0;
                
                if(imageFiles.length > 0) {
                    for(let i=0; i<imageFiles.length; i++) {
                        const reader = new FileReader();
                        reader.onload = function(evt) {
                            dataUrls.push(evt.target.result);
                            filesProcessed++;
                            
                            // Once all files are read, populate the Review Modal
                            if(filesProcessed === imageFiles.length) {
                                window.pendingReportData = { currentUserId, currentUserName, currentUserMobile, currentUserAddress, desc, lat, long, imageFiles };
                                
                                document.getElementById('prev-name').textContent = currentUserName;
                                document.getElementById('prev-number').textContent = currentUserMobile;
                                document.getElementById('prev-address').textContent = currentUserAddress;
                                document.getElementById('prev-desc').textContent = desc;
                                document.getElementById('prev-loc').innerHTML = `<i class="fa-solid fa-map-pin mr-1.5"></i> ${parseFloat(lat).toFixed(4)}, ${parseFloat(long).toFixed(4)}`;
                                
                                window.renderImageGrid('prev-images', dataUrls);
                                document.getElementById('preview-modal').classList.remove('hidden');
                            }
                        }
                        reader.readAsDataURL(imageFiles[i]);
                    }
                } else {
                    window.pendingReportData = { currentUserId, currentUserName, currentUserMobile, currentUserAddress, desc, lat, long, imageFiles: [] };
                    
                    document.getElementById('prev-name').textContent = currentUserName;
                    document.getElementById('prev-number').textContent = currentUserMobile;
                    document.getElementById('prev-address').textContent = currentUserAddress;
                    document.getElementById('prev-desc').textContent = desc;
                    document.getElementById('prev-loc').innerHTML = `<i class="fa-solid fa-map-pin mr-1.5"></i> ${parseFloat(lat).toFixed(4)}, ${parseFloat(long).toFixed(4)}`;
                    
                    window.renderImageGrid('prev-images', []);
                    document.getElementById('preview-modal').classList.remove('hidden');
                }
            });

            // FETCH REALTIME LIST
            const listContainer = document.getElementById('reports-list');
            const reportQuery = query(ref(dbRealtime, "reports"), orderByChild("userId"), equalTo(currentUserId));

            onValue(reportQuery, (snapshot) => {
                window.allUserReports = {}; 
                
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
                    window.allUserReports[rep.id] = rep;
                });
                
                reportsArray.sort((a, b) => b.createdAt - a.createdAt);

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
// DETAILS MODAL (After clicking a submitted report)
// ==========================================
window.viewReportDetails = function(reportId) {
    const rep = window.allUserReports[reportId];
    if(!rep) return;

    const cssStatus = rep.status.replace(/\s+/g, '');
    const statusLabel = document.getElementById('det-status');
    statusLabel.textContent = rep.status;
    statusLabel.className = `text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider status-${cssStatus}`;

    document.getElementById('det-desc').textContent = rep.description;
    document.getElementById('det-loc').innerHTML = `<i class="fa-solid fa-map-pin mr-1.5"></i> ${rep.latitude.toFixed(4)}, ${rep.longitude.toFixed(4)}`;

    // Render using the unified helper
    window.renderImageGrid('det-images', rep.images || []);

    document.getElementById('details-modal').classList.remove('hidden');
};


// ==========================================
// FORM HELPERS
// ==========================================
window.handleImageSelect = function() {
    const input = document.getElementById('report-images');
    let files = Array.from(input.files);
    
    if (files.length > 5) {
        alert("You can only upload up to 5 images.");
        input.value = ''; 
        document.getElementById('image-preview-container').classList.add('hidden');
        return;
    }

    if (files.length > 0) {
        let dataUrls = [];
        let filesProcessed = 0;
        
        for(let i=0; i<files.length; i++) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                dataUrls.push(evt.target.result);
                filesProcessed++;
                
                if(filesProcessed === files.length) {
                    window.renderImageGrid('image-preview-container', dataUrls);
                }
            }
            reader.readAsDataURL(files[i]);
        }
    } else {
        document.getElementById('image-preview-container').classList.add('hidden');
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
// FINAL CONFIRMATION & UPLOAD TO FIREBASE
// ==========================================
window.confirmReportSubmit = async function() {
    if(!window.pendingReportData) return;

    const { currentUserId, currentUserName, currentUserMobile, currentUserAddress, desc, lat, long, imageFiles } = window.pendingReportData;
    
    const btnConfirm = document.getElementById('btn-confirm-submit');
    const msgBox = document.getElementById('report-msg');

    btnConfirm.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
    btnConfirm.disabled = true;

    try {
        let uploadedImageUrls = [];

        // Upload to Cloudinary
        if (imageFiles.length > 0) {
            btnConfirm.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading Photos...';

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

        btnConfirm.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving Report...';

        // Save to Firebase
        const newReportRef = push(ref(dbRealtime, "reports"));
        await set(newReportRef, {
            userId: currentUserId,
            userName: currentUserName,
            userContact: currentUserMobile,        
            userAddress: currentUserAddress,       
            description: desc,
            latitude: parseFloat(lat),
            longitude: parseFloat(long),
            images: uploadedImageUrls, 
            status: "Pending", 
            createdAt: serverTimestamp()
        });

        // Cleanup and Success
        document.getElementById('preview-modal').classList.add('hidden');
        
        msgBox.textContent = "Report successfully submitted! Thank you for your help.";
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

window.handleLogout = () => signOut(auth).then(() => window.location.href = 'index.html');
