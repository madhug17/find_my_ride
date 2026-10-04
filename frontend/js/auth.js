// =====================================================
// AUTH.JS — Single Unified Portal (Uber / Rapido Style)
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    let currentRole = "student";

    // Helper for displaying form error/success messages
    function setFormStatus(elId, text, isError = false) {
        const messageEl = document.getElementById(elId);
        if (messageEl) {
            messageEl.textContent = text;
            messageEl.style.color = isError ? "#FF3B30" : "#34C759";
        }
        if (typeof toast === 'function' && text) {
            toast(text, isError ? 'error' : 'success');
        }
    }

    // ----------------------------------------------------
    // UNIFIED PORTAL ROLE SWITCHER
    // ----------------------------------------------------
    window.switchPortalRole = function(role) {
        currentRole = role;

        const segmentedTrack = document.getElementById("segmentedTrack");
        const btnRoleStudent = document.getElementById("btnRoleStudent");
        const btnRoleDriver = document.getElementById("btnRoleDriver");
        const portalTitle = document.getElementById("portalTitle");
        const portalSubtitle = document.getElementById("portalSubtitle");
        const userLabel = document.getElementById("userLabel");
        const passLabel = document.getElementById("passLabel");
        const loginUsername = document.getElementById("loginUsername");
        const submitIcon = document.getElementById("submitIcon");
        const submitBtnText = document.getElementById("submitBtnText");
        const signupLinkText = document.getElementById("signupLinkText");
        const portalMessage = document.getElementById("portalMessage");

        if (portalMessage) portalMessage.textContent = "";

        if (role === "driver") {
            if (segmentedTrack) segmentedTrack.classList.add("driver-active");
            if (btnRoleStudent) btnRoleStudent.classList.remove("active");
            if (btnRoleDriver) btnRoleDriver.classList.add("active");

            if (portalTitle) portalTitle.textContent = "Driver Portal Login";
            if (portalSubtitle) portalSubtitle.textContent = "Go online, accept ride requests & navigate live";
            if (userLabel) userLabel.textContent = "Driver Email / Phone";
            if (passLabel) passLabel.textContent = "PIN / Password";
            if (loginUsername) {
                loginUsername.placeholder = "driver@campus.com";
                loginUsername.type = "text";
            }
            if (submitIcon) submitIcon.textContent = "→";
            if (submitBtnText) submitBtnText.textContent = "Go Live & Login";
            if (signupLinkText) {
                signupLinkText.innerHTML = 'Want to drive? <a href="driver-register.html">Apply / Register as Driver</a>';
            }
        } else {
            if (segmentedTrack) segmentedTrack.classList.remove("driver-active");
            if (btnRoleDriver) btnRoleDriver.classList.remove("active");
            if (btnRoleStudent) btnRoleStudent.classList.add("active");

            if (portalTitle) portalTitle.textContent = "Student Login";
            if (portalSubtitle) portalSubtitle.textContent = "Book campus rides instantly & track live arrivals";
            if (userLabel) userLabel.textContent = "Student Email / ID";
            if (passLabel) passLabel.textContent = "Password";
            if (loginUsername) {
                loginUsername.placeholder = "name@woxsen.edu.in";
                loginUsername.type = "email";
            }
            if (submitIcon) submitIcon.textContent = "→";
            if (submitBtnText) submitBtnText.textContent = "Get Started as Student";
            if (signupLinkText) {
                signupLinkText.innerHTML = 'New Student? <a href="register.html">Create Account</a>';
            }
        }
    };

    // Detect URL parameter for initial role selection (e.g. ?role=driver)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("role") === "driver") {
        switchPortalRole("driver");
    }

    // ----------------------------------------------------
    // UNIFIED REGISTRATION ROLE SWITCHER
    // ----------------------------------------------------
    window.switchRegisterRole = function(role) {
        const regTrack = document.getElementById("regSegmentedTrack");
        const btnStudent = document.getElementById("btnRegStudent");
        const btnDriver = document.getElementById("btnRegDriver");
        const regBadgeText = document.getElementById("regBadgeText");
        const regBadgeDot = document.getElementById("regBadgeDot");
        const regBadgeEl = document.getElementById("regBadgeEl");
        const regTitle = document.getElementById("regTitle");
        const regSubtitle = document.getElementById("regSubtitle");
        const studentForm = document.getElementById("studentRegisterForm");
        const driverForm = document.getElementById("driverRegisterForm");
        const regLoginLink = document.getElementById("regLoginLink");
        const studentMsg = document.getElementById("message");
        const driverMsg = document.getElementById("driverMessage");

        if (studentMsg) studentMsg.textContent = "";
        if (driverMsg) driverMsg.textContent = "";

        if (role === "driver") {
            if (regTrack) regTrack.classList.add("driver-active");
            if (btnStudent) btnStudent.classList.remove("active");
            if (btnDriver) btnDriver.classList.add("active");

            if (regTitle) regTitle.textContent = "Driver Registration";
            if (regSubtitle) regSubtitle.textContent = "Join as a verified campus shuttle / carpool captain";
            if (regBadgeText) regBadgeText.textContent = "Woxsen Captain Network";
            if (regBadgeEl) {
                regBadgeEl.style.background = "rgba(0, 113, 227, 0.1)";
                regBadgeEl.style.borderColor = "rgba(0, 113, 227, 0.25)";
                regBadgeEl.style.color = "#0071E3";
            }
            if (regBadgeDot) {
                regBadgeDot.style.background = "#0071E3";
                regBadgeDot.style.boxShadow = "0 0 10px #0071E3";
            }
            if (studentForm) studentForm.style.display = "none";
            if (driverForm) driverForm.style.display = "flex";
            if (regLoginLink) {
                regLoginLink.innerHTML = 'Already registered as driver? <a href="index.html?role=driver">Driver Login</a>';
            }
        } else {
            if (regTrack) regTrack.classList.remove("driver-active");
            if (btnDriver) btnDriver.classList.remove("active");
            if (btnStudent) btnStudent.classList.add("active");

            if (regTitle) regTitle.textContent = "Student Registration";
            if (regSubtitle) regSubtitle.textContent = "Create an account to start booking campus rides";
            if (regBadgeText) regBadgeText.textContent = "Woxsen Student Network";
            if (regBadgeEl) {
                regBadgeEl.style.background = "rgba(52, 199, 89, 0.1)";
                regBadgeEl.style.borderColor = "rgba(52, 199, 89, 0.25)";
                regBadgeEl.style.color = "#34C759";
            }
            if (regBadgeDot) {
                regBadgeDot.style.background = "#34C759";
                regBadgeDot.style.boxShadow = "0 0 10px #34C759";
            }
            if (studentForm) studentForm.style.display = "flex";
            if (driverForm) driverForm.style.display = "none";
            if (regLoginLink) {
                regLoginLink.innerHTML = 'Already registered as student? <a href="index.html?role=student">Sign In here</a>';
            }
        }
    };

    if (urlParams.get("role") === "driver" && document.getElementById("regSegmentedTrack")) {
        switchRegisterRole("driver");
    }

    // ----------------------------------------------------
    // UNIFIED LOGIN SUBMISSION
    // ----------------------------------------------------
    const unifiedLoginForm = document.getElementById("unifiedLoginForm");
    if (unifiedLoginForm) {
        unifiedLoginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("loginUsername")?.value.trim();
            const password = document.getElementById("loginPassword")?.value;

            if (!username || !password) {
                setFormStatus("portalMessage", "Please enter credentials to continue.", true);
                return;
            }

            setFormStatus("portalMessage", `Logging in as ${currentRole}...`);

            const endpoint = currentRole === "driver" 
                ? `${API_URL}/driver/login` 
                : `${API_URL}/auth/login`;

            const redirectPage = currentRole === "driver" 
                ? "driver.html" 
                : "student.html";

            try {
                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({ username: username, password: password })
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.detail || "Authentication failed");

                localStorage.setItem("access_token", result.access_token);
                localStorage.setItem("user_email", username);
                localStorage.setItem("user_role", currentRole);

                setFormStatus("portalMessage", "Login successful! Launching dashboard...", false);
                setTimeout(() => { window.location.href = redirectPage; }, 600);

            } catch (error) {
                setFormStatus("portalMessage", error.message, true);
            }
        });
    }

    // ----------------------------------------------------
    // STUDENT REGISTRATION (FOR REGISTER.HTML)
    // ----------------------------------------------------
    const studentRegisterForm = document.getElementById("studentRegisterForm");
    if (studentRegisterForm) {
        studentRegisterForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("name")?.value.trim();
            const email = document.getElementById("email")?.value.trim();
            const phone = document.getElementById("phone")?.value.trim();
            const password = document.getElementById("password")?.value;

            if (!name || !email || !phone || !password) {
                setFormStatus("message", "Please fill in all fields.", true);
                return;
            }

            setFormStatus("message", "Registering account...");

            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, phone, password })
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.detail || "Registration failed");

                setFormStatus("message", "Registration successful! Redirecting to login...", false);
                setTimeout(() => { window.location.href = "index.html?role=student"; }, 1000);

            } catch (error) {
                setFormStatus("message", error.message, true);
            }
        });
    }

    // ----------------------------------------------------
    // DRIVER REGISTRATION (FOR DRIVER-REGISTER.HTML)
    // ----------------------------------------------------
    const driverRegisterForm = document.getElementById("driverRegisterForm");
    if (driverRegisterForm) {
        driverRegisterForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("driverName")?.value.trim();
            const email = document.getElementById("driverEmail")?.value.trim();
            const phone = document.getElementById("driverPhone")?.value.trim();
            const password = document.getElementById("driverPassword")?.value;
            const vehicleNumber = document.getElementById("vehicleNumber")?.value.trim();
            const vehicleType = document.getElementById("vehicleType")?.value;

            if (!name || !email || !phone || !password || !vehicleNumber || !vehicleType) {
                setFormStatus("driverMessage", "Please fill in all vehicle & profile fields.", true);
                return;
            }

            setFormStatus("driverMessage", "Registering driver account...");

            try {
                const response = await fetch(`${API_URL}/driver/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name,
                        email,
                        phone,
                        password,
                        vehicle_number: vehicleNumber,
                        vehicle_type: vehicleType
                    })
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.detail || "Driver registration failed");

                setFormStatus("driverMessage", "Driver registered successfully! Redirecting to login...", false);
                setTimeout(() => { window.location.href = "index.html?role=driver"; }, 1000);

            } catch (error) {
                setFormStatus("driverMessage", error.message, true);
            }
        });
    }
});