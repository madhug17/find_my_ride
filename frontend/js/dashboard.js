const API_URL = "http://localhost:8000";

(() => {
  const student = requireStudent();
  if (!student) return;

  const rideForm = document.getElementById("rideForm");
  if (!rideForm) return;

  rideForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Fetched inside the listener to ensure the token is always fresh
    const token = localStorage.getItem("token");
    const rideMessage = document.getElementById("rideMessage");

    const rideData = {
      pickup_loc: document.getElementById("pickup_loc").value.trim(),
      drop_loc: document.getElementById("drop_loc").value.trim(),
      pickup_lat: parseFloat(document.getElementById("pickup_lat").value),
      pickup_lng: parseFloat(document.getElementById("pickup_lng").value),
      drop_lat: parseFloat(document.getElementById("drop_lat").value),
      drop_lng: parseFloat(document.getElementById("drop_lng").value)
    };

    if (
      !rideData.pickup_loc ||
      !rideData.drop_loc ||
      Number.isNaN(rideData.pickup_lat) ||
      Number.isNaN(rideData.pickup_lng) ||
      Number.isNaN(rideData.drop_lat) ||
      Number.isNaN(rideData.drop_lng)
    ) {
      rideMessage.textContent = "Please enter all ride details.";
      return;
    }

    const submitBtn = rideForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Booking...";
    }

    try {
      const response = await fetch(`${API_URL}/rides/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(rideData)
      });

      const result = await response.json();

      if (!response.ok) {
        rideMessage.textContent = result.detail || "Ride booking failed.";
        return;
      }

      rideMessage.textContent = "Ride booked successfully!";

      // Safely injecting text to prevent XSS
      const statusText = typeof STATUS_LABEL !== "undefined"
        ? (STATUS_LABEL[result.status] || result.status)
        : result.status;
      
      const rideId = result.ride_id ?? result.id;

      const detailsContainer = document.getElementById("rideDetails");
      detailsContainer.innerHTML = ""; // Clear existing content
      
      const containerDiv = document.createElement("div");
      containerDiv.className = "ride-item";
      containerDiv.innerHTML = `
        <p><strong>Ride ID:</strong> <span id="r_id"></span></p>
        <p><strong>Status:</strong> <span id="r_status"></span></p>
      `;
      
      detailsContainer.appendChild(containerDiv);
      document.getElementById("r_id").textContent = rideId;
      document.getElementById("r_status").textContent = statusText;

      rideForm.reset();

    } catch (error) {
      console.error("Ride booking error:", error);
      rideMessage.textContent = "Cannot connect to backend.";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Book ride";
      }
    }
  });
})();