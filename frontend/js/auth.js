document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // STUDENT LOGIN
    // =========================

    const studentLoginForm =
        document.getElementById("studentLoginForm");

    if (studentLoginForm) {

        studentLoginForm.addEventListener("submit", async (e) => {

            e.preventDefault();

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;

            const message =
                document.getElementById("message");

            message.textContent = "Logging in...";

            try {

                const response = await fetch(
                    `${API_URL}/auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        },

                        body: new URLSearchParams({
                            username: email,
                            password: password
                        })
                    }
                );

                const result = await response.json();

                console.log("Login response:", result);

                if (!response.ok) {
                    throw new Error(
                        result.detail || "Login failed"
                    );
                }

                localStorage.setItem(
                    "access_token",
                    result.access_token
                );

                localStorage.setItem(
                    "user_email",
                    email
                );

                message.textContent =
                    "Login successful!";

                window.location.href = "student.html";

            } catch (error) {

                console.error(error);

                message.textContent =
                    error.message;
            }
        });
    }


    // =========================
    // STUDENT REGISTER
    // =========================

    const studentRegisterForm =
        document.getElementById("studentRegisterForm");

    if (studentRegisterForm) {

        studentRegisterForm.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();

                const name =
                    document.getElementById("name").value.trim();

                const email =
                    document.getElementById("email").value.trim();

                const phone =
                    document.getElementById("phone").value.trim();

                const password =
                    document.getElementById("password").value;

                const message =
                    document.getElementById("message");

                message.textContent =
                    "Registering...";

                try {

                    const response = await fetch(
                        `${API_URL}/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name,
                                email,
                                phone,
                                password
                            })
                        }
                    );

                    const result =
                        await response.json();

                    console.log(
                        "Register response:",
                        result
                    );

                    if (!response.ok) {
                        throw new Error(
                            result.detail ||
                            "Registration failed"
                        );
                    }

                    message.textContent =
                        "Registration successful!";

                    setTimeout(() => {
                        window.location.href =
                            "login.html";
                    }, 1000);

                } catch (error) {

                    console.error(error);

                    message.textContent =
                        error.message;
                }
            }
        );
    }

});