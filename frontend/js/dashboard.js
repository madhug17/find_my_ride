document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("access_token");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const rideDetails = document.getElementById("rideDetails");

    async function loadDashboard() {
        try {
            // FIXED ENDPOINT: GET /rides/current
            const response = await fetch(`${API_URL}/rides/current`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();
            console.log("Dashboard current ride:", result);

            if (!response.ok) {
                throw new Error(result.detail || "Failed to load current ride");
            }

            if (!rideDetails) return;

            const ride = result.ride;
            if (!ride) {
                rideDetails.innerHTML = `
                    <div class="empty-state">
                        <h3>No Active Ride</h3>
                        <p>You currently don't have an active ride.</p>
                    </div>
                `;
                return;
            }

            const rideId = ride.ride_id ?? ride.id;

            rideDetails.innerHTML = `
                <div class="ride-card active-ride-card">
                    <div class="ride-header">
                        <h3>Current Ride #${rideId ?? "N/A"}</h3>
                        ${typeof statusBadge === 'function' ? statusBadge(ride.status) : `<span>${escapeHtml(ride.status)}</span>`}
                    </div>

                    <p><strong>Pickup:</strong> ${escapeHtml(ride.pickup_loc ?? "N/A")}</p>
                    <p><strong>Destination:</strong> ${escapeHtml(ride.drop_loc ?? "N/A")}</p>

                    ${ride.driver ? `
                        <div class="driver-info-box" style="margin-top: 12px;">
                            <h4>Driver Details</h4>
                            <p><strong>Name:</strong> ${escapeHtml(ride.driver.name ?? "N/A")}</p>
                            <p><strong>Phone:</strong> ${escapeHtml(ride.driver.phone ?? "N/A")}</p>
                            <p><strong>Vehicle Number:</strong> ${escapeHtml(ride.driver.vehicle_number ?? "N/A")}</p>
                            <p><strong>Vehicle Type:</strong> ${escapeHtml(ride.driver.vehicle_type ?? "N/A")}</p>
                        </div>
                    ` : `
                        <p style="margin-top: 10px; color: #f59e0b;">
                            <strong>Driver:</strong> Waiting for driver acceptance...
                        </p>
                    `}
                </div>
            `;

        } catch (error) {
            console.error("Dashboard current ride error:", error);
            if (rideDetails) {
                rideDetails.innerHTML = `
                    <div class="error-message">
                        <p>Unable to load ride details.</p>
                        <small>${escapeHtml(error.message)}</small>
                    </div>
                `;
            }
        }
    }

    function escapeHtml(value) {
        const div = document.createElement("div");
        div.textContent = String(value ?? "");
        return div.innerHTML;
    }

    loadDashboard();
});