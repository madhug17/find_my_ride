document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    if (!token || role !== "driver") {
        window.location.href = "driver-login.html";
        return;
    }

    function authHeaders() {
        return {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
    }

    async function apiRequest(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...authHeaders(),
                ...(options.headers || {})
            }
        });

        let data = {};
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_email");
            toast("Session expired. Please login again.", "error");
            setTimeout(() => { window.location.href = "driver-login.html"; }, 1000);
            throw new Error("Unauthorized");
        }

        if (!response.ok) {
            throw new Error(data.detail || data.message || `Request failed (${response.status})`);
        }
        return data;
    }

    let driverMap = null;
    let driverMarker = null;
    let currentDriverLat = 17.5454;
    let currentDriverLng = 78.5718;
    let currentActiveRide = null;
    let gpsSimulatorInterval = null;
    let gpsWatchId = null;

    async function loadDriverProfile() {
        try {
            const driver = await apiRequest(`${API_URL}/driver/me`);

            const nameEl = document.getElementById("driverName");
            const emailEl = document.getElementById("driverEmail");
            const phoneEl = document.getElementById("driverPhone");
            const vehicleEl = document.getElementById("driverVehicle");
            const headerNameEl = document.getElementById("driverHeaderName");
            const toggle = document.getElementById("availabilityToggle");

            if (nameEl) nameEl.textContent = driver.name || "-";
            if (headerNameEl) headerNameEl.textContent = driver.name || "Driver Portal";
            if (emailEl) emailEl.textContent = driver.email || "-";
            if (phoneEl) phoneEl.textContent = driver.phone || "-";
            if (vehicleEl) vehicleEl.textContent = `${driver.vehicle_type || "-"} • ${driver.vehicle_number || "-"}`;

            if (driver.latitude && driver.longitude) {
                currentDriverLat = driver.latitude;
                currentDriverLng = driver.longitude;
                updateDriverMapMarker(currentDriverLat, currentDriverLng);
            }

            if (toggle) {
                toggle.checked = Boolean(driver.is_available);
                updateAvailabilityText(Boolean(driver.is_available));
            }

        } catch (error) {
            console.error("Profile error:", error);
            toast("Failed to load driver profile", "error");
        }
    }

    function updateAvailabilityText(isAvailable) {
        const text = document.getElementById("availabilityText");
        if (!text) return;
        text.textContent = isAvailable ? "Online (Available)" : "Offline (Unavailable)";
        text.style.color = isAvailable ? "#10b981" : "#ef4444";
    }

    async function updateAvailability(isAvailable) {
        try {
            const result = await apiRequest(`${API_URL}/driver/availability`, {
                method: "PUT",
                body: JSON.stringify({ is_available: isAvailable })
            });

            updateAvailabilityText(result.is_available);
            toast(result.message || "Availability status updated", "success");

            await loadAvailableRides();
            await loadCurrentTrip();

        } catch (error) {
            console.error("Availability error:", error);
            toast(error.message, "error");
            const toggle = document.getElementById("availabilityToggle");
            if (toggle) toggle.checked = !isAvailable;
        }
    }

    const availToggle = document.getElementById("availabilityToggle");
    if (availToggle) {
        availToggle.addEventListener("change", (e) => {
            updateAvailability(e.target.checked);
        });
    }

    function locateDriverGPS(silent = false) {
        if (!("geolocation" in navigator)) {
            if (!silent) toast("GPS Geolocation is not supported by browser.", "error");
            return;
        }
        if (!silent) toast("Locating driver physical GPS position...", "info");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentDriverLat = parseFloat(position.coords.latitude.toFixed(6));
                currentDriverLng = parseFloat(position.coords.longitude.toFixed(6));

                if (driverMap) {
                    driverMap.setView([currentDriverLat, currentDriverLng], 15);
                }
                updateDriverMapMarker(currentDriverLat, currentDriverLng);

                if (currentActiveRide) {
                    sendDriverLocationUpdate(currentActiveRide.id || currentActiveRide.ride_id, currentDriverLat, currentDriverLng);
                }
                if (!silent) toast(`Located at driver GPS position: ${currentDriverLat}, ${currentDriverLng}`, "success");
            },
            (error) => {
                console.warn("Driver GPS error:", error);
                if (!silent) toast(`GPS Error: ${error.message}`, "error");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    function startLiveGpsTracking() {
        if (!("geolocation" in navigator)) return;

        if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);

        gpsWatchId = navigator.geolocation.watchPosition(
            (position) => {
                currentDriverLat = parseFloat(position.coords.latitude.toFixed(6));
                currentDriverLng = parseFloat(position.coords.longitude.toFixed(6));
                updateDriverMapMarker(currentDriverLat, currentDriverLng);

                if (currentActiveRide) {
                    sendDriverLocationUpdate(currentActiveRide.id || currentActiveRide.ride_id, currentDriverLat, currentDriverLng);
                }
            },
            (error) => {
                console.warn("Live GPS Watch error:", error);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        );
    }

    function initDriverMap() {
        const mapEl = document.getElementById("driverMap");
        if (!mapEl || typeof L === 'undefined') return;

        driverMap = L.map('driverMap').setView([currentDriverLat, currentDriverLng], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(driverMap);

        updateDriverMapMarker(currentDriverLat, currentDriverLng);

        locateDriverGPS(true);
        startLiveGpsTracking();

        document.getElementById("useGpsBtnDriver")?.addEventListener("click", () => {
            locateDriverGPS(false);
        });

        driverMap.on('click', async (e) => {
            const { lat, lng } = e.latlng;
            currentDriverLat = parseFloat(lat.toFixed(6));
            currentDriverLng = parseFloat(lng.toFixed(6));
            updateDriverMapMarker(currentDriverLat, currentDriverLng);

            if (currentActiveRide) {
                await sendDriverLocationUpdate(currentActiveRide.id || currentActiveRide.ride_id, currentDriverLat, currentDriverLng);
            } else {
                toast(`Driver Location set to ${currentDriverLat}, ${currentDriverLng}`, "info");
            }
        });

        document.getElementById("updateLocationBtn")?.addEventListener("click", () => {
            if (currentActiveRide) {
                sendDriverLocationUpdate(currentActiveRide.id || currentActiveRide.ride_id, currentDriverLat, currentDriverLng);
            } else {
                toast("Location coordinates updated", "info");
            }
        });
    }

    function updateDriverMapMarker(lat, lng) {
        const textEl = document.getElementById("driverCoordText");
        if (textEl) textEl.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        if (!driverMap) return;

        if (driverMarker) {
            driverMarker.setLatLng([lat, lng]);
        } else {
            driverMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'custom-driver-pin',
                    html: '<div style="background:#e3b23c; border-radius:50%; width:24px; height:24px; box-shadow:0 0 16px rgba(227,178,60,0.9); border:2px solid #ffffff;"></div>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            }).addTo(driverMap).bindPopup("<b>My Vehicle Position</b>");
        }
    }

    async function sendDriverLocationUpdate(rideId, lat, lng) {
        if (!rideId) return;
        try {
            await apiRequest(`${API_URL}/driver/location`, {
                method: "PUT",
                body: JSON.stringify({
                    ride_id: Number(rideId),
                    latitude: Number(lat),
                    longitude: Number(lng)
                })
            });
            toast(`Live Location Broadcast: (${lat.toFixed(4)}, ${lng.toFixed(4)})`, "success");
        } catch (error) {
            console.warn("Location update error:", error);
        }
    }

    async function loadCurrentTrip() {
        const container = document.getElementById("driverCurrentRide");
        if (!container) return;

        try {
            const data = await apiRequest(`${API_URL}/driver/rides/current`);
            const ride = data.ride;

            if (!ride) {
                currentActiveRide = null;
                stopGpsSimulator();
                container.innerHTML = `
                    <div class="empty-state">
                        <h3>No Active Trip</h3>
                        <p>Set status to <strong>Online</strong> and accept a ride request below.</p>
                    </div>
                `;
                return;
            }

            currentActiveRide = ride;
            displayDriverCurrentTrip(currentActiveRide);

        } catch (error) {
            console.error("Current trip error:", error);
            container.innerHTML = `
                <div class="empty-state">
                    <p>No active trip found.</p>
                </div>
            `;
        }
    }

    function displayDriverCurrentTrip(ride) {
        const container = document.getElementById("driverCurrentRide");
        if (!container) return;

        const rideId = ride.ride_id || ride.id;

        container.innerHTML = `
            <div class="ride-card active-ride-card">
                <div class="ride-header">
                    <div>
                        <h3>Trip #${rideId}</h3>
                        <small style="color: var(--text-muted);">Assigned Passenger Trip</small>
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

                <div class="button-row" style="margin-top: 18px;">
                    ${ride.status === "ACCEPTED" ? `
                        <button class="btn primary" onclick="startTrip(${rideId})">
                            Start Trip
                        </button>
                    ` : ""}

                    ${ride.status === "STARTED" ? `
                        <button class="btn success" onclick="completeTrip(${rideId})">
                            Complete Trip
                        </button>
                    ` : ""}

                    <button class="btn secondary" id="gpsSimBtn" onclick="toggleGpsSimulator(${rideId})">
                        ${gpsSimulatorInterval ? 'Stop GPS Simulator' : 'Start GPS Simulator'}
                    </button>
                </div>
            </div>
        `;
    }

    window.startTrip = async function(rideId) {
        if (!confirm(`Start Trip #${rideId}?`)) return;
        try {
            await apiRequest(`${API_URL}/driver/rides/${rideId}/start`, { method: "PUT" });
            toast(`Trip #${rideId} Started!`, "success");
            await loadCurrentTrip();
        } catch (error) {
            console.error("Start trip error:", error);
            toast(error.message, "error");
        }
    };

    window.completeTrip = async function(rideId) {
        if (!confirm(`Mark Trip #${rideId} as Completed?`)) return;
        try {
            stopGpsSimulator();
            await apiRequest(`${API_URL}/driver/rides/${rideId}/complete`, { method: "PUT" });
            toast(`Trip #${rideId} Completed successfully! Driver is available now.`, "success");
            await loadDriverProfile();
            await loadCurrentTrip();
            await loadAvailableRides();
        } catch (error) {
            console.error("Complete trip error:", error);
            toast(error.message, "error");
        }
    };

    window.toggleGpsSimulator = function(rideId) {
        if (gpsSimulatorInterval) {
            stopGpsSimulator();
            toast("GPS Simulator Stopped", "info");
        } else {
            startGpsSimulator(rideId);
        }
    };

    function startGpsSimulator(rideId) {
        if (!currentActiveRide) return;
        stopGpsSimulator();

        toast("GPS Route Simulator started! Updating live location...", "success");

        const pLat = currentActiveRide.pickup_lat || 17.5454;
        const pLng = currentActiveRide.pickup_lng || 78.5718;
        const dLat = currentActiveRide.drop_lat || 17.5470;
        const dLng = currentActiveRide.drop_lng || 78.5730;

        let step = 0;
        const totalSteps = 20;

        gpsSimulatorInterval = setInterval(() => {
            step++;
            let nextLat, nextLng;

            if (step <= 10) {
                const ratio = step / 10;
                nextLat = currentDriverLat + (pLat - currentDriverLat) * ratio;
                nextLng = currentDriverLng + (pLng - currentDriverLng) * ratio;
            } else {
                const ratio = (step - 10) / 10;
                nextLat = pLat + (dLat - pLat) * ratio;
                nextLng = pLng + (dLng - pLng) * ratio;
            }

            currentDriverLat = parseFloat(nextLat.toFixed(6));
            currentDriverLng = parseFloat(nextLng.toFixed(6));

            updateDriverMapMarker(currentDriverLat, currentDriverLng);
            sendDriverLocationUpdate(rideId, currentDriverLat, currentDriverLng);

            if (step >= totalSteps) {
                stopGpsSimulator();
                toast("GPS Simulation completed destination route!", "info");
            }
        }, 2500);

        const btn = document.getElementById("gpsSimBtn");
        if (btn) btn.textContent = "Stop GPS Simulator";
    }

    function stopGpsSimulator() {
        if (gpsSimulatorInterval) {
            clearInterval(gpsSimulatorInterval);
            gpsSimulatorInterval = null;
        }
        const btn = document.getElementById("gpsSimBtn");
        if (btn) btn.textContent = "Start GPS Simulator";
    }

    async function loadAvailableRides() {
        const container = document.getElementById("availableRides");
        if (!container) return;

        try {
            const rides = await apiRequest(`${API_URL}/driver/rides/available`);

            if (!Array.isArray(rides) || rides.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No available ride requests right now.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = rides.map(createAvailableRideCard).join("");

        } catch (error) {
            console.error("Available rides error:", error);
            container.innerHTML = `
                <div class="error-message" style="color:#ef4444; padding:15px; text-align:center;">
                    ${escapeHtml(error.message)}
                </div>
            `;
        }
    }

    async function loadNearbyRides() {
        const container = document.getElementById("availableRides");
        if (!container) return;

        const radius = parseFloat(document.getElementById("radiusKm")?.value || "5");

        try {
            const data = await apiRequest(`${API_URL}/driver/rides/nearby?radius_km=${radius}&limit=10`);
            const rides = data.rides || [];

            if (rides.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No rides found within ${radius} km of your driver location.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = rides.map(ride => `
                <div class="ride-card">
                    <div class="ride-header">
                        <div>
                            <h3>Ride #${ride.ride_id}</h3>
                            <small style="color: #60a5fa; font-weight:600;">${ride.distance_km} km away</small>
                        </div>
                        <span class="status-badge badge-pending">PENDING</span>
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

                    <button class="btn primary" style="width: 100%; margin-top: 14px;" onclick="acceptRide(${ride.ride_id})">
                        Accept Ride Request
                    </button>
                </div>
            `).join("");

            toast(`Found ${rides.length} nearby rides within ${radius} km`, "info");

        } catch (error) {
            console.error("Nearby rides error:", error);
            toast(error.message, "error");
        }
    }

    function createAvailableRideCard(ride) {
        const rideId = ride.ride_id ?? ride.id;

        return `
            <div class="ride-card">
                <div class="ride-header">
                    <h3>Ride #${rideId}</h3>
                    <span class="status-badge badge-pending">PENDING</span>
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

                <button class="btn primary" style="width: 100%; margin-top: 14px;" onclick="acceptRide(${rideId})">
                    Accept Ride Request
                </button>
            </div>
        `;
    }

    window.acceptRide = async function (rideId) {
        if (!confirm(`Accept Ride #${rideId}?`)) return;

        try {
            await apiRequest(`${API_URL}/driver/rides/${rideId}/accept`, { method: "PUT" });
            toast(`Ride #${rideId} Accepted! Availability set to busy.`, "success");
            await loadDriverProfile();
            await loadCurrentTrip();
            await loadAvailableRides();
        } catch (error) {
            console.error("Accept ride error:", error);
            toast(error.message, "error");
        }
    };

    document.getElementById("refreshCurrentRideBtn")?.addEventListener("click", () => {
        loadCurrentTrip();
        toast("Current trip refreshed", "info");
    });

    document.getElementById("refreshAvailableBtn")?.addEventListener("click", () => {
        loadAvailableRides();
        toast("Available rides refreshed", "info");
    });

    document.getElementById("findNearbyBtn")?.addEventListener("click", () => {
        loadNearbyRides();
    });

    async function loadDriverHistory() {
        const container = document.getElementById("driverHistory");
        if (!container) return;

        try {
            const data = await apiRequest(`${API_URL}/driver/rides/history`);
            const rides = data.rides || [];

            if (rides.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No completed or cancelled trip history yet.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = rides.map(ride => `
                <div class="ride-card">
                    <div class="ride-header">
                        <div>
                            <h3>Trip #${ride.ride_id}</h3>
                            <small style="color: var(--text-dim);">Passenger: ${escapeHtml(ride.passenger_name)} • ${formatDateTime(ride.created_at)}</small>
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
                </div>
            `).join("");

        } catch (error) {
            console.error("Driver history error:", error);
            container.innerHTML = `
                <div class="error-message" style="color:#ef4444; padding:15px; text-align:center;">
                    ${escapeHtml(error.message)}
                </div>
            `;
        }
    }

    initDriverMap();
    loadDriverProfile();
    loadCurrentTrip();
    loadAvailableRides();
    loadDriverHistory();
});
