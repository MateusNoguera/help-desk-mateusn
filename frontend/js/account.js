const token = localStorage.getItem("token");
const passwordForm = document.getElementById("passwordForm");
const passwordMessage = document.getElementById("passwordMessage");

const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const accountRole = document.getElementById("accountRole");

const nameForm = document.getElementById("nameForm");
const nameMessage = document.getElementById("nameMessage");

const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

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

        passwordMessage.textContent = t("passwordChangedSuccess");
        passwordForm.reset();
    } catch (error) {
        console.error(error);
        passwordMessage.textContent = t("errorChangePassword");
    }
});

nameForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("newName").value;

    try {
        const response = await fetch("/users/me/name", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name
            })
        });

        const data = await response.json();

        if (!response.ok) {
            nameMessage.textContent = data.message;
            return;
        }

        accountName.textContent = data.user.name;
        nameMessage.textContent = t("nameChangedSuccess");
        nameForm.reset();
    } catch (error) {
        console.error(error);
        nameMessage.textContent = t("errorChangeName");
    }
});

function translateRole(role) {
    const roleKeys = {
        EMPLOYEE: "roleEmployee",
        SUPPORT: "roleSupport",
        ADMIN: "roleAdmin"
    };

    return t(roleKeys[role]) || role;
}

document.addEventListener("languageChanged", () => {
    loadAccount();
});

async function loadAccount() {
    try {
        const response = await fetch("/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            localStorage.removeItem("token");
            window.location.href = "/login.html";
            return;
        }

        const data = await response.json();

        accountName.textContent = data.user.name || "Não informado";
        accountEmail.textContent = data.user.email;
        accountRole.textContent = translateRole(data.user.role);
    } catch (error) {
        console.error(error);
    }
}

loadAccount();