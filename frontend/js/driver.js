// ==========================================
// DRIVER API ENDPOINTS
// ==========================================

const DRIVER_REGISTER_URL =
    `${API_URL}/driver/register`;

const DRIVER_LOGIN_URL =
    `${API_URL}/driver/login`;


// ==========================================
// DRIVER LOGIN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    const loginForm =
        document.getElementById(
            "driverLoginForm"
        );

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();

                const email =
                    document.getElementById(
                        "driverEmail"
                    ).value.trim();

                const password =
                    document.getElementById(
                        "driverPassword"
                    ).value;

                const message =
                    document.getElementById(
                        "driverMessage"
                    );

                message.textContent =
                    "Logging in...";


                try {

                    const response =
                        await fetch(
                            DRIVER_LOGIN_URL,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/x-www-form-urlencoded"
                                },

                                body:
                                    new URLSearchParams({
                                        username: email,
                                        password: password
                                    })
                            }
                        );


                    const result =
                        await response.json();


                    console.log(
                        "Driver login:",
                        result
                    );


                    if (!response.ok) {

                        throw new Error(
                            result.detail ||
                            "Driver login failed"
                        );
                    }


                    localStorage.setItem(
                        "driver_token",
                        result.access_token
                    );


                    localStorage.setItem(
                        "driver_email",
                        email
                    );


                    message.textContent =
                        "Login successful!";


                    window.location.href =
                        "driver.html";


                } catch (error) {

                    console.error(error);

                    message.textContent =
                        error.message;
                }
            }
        );
    }


    // ==========================================
    // DRIVER REGISTER
    // ==========================================

    const registerForm =
        document.getElementById(
            "driverRegisterForm"
        );


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();


                const data = {

                    name:
                        document.getElementById(
                            "driverName"
                        ).value.trim(),

                    email:
                        document.getElementById(
                            "driverEmail"
                        ).value.trim(),

                    phone:
                        document.getElementById(
                            "driverPhone"
                        ).value.trim(),

                    password:
                        document.getElementById(
                            "driverPassword"
                        ).value,

                    vehicle_number:
                        document.getElementById(
                            "vehicleNumber"
                        ).value.trim(),

                    vehicle_type:
                        document.getElementById(
                            "vehicleType"
                        ).value.trim()
                };


                const message =
                    document.getElementById(
                        "driverMessage"
                    );


                message.textContent =
                    "Registering driver...";


                try {

                    const response =
                        await fetch(
                            DRIVER_REGISTER_URL,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify(data)
                            }
                        );


                    const result =
                        await response.json();


                    console.log(
                        "Driver register:",
                        result
                    );


                    if (!response.ok) {

                        throw new Error(
                            result.detail ||
                            "Driver registration failed"
                        );
                    }


                    message.textContent =
                        "Driver registered successfully!";


                    setTimeout(() => {

                        window.location.href =
                            "driver-login.html";

                    }, 1000);


                } catch (error) {

                    console.error(error);

                    message.textContent =
                        error.message;
                }
            }
        );
    }


    // ==========================================
    // DRIVER DASHBOARD
    // ==========================================

    const driverStatus =
        document.getElementById(
            "driverStatus"
        );


    if (driverStatus) {

        const token =
            localStorage.getItem(
                "driver_token"
            );


        if (!token) {

            window.location.href =
                "driver-login.html";

            return;
        }


        driverStatus.textContent =
            "✅ Driver logged in successfully.";


        // ==============================
        // LOGOUT
        // ==============================

        const logoutBtn =
            document.getElementById(
                "driverLogoutBtn"
            );


        logoutBtn.addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    "driver_token"
                );

                localStorage.removeItem(
                    "driver_email"
                );

                window.location.href =
                    "driver-login.html";
            }
        );


        // ==============================
        // AVAILABLE
        // ==============================

        const availableBtn =
            document.getElementById(
                "availableBtn"
            );


        availableBtn.addEventListener(
            "click",
            async () => {

                document.getElementById(
                    "availabilityMessage"
                ).textContent =
                    "Driver marked as available.";

                // Connect your backend availability
                // endpoint here if required.
            }
        );


        // ==============================
        // NOT AVAILABLE
        // ==============================

        const unavailableBtn =
            document.getElementById(
                "unavailableBtn"
            );


        unavailableBtn.addEventListener(
            "click",
            async () => {

                document.getElementById(
                    "availabilityMessage"
                ).textContent =
                    "Driver marked as unavailable.";

                // Connect your backend availability
                // endpoint here if required.
            }
        );
    }

});