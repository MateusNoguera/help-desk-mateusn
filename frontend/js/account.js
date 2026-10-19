const token = localStorage.getItem("token");
const passwordForm = document.getElementById("passwordForm");
const passwordMessage = document.getElementById("passwordMessage");

if (!token) {
    window.location.href = "/login.html";
}

passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;

    try {
        const response = await fetch("/users/me/password", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            passwordMessage.textContent = data.message;
            return;
        }

        passwordMessage.textContent = "Senha alterada com sucesso!";
        passwordForm.reset();
    } catch (error) {
        console.error(error);
        passwordMessage.textContent = "Erro ao alterar senha!";
    }
});