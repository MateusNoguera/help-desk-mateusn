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

function handleUnauthorized(response) {
    if (response.status !== 401) {
        return false;
    }

    localStorage.removeItem("token");
    window.location.href = "/login.html";

    return true;
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

        if (handleUnauthorized(response)) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            passwordMessage.textContent = getApiErrorMessage(data, "errorChangePassword");
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

        if (handleUnauthorized(response)) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            nameMessage.textContent = getApiErrorMessage(data, "errorChangeName");
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

function getApiErrorMessage(data, fallbackKey) {
    const errorKeys = {
        NAME_REQUIRED: "errorNameRequired",
        USER_NOT_FOUND: "errorUserNotFound",
        PASSWORDS_REQUIRED: "errorPasswordsRequired",
        PASSWORDS_MUST_DIFFER: "errorPasswordsMustDiffer",
        NEW_PASSWORD_TOO_SHORT: "errorNewPasswordTooShort",
        CURRENT_PASSWORD_INCORRECT: "errorCurrentPasswordIncorrect"
    };

    if (data.code && errorKeys[data.code]) {
        return t(errorKeys[data.code]);
    }

    return t(fallbackKey);
}

async function loadAccount() {
    try {
        const response = await fetch("/auth/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (handleUnauthorized(response)) {
            return;
        }

        if (!response.ok) {
            return;
        }

        const data = await response.json();

        accountName.textContent = data.user.name || t("notProvided");
        accountEmail.textContent = data.user.email;
        accountRole.textContent = translateRole(data.user.role);
    } catch (error) {
        console.error(error);
    }
}

loadAccount();