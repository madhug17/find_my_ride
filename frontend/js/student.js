document.addEventListener("DOMContentLoaded", () => {

    const token =
        localStorage.getItem("access_token");

    const loginStatus =
        document.getElementById("loginStatus");

    const rideForm =
        document.getElementById("rideForm");

    const rideMessage =
        document.getElementById("rideMessage");

    const rideResult =
        document.getElementById("rideResult");

    const logoutBtn =
        document.getElementById("logoutBtn");


    // =========================
    // CHECK LOGIN
    // =========================

    if (!token) {

        window.location.href =
            "login.html";

        return;
    }


    loginStatus.textContent =
        "You are logged in successfully.";


    // =========================
    // LOGOUT
    // =========================

    logoutBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "user_email"
            );

            window.location.href =
                "login.html";
        }
    );


    // =========================
    // BOOK RIDE
    // =========================

    rideForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            rideMessage.textContent =
                "Booking ride...";

            rideResult.innerHTML = "";


            const rideData = {

                pickup_loc:
                    document.getElementById(
                        "pickup_loc"
                    ).value.trim(),

                drop_loc:
                    document.getElementById(
                        "drop_loc"
                    ).value.trim(),

                pickup_lat:
                    Number(
                        document.getElementById(
                            "pickup_lat"
                        ).value
                    ),

                pickup_lng:
                    Number(
                        document.getElementById(
                            "pickup_lng"
                        ).value
                    ),

                drop_lat:
                    Number(
                        document.getElementById(
                            "drop_lat"
                        ).value
                    ),

                drop_lng:
                    Number(
                        document.getElementById(
                            "drop_lng"
                        ).value
                    )
            };


            try {

                const response =
                    await fetch(
                        `${API_URL}/rides/`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify(
                                    rideData
                                )
                        }
                    );


                const result =
                    await response.json();


                console.log(
                    "Ride response:",
                    result
                );


                if (!response.ok) {

                    if (response.status === 401) {

                        localStorage.removeItem(
                            "access_token"
                        );

                        window.location.href =
                            "login.html";

                        return;
                    }

                    throw new Error(
                        result.detail ||
                        "Ride booking failed"
                    );
                }


                rideMessage.textContent =
                    "✅ Ride booked successfully!";


                rideResult.innerHTML = `

                    <div class="ride-card">

                        <h3>Ride Details</h3>

                        <p>
                            <strong>Ride ID:</strong>
                            ${result.ride_id}
                        </p>

                        <p>
                            <strong>Status:</strong>
                            ${result.status}
                        </p>

                        <p>
                            <strong>Pickup:</strong>
                            ${rideData.pickup_loc}
                        </p>

                        <p>
                            <strong>Drop:</strong>
                            ${rideData.drop_loc}
                        </p>

                    </div>

                `;


                rideForm.reset();


            } catch (error) {

                console.error(
                    "Ride booking error:",
                    error
                );

                rideMessage.textContent =
                    error.message;
            }
        }
    );

});