const registerForm = document.getElementById("registerForm");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            registerMessage.textContent = data.message;
            return;
        }

        registerMessage.textContent = t("registerSuccess");

        setTimeout(() => {
            window.location.href = "/login.html";
        }, 1000);
    } catch (error) {
        console.error(error);
        registerMessage.textContent = t("errorRegisterUser");
    }
});