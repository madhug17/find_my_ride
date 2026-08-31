const API_URL = "http://localhost:30080";


document
    .getElementById("loginForm")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const message = document.getElementById("message");

        try {

            const formData = new URLSearchParams();

            formData.append("username", email);
            formData.append("password", password);

            const response = await fetch(
                `${API_URL}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded"
                    },

                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {

                message.textContent =
                    data.detail || "Login failed";

                return;
            }

            localStorage.setItem(
                "access_token",
                data.access_token
            );

            message.textContent = "Login successful!";

            window.location.href = "student.html";

        } catch (error) {

            console.error(error);

            message.textContent =
                "Unable to connect to backend.";

        }

    });