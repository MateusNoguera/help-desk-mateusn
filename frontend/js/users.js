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

            usersList.appendChild(userElement);
        });
    } catch (error) {
        console.error(error);
        usersList.textContent = "Erro ao carregar usuários.";
    }
}

loadUsers();