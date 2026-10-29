const token = localStorage.getItem("token");
const usersList = document.getElementById("usersList");
let currentUser = null;

const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

async function loadUsers() {
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch("/users", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login.html";
            return;
        }

        if (response.status === 403) {
            usersList.textContent = t("noPermissionUsers");
            return;
        }

        const users = await response.json();

        usersList.innerHTML = "";

        users.forEach((user) => {
            const userElement = document.createElement("div");
            userElement.classList.add("user-card");

            userElement.innerHTML = `
                <div class="user-card-header">
                    <h2>${user.name}</h2>
                    <span class="user-status">${user.active ? t("active") : t("inactive")}</span>
                </div>

                <p class="user-email">${user.email}</p>

                <div class="user-details">
                    <p><strong>${t("role")}:</strong> <span class="user-role">${translateRole(user.role)}</span></p>
                </div>

                <div class="user-actions"></div>
            `;

            const userActions = userElement.querySelector(".user-actions");

            const editButton = document.createElement("button");
            editButton.textContent = t("change");
            editButton.classList.add("edit-button");

            if (user.id === currentUser.id) {
                editButton.disabled = true;
                editButton.textContent = t("currentRole");
                editButton.title = t("cannotChangeOwnRole");
            }

            editButton.addEventListener("click", () => {
                userElement.innerHTML = `
                    <h2>${user.name}</h2>
                    <p>${user.email}</p>

                    <label for="role-${user.id}">${t("role")}</label>
                    <select id="role-${user.id}">
                        <option value="EMPLOYEE">${translateRole("EMPLOYEE")}</option>
                        <option value="SUPPORT">${translateRole("SUPPORT")}</option>
                        <option value="ADMIN">${translateRole("ADMIN")}</option>
                    </select>

                    <div class="edit-actions">
                        <button class="save-button">${t("save")}</button>
                        <button class="cancel-button">${t("cancel")}</button>
                    </div>
                `;

                const roleSelect = document.getElementById(`role-${user.id}`);
                const saveButton = userElement.querySelector(".save-button");
                const cancelButton = userElement.querySelector(".cancel-button");

                roleSelect.value = user.role;

                saveButton.addEventListener("click", async () => {
                    try {
                        const response = await fetch(`/users/${user.id}/role`, {
                            method: "PATCH",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                role: roleSelect.value
                            })
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            alert(data.message);
                            return;
                        }

                        await loadUsers();
                    } catch (error) {
                        console.error(error);
                        alert(t("errorUpdateUser"));
                    }
                });

                cancelButton.addEventListener("click", () => {
                    loadUsers();
                });
            });

            userActions.appendChild(editButton);

            const activeButton = document.createElement("button");

            activeButton.textContent = user.active ? t("deactivate") : t("activate");
            activeButton.classList.add("active-button");

            if (user.id === currentUser.id) {
                activeButton.disabled = true;
                activeButton.textContent = t("currentAccount");
                activeButton.title = t("cannotDeactivateOwnAccount");
            }

            activeButton.addEventListener("click", async () => {
                const newActiveStatus = !user.active;

                try {
                    const response = await fetch(`/users/${user.id}/active`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            active: newActiveStatus
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        alert(data.message);
                        return;
                    }

                    await loadUsers();
                } catch (error) {
                    console.error(error);
                    alert(t("errorChangeUserStatus"));
                }
            });

            userActions.appendChild(activeButton);

            usersList.appendChild(userElement);
        });
    } catch (error) {
        console.error(error);
        usersList.textContent = t("errorLoadUsers");
    }
}

const usersButton = document.getElementById("usersButton");

async function loadCurrentUser() {
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

        currentUser = data.user;

        if (currentUser.role !== "ADMIN") {
            usersButton.style.display = "none";
        }
    } catch (error) {
        console.error(error);
    }
}

function translateRole(role) {
    const roleKeys = {
        EMPLOYEE: "roleEmployee",
        SUPPORT: "roleSupport",
        ADMIN: "roleAdmin"
    };

    return t(roleKeys[role]) || role;
}

document.addEventListener("languageChanged", () => {
    loadUsers();
});

async function init() {
    await loadCurrentUser();
    await loadUsers();
}

init();