document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    const isAuthenticated = !!(token && role === "student");

    const authHeaders = isAuthenticated ? {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    } : {
        "Content-Type": "application/json"
    };

    // Update student email header or show Guest/Explore mode
    const userEmail = localStorage.getItem("user_email");
    const studentUserEmailEl = document.getElementById("studentUserEmail");
    if (studentUserEmailEl) {
        studentUserEmailEl.textContent = isAuthenticated ? (userEmail || "Student Portal") : "Explore Map (Guest)";
    }

    // If guest, adjust navigation button
    const logoutBtn = document.querySelector(".nav-actions button.danger");
    if (logoutBtn && !isAuthenticated) {
        logoutBtn.textContent = "Login";
        logoutBtn.className = "btn success small-button";
        logoutBtn.onclick = () => { window.location.href = "login.html"; };
    }

    // Dynamic Map State
    let bookingMap = null;
    let pickupMarker = null;
    let dropMarker = null;
    let routePolyline = null;
    let activeDriverMarker = null;
    let activeRideMap = null;
    let rideSocket = null;
    let locationPollInterval = null;
    let activeMapMode = 'pickup'; // 'pickup' or 'drop'

    // =========================================================
    // HELPER FUNCTIONS
    // =========================================================
    function getRideId(ride) {
        return ride?.ride_id ?? ride?.id;
    }

    async function parseResponse(response) {
        const text = await response.text();
        let data;
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { detail: text || "Invalid server response" };
        }

        if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_email");
            toast("Session expired. Please login again.", "error");
            setTimeout(() => { window.location.href = "login.html"; }, 1000);
            throw new Error("Unauthorized");
        }

        if (!response.ok) {
            throw new Error(data.detail || data.message || `Request failed (${response.status})`);
        }
        return data;
    }

    // =========================================================
    // CAMPUS PRESETS & LEAFLET BOOKING MAP
    // =========================================================
    function initCampusPresets() {
        const presetsContainer = document.getElementById("campusPresets");
        if (!presetsContainer) return;

        presetsContainer.innerHTML = CAMPUS_LOCATIONS.map((loc, idx) => `
            <button type="button" class="landmark-chip ${idx === 0 ? 'selected' : ''}" data-id="${loc.id}">
                <span>📍</span>
                <span>${loc.name}</span>
                <small style="color: var(--text-muted); font-size: 10px;">(${loc.tag})</small>
            </button>
        `).join("");

        presetsContainer.querySelectorAll(".landmark-chip").forEach(btn => {
            btn.addEventListener("click", () => {
                presetsContainer.querySelectorAll(".landmark-chip").forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                const loc = locationById(btn.dataset.id);
                if (!loc) return;

                if (activeMapMode === 'pickup') {
                    document.getElementById("pickup_loc").value = loc.name;
                    document.getElementById("pickup_lat").value = loc.lat;
                    document.getElementById("pickup_lng").value = loc.lng;
                    updateBookingMapMarker('pickup', loc.lat, loc.lng);
                    toast(`Set Pickup to ${loc.name}`, "info");
                } else {
                    document.getElementById("drop_loc").value = loc.name;
                    document.getElementById("drop_lat").value = loc.lat;
                    document.getElementById("drop_lng").value = loc.lng;
                    updateBookingMapMarker('drop', loc.lat, loc.lng);
                    toast(`Set Drop to ${loc.name}`, "info");
                }
                updateEstimates();
            });
        });
    }

    // =========================================================
    // REAL HTML5 GPS GEOLOCATION FOR STUDENT
    // =========================================================
    function locateUserGPS(silent = false) {
        if (!("geolocation" in navigator)) {
            if (!silent) toast("GPS Geolocation is not supported by your browser.", "error");
            return;
        }
        if (!silent) toast("Locating your physical GPS position...", "info");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = parseFloat(position.coords.latitude.toFixed(6));
                const lng = parseFloat(position.coords.longitude.toFixed(6));

                const pickupLatEl = document.getElementById("pickup_lat");
                const pickupLngEl = document.getElementById("pickup_lng");
                const pickupLocEl = document.getElementById("pickup_loc");

                if (pickupLatEl) pickupLatEl.value = lat;
                if (pickupLngEl) pickupLngEl.value = lng;
                if (pickupLocEl && (!pickupLocEl.value || pickupLocEl.value.includes("Pin") || pickupLocEl.value.includes("GPS"))) {
                    pickupLocEl.value = `Current Location (${lat}, ${lng})`;
                }

                if (bookingMap) {
                    bookingMap.setView([lat, lng], 15);
                    updateBookingMapMarker('pickup', lat, lng);
                }
                updateEstimates();
                if (!silent) toast("Located at your real GPS position!", "success");
            },
            (error) => {
                console.warn("GPS Geolocation error:", error);
                if (!silent) toast(`GPS Error: ${error.message}`, "error");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    function initBookingMap() {
        const mapEl = document.getElementById("bookingMap");
        if (!mapEl || typeof L === 'undefined') return;

        const defaultLat = 17.5454;
        const defaultLng = 78.5718;

        bookingMap = L.map('bookingMap').setView([defaultLat, defaultLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(bookingMap);

        // Initial markers from inputs
        const pLat = parseFloat(document.getElementById("pickup_lat")?.value) || defaultLat;
        const pLng = parseFloat(document.getElementById("pickup_lng")?.value) || defaultLng;
        const dLat = parseFloat(document.getElementById("drop_lat")?.value) || 17.5470;
        const dLng = parseFloat(document.getElementById("drop_lng")?.value) || 78.5730;

        updateBookingMapMarker('pickup', pLat, pLng);
        updateBookingMapMarker('drop', dLat, dLng);
        updateEstimates();

        // Auto-locate GPS on init
        locateUserGPS(true);

        // Wire Use GPS Button
        document.getElementById("useGpsBtn")?.addEventListener("click", () => {
            locateUserGPS(false);
        });

        // Map Click Event
        bookingMap.on('click', (e) => {
            const { lat, lng } = e.latlng;
            const roundedLat = parseFloat(lat.toFixed(6));
            const roundedLng = parseFloat(lng.toFixed(6));

            if (activeMapMode === 'pickup') {
                document.getElementById("pickup_lat").value = roundedLat;
                document.getElementById("pickup_lng").value = roundedLng;
                if (!document.getElementById("pickup_loc").value) {
                    document.getElementById("pickup_loc").value = `Pin (${roundedLat}, ${roundedLng})`;
                }
                updateBookingMapMarker('pickup', roundedLat, roundedLng);
            } else {
                document.getElementById("drop_lat").value = roundedLat;
                document.getElementById("drop_lng").value = roundedLng;
                if (!document.getElementById("drop_loc").value) {
                    document.getElementById("drop_loc").value = `Pin (${roundedLat}, ${roundedLng})`;
                }
                updateBookingMapMarker('drop', roundedLat, roundedLng);
            }
            updateEstimates();
        });

        // Toggle Map Mode Button
        const toggleBtn = document.getElementById("toggleMapModeBtn");
        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                activeMapMode = activeMapMode === 'pickup' ? 'drop' : 'pickup';
                document.getElementById("mapModeIndicator").textContent = 
                    activeMapMode === 'pickup' ? 'Pickup Pin' : 'Drop Pin';
                toggleBtn.textContent = 
                    activeMapMode === 'pickup' ? 'Switch to Drop Pin' : 'Switch to Pickup Pin';
            });
        }

        // Live input change listeners
        ['pickup_lat', 'pickup_lng', 'drop_lat', 'drop_lng'].forEach(id => {
            document.getElementById(id)?.addEventListener("input", () => {
                const pL1 = parseFloat(document.getElementById("pickup_lat").value);
                const pL2 = parseFloat(document.getElementById("pickup_lng").value);
                const dL1 = parseFloat(document.getElementById("drop_lat").value);
                const dL2 = parseFloat(document.getElementById("drop_lng").value);
                if (pL1 && pL2) updateBookingMapMarker('pickup', pL1, pL2);
                if (dL1 && dL2) updateBookingMapMarker('drop', dL1, dL2);
                updateEstimates();
            });
        });
    }

    function updateBookingMapMarker(type, lat, lng) {
        if (!bookingMap) return;

        if (type === 'pickup') {
            if (pickupMarker) bookingMap.removeLayer(pickupMarker);
            pickupMarker = L.marker([lat, lng], {
                title: "Pickup Location",
                icon: L.divIcon({
                    className: 'custom-map-pin',
                    html: '<div style="background:#6f9a72; border:2px solid #ffffff; border-radius:50%; width:20px; height:20px; box-shadow:0 0 10px rgba(111,154,114,0.8);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(bookingMap).bindPopup("<b>Pickup Location</b>");
        } else {
            if (dropMarker) bookingMap.removeLayer(dropMarker);
            dropMarker = L.marker([lat, lng], {
                title: "Drop Location",
                icon: L.divIcon({
                    className: 'custom-map-pin',
                    html: '<div style="background:#ef4444; border:2px solid #ffffff; border-radius:4px; width:20px; height:20px; box-shadow:0 0 10px rgba(239,68,68,0.8);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(bookingMap).bindPopup("<b>Drop Location</b>");
        }

        // Draw Polyline route line & fit bounds
        if (pickupMarker && dropMarker) {
            const pLatLng = pickupMarker.getLatLng();
            const dLatLng = dropMarker.getLatLng();
            if (routePolyline) bookingMap.removeLayer(routePolyline);
            routePolyline = L.polyline([pLatLng, dLatLng], {
                color: '#e3b23c',
                weight: 5,
                dashArray: '6, 8',
                opacity: 0.95
            }).addTo(bookingMap);
        }
    }

    function updateEstimates() {
        const pLat = parseFloat(document.getElementById("pickup_lat")?.value);
        const pLng = parseFloat(document.getElementById("pickup_lng")?.value);
        const dLat = parseFloat(document.getElementById("drop_lat")?.value);
        const dLng = parseFloat(document.getElementById("drop_lng")?.value);

        if (pLat && pLng && dLat && dLng) {
            const dist = haversineDistance(pLat, pLng, dLat, dLng);
            const fare = calculateEstimatedFare(dist);

            const distEl = document.getElementById("estDistance");
            const fareEl = document.getElementById("estFare");

            if (distEl) distEl.textContent = `${dist.toFixed(2)} km`;
            if (fareEl) fareEl.textContent = `₹${fare}`;
        }
    }

    // =========================================================
    // BOOK RIDE FORM SUBMIT
    // =========================================================
    const rideForm = document.getElementById("rideForm");
    if (rideForm) {
        rideForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const pickupLoc = document.getElementById("pickup_loc")?.value.trim();
            const dropLoc = document.getElementById("drop_loc")?.value.trim();
            const pickupLat = parseFloat(document.getElementById("pickup_lat")?.value);
            const pickupLng = parseFloat(document.getElementById("pickup_lng")?.value);
            const dropLat = parseFloat(document.getElementById("drop_lat")?.value);
            const dropLng = parseFloat(document.getElementById("drop_lng")?.value);
            const message = document.getElementById("rideMessage");

            if (message) message.textContent = "Booking ride...";

            if (!pickupLoc || !dropLoc || isNaN(pickupLat) || isNaN(pickupLng) || isNaN(dropLat) || isNaN(dropLng)) {
                if (message) message.textContent = "Please fill valid locations and coordinates.";
                toast("Invalid locations or coordinates.", "error");
                return;
            }

            try {
                // FIXED ENDPOINT: POST /rides/
                const response = await fetch(`${API_URL}/rides/`, {
                    method: "POST",
                    headers: authHeaders,
                    body: JSON.stringify({
                        pickup_loc: pickupLoc,
                        drop_loc: dropLoc,
                        pickup_lat: pickupLat,
                        pickup_lng: pickupLng,
                        drop_lat: dropLat,
                        drop_lng: dropLng
                    })
                });

                const result = await parseResponse(response);
                if (message) message.textContent = `Ride requested! Ride #${result.ride_id}`;
                toast(`Ride #${result.ride_id} requested successfully!`, "success");

                await loadCurrentRide();
                await loadRideHistory();

            } catch (error) {
                console.error("Ride booking error:", error);
                if (message) message.textContent = error.message;
                toast(error.message, "error");
            }
        });
    }

    // =========================================================
    // CURRENT RIDE & LIVE TRACKING
    // =========================================================
    async function loadCurrentRide() {
        const container = document.getElementById("currentRide");
        if (!container) return;

        try {
            // FIXED ENDPOINT: GET /rides/current
            const response = await fetch(`${API_URL}/rides/current`, {
                method: "GET",
                headers: authHeaders
            });

            const result = await parseResponse(response);
            const ride = result.ride;

            if (!ride) {
                if (locationPollInterval) {
                    clearInterval(locationPollInterval);
                    locationPollInterval = null;
                }
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No Active Ride</h3>
                        <p>You don't have an active ride request right now.</p>
                    </div>
                `;
                return;
            }

            displayCurrentRide(ride);

        } catch (error) {
            console.error("Current ride error:", error);
            container.innerHTML = `
                <div class="error-message" style="text-align:center; color:#ef4444; padding:20px;">
                    <p>Unable to load current ride.</p>
                    <small>${escapeHtml(error.message)}</small>
                </div>
            `;
        }
    }

    function displayCurrentRide(ride) {
        const container = document.getElementById("currentRide");
        if (!container) return;

        const rideId = getRideId(ride);

        const currentRenderedId = container.dataset.renderedRideId;
        const otpCode = String((Number(rideId) * 1337 + 421) % 9000 + 1000);
        const captainName = ride.driver?.name ? `${escapeHtml(ride.driver.name)} • Student Captain` : "Assigning Peer Captain...";
        const captainRating = "★ 4.9 (142 campus trips)";
        const vehicleReg = ride.driver?.vehicle_number 
            ? `${escapeHtml(ride.driver.vehicle_number)} (${escapeHtml(ride.driver.vehicle_type || 'Electric Shuttle')})`
            : "TS-09-EV-4040 • Campus Electric Shuttle";
        const etaText = ride.status === "STARTED" ? "En Route (On Board)" : "Arriving in ~3 mins (0.4 km away)";

        if (currentRenderedId !== String(rideId)) {
            container.dataset.renderedRideId = String(rideId);
            container.innerHTML = `
                <div class="ride-card active-ride-card">
                    <div class="ride-header">
                        <div>
                            <h3>Ride #${rideId ?? "N/A"}</h3>
                            <small style="color: var(--text-muted);">Woxsen Campus Verified Dispatch</small>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                            <div class="otp-security-box">
                                <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">START OTP</span>
                                <span class="otp-code">${otpCode}</span>
                            </div>
                            <div id="activeRideStatusBadge">
                                ${statusBadge(ride.status)}
                            </div>
                        </div>
                    </div>

                    <!-- Captain & Vehicle Info Grid -->
                    <div class="active-ride-meta-grid">
                        <div class="active-ride-meta-item">
                            <label>Peer Captain</label>
                            <strong>${captainName}</strong>
                            <small style="color: var(--accent-primary); font-weight: 600;">${captainRating}</small>
                        </div>
                        <div class="active-ride-meta-item">
                            <label>Vehicle & Reg</label>
                            <strong>${vehicleReg}</strong>
                            <small style="color: var(--text-muted);">Geofenced Campus Shuttle</small>
                        </div>
                        <div class="active-ride-meta-item">
                            <label>Dynamic ETA</label>
                            <strong>${etaText}</strong>
                            <small style="color: var(--text-muted);">Speed Capped: 20 km/h</small>
                        </div>
                    </div>

                    <div class="route-flow">
                        <div class="route-step">
                            <span class="route-label">Pickup:</span>
                            <div class="route-details">
                                <strong>${escapeHtml(ride.pickup_loc)}</strong>
                            </div>
                        </div>
                        <div class="route-step">
                            <span class="route-label">Destination:</span>
                            <div class="route-details">
                                <strong>${escapeHtml(ride.drop_loc)}</strong>
                            </div>
                        </div>
                    </div>

                    <!-- Driver Live Map Container -->
                    <div id="activeRideMapContainer" style="margin-top: 15px;">
                        <div id="activeRideMap" style="width: 100%; height: 280px; border-radius: var(--radius-sm); background: var(--bg-secondary);"></div>
                    </div>

                    <div style="margin-top: 18px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button type="button" class="share-route-btn" onclick="shareLiveRoute(${rideId})">
                                <span>↗</span>
                                <span>Share Live Route</span>
                            </button>
                            <span id="wsStatusText" style="font-size: 12px; color: var(--text-muted);">
                                Live Telemetry Active
                            </span>
                        </div>
                        ${ride.status === "PENDING" ? `
                            <button type="button" class="btn danger small-button" onclick="cancelRide(${rideId})">
                                Cancel Ride
                            </button>
                        ` : ""}
                    </div>
                </div>
            `;
            initActiveRideMap(ride);
        } else {
            const badgeContainer = document.getElementById("activeRideStatusBadge");
            if (badgeContainer) badgeContainer.innerHTML = statusBadge(ride.status);
        }

        // Connect WebSocket & location polling safely
        if (rideId) {
            connectRideWebSocket(rideId);
            startLocationPolling(rideId, ride.status);
        }
    }

    function initActiveRideMap(ride) {
        setTimeout(() => {
            const mapEl = document.getElementById("activeRideMap");
            if (!mapEl || typeof L === 'undefined') return;

            if (activeRideMap) {
                try { activeRideMap.remove(); } catch {}
                activeRideMap = null;
            }

            const pLat = ride.pickup_lat || 17.5454;
            const pLng = ride.pickup_lng || 78.5718;
            const dLat = ride.drop_lat || 17.5470;
            const dLng = ride.drop_lng || 78.5730;

            activeRideMap = L.map('activeRideMap').setView([pLat, pLng], 14);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors'
            }).addTo(activeRideMap);

            L.marker([pLat, pLng], {
                icon: L.divIcon({
                    className: 'custom-map-pin',
                    html: '<div style="background:#6f9a72; border:2px solid #ffffff; border-radius:50%; width:20px; height:20px; box-shadow:0 0 10px rgba(111,154,114,0.8);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(activeRideMap).bindPopup("<b>Pickup:</b> " + escapeHtml(ride.pickup_loc));

            L.marker([dLat, dLng], {
                icon: L.divIcon({
                    className: 'custom-map-pin',
                    html: '<div style="background:#ef4444; border:2px solid #ffffff; border-radius:4px; width:20px; height:20px; box-shadow:0 0 10px rgba(239,68,68,0.8);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(activeRideMap).bindPopup("<b>Drop:</b> " + escapeHtml(ride.drop_loc));

            const routeLine = L.polyline([[pLat, pLng], [dLat, dLng]], {
                color: '#e3b23c',
                weight: 5,
                dashArray: '6, 8',
                opacity: 0.95
            }).addTo(activeRideMap);

            try { activeRideMap.fitBounds(routeLine.getBounds(), { padding: [40, 40] }); } catch {}

            // Fetch latest driver position if available
            fetchDriverLocation(getRideId(ride));
        }, 100);
    }

    async function fetchDriverLocation(rideId) {
        if (!rideId || !activeRideMap) return;

        try {
            const response = await fetch(`${API_URL}/rides/${rideId}/driver-location`, {
                headers: authHeaders
            });
            if (!response.ok) return;

            const data = await response.json();
            if (data.latitude && data.longitude) {
                updateActiveDriverMarker(data.latitude, data.longitude);
            }
        } catch {
            // Ignore if driver location not set yet
        }
    }

    function updateActiveDriverMarker(lat, lng) {
        if (!activeRideMap) return;

        if (activeDriverMarker) {
            activeDriverMarker.setLatLng([lat, lng]);
        } else {
            activeDriverMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'custom-driver-pin',
                    html: '<div style="background:#e3b23c; border-radius:50%; width:22px; height:22px; box-shadow:0 0 14px rgba(227,178,60,0.9); border:2px solid white;"></div>',
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                })
            }).addTo(activeRideMap).bindPopup("<b>Driver Live Position</b>");
        }
        activeRideMap.panTo([lat, lng]);
    }

    function startLocationPolling(rideId, status) {
        if (locationPollInterval) clearInterval(locationPollInterval);
        if (status === "ACCEPTED" || status === "STARTED") {
            locationPollInterval = setInterval(() => {
                fetchDriverLocation(rideId);
            }, 4000);
        }
    }

    // =========================================================
    // WEBSOCKET FOR REAL-TIME UPDATE (SAFE CONNECTION GUARD)
    // =========================================================
    let activeWsRideId = null;

    function connectRideWebSocket(rideId) {
        if (!rideId) return;

        if (activeWsRideId === rideId && rideSocket && (rideSocket.readyState === WebSocket.OPEN || rideSocket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        closeRideWebSocket();
        activeWsRideId = rideId;

        const wsUrl = getWsUrl(`/rides/ws/${rideId}`);
        console.log(`Connecting WebSocket to ${wsUrl}`);

        try {
            rideSocket = new WebSocket(wsUrl);

            rideSocket.onopen = () => {
                console.log(`WebSocket connected for Ride #${rideId}`);
                const statusText = document.getElementById("wsStatusText");
                if (statusText) statusText.textContent = "Connected to WebSocket updates";
            };

            rideSocket.onmessage = (event) => {
                console.log("WebSocket event payload:", event.data);
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "driver_location" || data.type === "location") {
                        if (data.latitude && data.longitude) {
                            updateActiveDriverMarker(data.latitude, data.longitude);
                        }
                    } else if (data.type === "ride_status") {
                        toast(`Ride Status: ${data.status}`, "info");
                        const badgeContainer = document.getElementById("activeRideStatusBadge");
                        if (badgeContainer) badgeContainer.innerHTML = statusBadge(data.status);
                        if (data.status === "COMPLETED" || data.status === "CANCELLED") {
                            closeRideWebSocket();
                            setTimeout(() => {
                                loadCurrentRide();
                                loadRideHistory();
                            }, 500);
                        }
                    } else if (data.type === "notification") {
                        toast(`${data.title}: ${data.message}`, "info");
                    }
                } catch {
                    // Ignore handshake non-JSON strings
                }
            };

            rideSocket.onerror = (err) => {
                console.warn("WebSocket error:", err);
                const statusText = document.getElementById("wsStatusText");
                if (statusText) statusText.textContent = "WebSocket offline (Polling fallback active)";
            };

            rideSocket.onclose = () => {
                console.log("WebSocket connection closed");
                rideSocket = null;
                activeWsRideId = null;
            };

        } catch (e) {
            console.warn("WebSocket init error:", e);
        }
    }

    function closeRideWebSocket() {
        if (rideSocket) {
            try { rideSocket.close(); } catch {}
            rideSocket = null;
        }
        activeWsRideId = null;
    }

    // =========================================================
    // CANCEL RIDE
    // =========================================================
    window.cancelRide = async function (rideId) {
        if (!rideId || !confirm("Are you sure you want to cancel this ride request?")) return;

        try {
            const response = await fetch(`${API_URL}/rides/${rideId}/cancel`, {
                method: "PUT",
                headers: authHeaders
            });

            const result = await parseResponse(response);
            toast(result.message || "Ride cancelled successfully.", "success");
            await loadCurrentRide();
            await loadRideHistory();
        } catch (error) {
            console.error("Cancel ride error:", error);
            toast(error.message, "error");
        }
    };

    // =========================================================
    // RIDE HISTORY & SEARCH
    // =========================================================
    async function loadRideHistory(status = null, pickup = null) {
        const container = document.getElementById("rideHistory");
        if (!container) return;

        try {
            const params = new URLSearchParams();
            if (status) params.append("status", status);
            if (pickup) params.append("pickup", pickup);

            const endpoint = pickup
                ? `${API_URL}/rides/search?${params.toString()}`
                : `${API_URL}/rides/history?${params.toString()}`;

            const response = await fetch(endpoint, {
                method: "GET",
                headers: authHeaders
            });

            const result = await parseResponse(response);
            const rides = Array.isArray(result) ? result : (result.rides || []);

            if (rides.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No ride history found.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = rides.map(createHistoryRideCard).join("");

        } catch (error) {
            console.error("Ride history error:", error);
            container.innerHTML = `
                <div class="error-message" style="color:#ef4444; padding:15px; text-align:center;">
                    ${escapeHtml(error.message)}
                </div>
            `;
        }
    }

    function createHistoryRideCard(ride) {
        const rideId = getRideId(ride);
        const dateStr = formatDateTime(ride.created_at);

        return `
            <div class="ride-card">
                <div class="ride-header">
                    <div>
                        <h3>Ride #${rideId ?? "N/A"}</h3>
                        <small style="color: var(--text-dim);">${dateStr}</small>
                    </div>
                    <div>
                        ${statusBadge(ride.status)}
                    </div>
                </div>

                <div class="route-flow">
                    <div class="route-step">
                        <span class="route-label">Pickup:</span>
                        <div class="route-details">
                            <strong>${escapeHtml(ride.pickup_loc)}</strong>
                        </div>
                    </div>
                    <div class="route-step">
                        <span class="route-label">Destination:</span>
                        <div class="route-details">
                            <strong>${escapeHtml(ride.drop_loc)}</strong>
                        </div>
                    </div>
                </div>

                ${ride.status === "COMPLETED" ? `
                    <div style="margin-top: 12px; text-align: right;">
                        <button type="button" class="btn small-button" onclick="openRatingModal(${rideId})">
                            Rate Driver
                        </button>
                    </div>
                ` : ""}
            </div>
        `;
    }

    // Wire search & refresh buttons
    document.getElementById("searchHistoryBtn")?.addEventListener("click", () => {
        const status = document.getElementById("historyStatus")?.value;
        const pickup = document.getElementById("historyPickup")?.value.trim();
        loadRideHistory(status || null, pickup || null);
    });

    document.getElementById("refreshHistoryBtn")?.addEventListener("click", () => {
        loadRideHistory();
        toast("History refreshed", "info");
    });

    document.getElementById("refreshCurrentBtn")?.addEventListener("click", () => {
        loadCurrentRide();
        toast("Status refreshed", "info");
    });

    // =========================================================
    // RATING MODAL & SUBMISSION
    // =========================================================
    window.openRatingModal = function(rideId) {
        const modal = document.getElementById("ratingModal");
        if (!modal) return;
        document.getElementById("modalRideId").textContent = rideId;
        document.getElementById("modalRatingRideId").value = rideId;
        modal.showModal();
    };

    // Star widget interactive handler
    const starWidget = document.getElementById("modalStarWidget");
    if (starWidget) {
        const stars = starWidget.querySelectorAll("span");
        stars.forEach(star => {
            star.addEventListener("click", () => {
                const val = parseInt(star.dataset.val);
                document.getElementById("modalRatingValue").value = val;
                stars.forEach(s => {
                    const sVal = parseInt(s.dataset.val);
                    if (sVal <= val) s.classList.add("active");
                    else s.classList.remove("active");
                });
            });
        });
    }

    const modalRatingForm = document.getElementById("modalRatingForm");
    if (modalRatingForm) {
        modalRatingForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const rideId = document.getElementById("modalRatingRideId").value;
            const rating = parseInt(document.getElementById("modalRatingValue").value);
            const comment = document.getElementById("modalRatingComment").value.trim();

            try {
                const response = await fetch(`${API_URL}/rides/${rideId}/rate`, {
                    method: "POST",
                    headers: authHeaders,
                    body: JSON.stringify({ rating, comment })
                });

                const result = await parseResponse(response);
                toast(result.message || "Rating submitted successfully!", "success");
                document.getElementById("ratingModal").close();
                await loadRideHistory();
            } catch (error) {
                console.error("Rating error:", error);
                toast(error.message, "error");
            }
        });
    }

    // Share Live Route helper
    window.shareLiveRoute = function(rideId) {
        const trackingUrl = `${window.location.origin}/student.html?ride=${rideId}`;
        const shareText = `Track my campus ride live on Find My Ride (Woxsen University): ${trackingUrl}`;
        if (navigator.share) {
            navigator.share({
                title: 'Find My Ride - Live Woxsen Route',
                text: shareText,
                url: trackingUrl
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareText).then(() => {
                toast("Live tracking link copied to clipboard!", "success");
            }).catch(() => {
                toast("Route tracking URL: " + trackingUrl, "info");
            });
        }
    };

    // Emergency SOS Location Broadcast helper
    window.broadcastSosLocation = function() {
        if (!navigator.geolocation) {
            toast("GPS not available. Dialing Main Gate Security (+91 40 4040 4040)...", "error");
            window.location.href = "tel:+914040404040";
            return;
        }
        toast("Acquiring high-accuracy campus GPS coordinates...", "info");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude.toFixed(6);
                const lng = pos.coords.longitude.toFixed(6);
                const user = localStorage.getItem("user_email") || "hanuman@woxsen.edu.in";
                const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
                const sosMessage = `🚨 URGENT CAMPUS SOS — Woxsen University: Student ${user} triggered an emergency alert at Lat: ${lat}, Lng: ${lng}. Live Location: ${mapsUrl}`;

                // Copy to clipboard
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(sosMessage);
                }
                toast("GPS Location & SOS Alert generated! Opening dispatch...", "success");

                // WhatsApp dispatch link to campus security desk
                const waUrl = `https://wa.me/914040404040?text=${encodeURIComponent(sosMessage)}`;
                window.open(waUrl, '_blank');
            },
            (err) => {
                toast("GPS timed out. Calling Woxsen Security Hotline directly...", "error");
                window.location.href = "tel:+914040404040";
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // Expose helpers
    window.loadCurrentRide = loadCurrentRide;
    window.loadRideHistory = loadRideHistory;

    // INITIALIZATION
    initCampusPresets();
    initBookingMap();
    loadCurrentRide();
    loadRideHistory();
});