const token = localStorage.getItem("token");
const usersList = document.getElementById("usersList");

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
            usersList.textContent = "Você não tem permissão para acessar esta página.";
            return;
        }

        const users = await response.json();

        usersList.innerHTML = "";

        users.forEach((user) => {
            const userElement = document.createElement("div");
            userElement.classList.add("user-card");

            userElement.innerHTML = `
                <h2>${user.name}</h2>
                <p>${user.email}</p>
                <p>Role: ${user.role}</p>
            `;

            const editButton = document.createElement("button");
            editButton.textContent = "Alterar";
            editButton.classList.add("edit-button");

            editButton.addEventListener("click", () => {
                userElement.innerHTML = `
                    <h2>${user.name}</h2>
                    <p>${user.email}</p>

                    <label for="role-${user.id}">Role</label>
                    <select id="role-${user.id}">
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="SUPPORT">SUPPORT</option>
                        <option value="ADMIN">ADMIN</option>
                    </select>

                    <div class="edit-actions">
                        <button class="save-button">Salvar</button>
                        <button class="cancel-button">Cancelar</button>
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
                        alert("Erro ao atualizar usuário.");
                    }
                });

                cancelButton.addEventListener("click", () => {
                    loadUsers();
                });
            });

            userElement.appendChild(editButton);

            usersList.appendChild(userElement);
        });
    } catch (error) {
        console.error(error);
        usersList.textContent = "Erro ao carregar usuários.";
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

async function init() {
    await loadCurrentUser();
    await loadUsers();
}

init();