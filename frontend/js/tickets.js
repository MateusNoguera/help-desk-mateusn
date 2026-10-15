const token = localStorage.getItem("token");
const ticketsList = document.getElementById("ticketsList");
const logoutButton = document.getElementById("logoutButton");
const ticketForm = document.getElementById("ticketForm");

let currentUser = null;
let assignableUsers = [];

logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

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
    } catch (error) {
        console.error(error);
    }
}

async function loadTickets() {
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch("/tickets", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "/login.html";
            return;
        }

        const tickets = await response.json();

        ticketsList.innerHTML = "";

        tickets.forEach((ticket) => {
            const ticketElement = document.createElement("div");
            ticketElement.classList.add("ticket-card");

            ticketElement.innerHTML = `
                <h2>${ticket.title}</h2>
                <p>${ticket.description}</p>
                <p>Prioridade: ${ticket.priority}</p>
                <p>Status: ${ticket.status}</p>
                <p>Criado por: ${ticket.created_by_name || "Usuário não identificado"}</p>
                <p>Responsável: ${ticket.assigned_to_name || "Sem responsável"}</p>
            `;

            if (currentUser.role === "SUPPORT" || currentUser.role === "ADMIN") {
                const editButton = document.createElement("button");
                editButton.textContent = "Alterar";
                editButton.classList.add("edit-button");

                editButton.addEventListener("click", () => {
                    ticketElement.innerHTML = `
                        <h2>${ticket.title}</h2>
                        <p>${ticket.description}</p>

                        <label for="priority-${ticket.id}">Prioridade</label>
                        <select id="priority-${ticket.id}">
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                            <option value="CRITICAL">CRITICAL</option>
                        </select>

                        <label for="status-${ticket.id}">Status</label>
                        <select id="status-${ticket.id}">
                            <option value="OPEN">OPEN</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="CLOSED">CLOSED</option>
                        </select>

                        <label for="assigned-${ticket.id}">Responsável</label>
                        <select id="assigned-${ticket.id}">
                            <option value="">Sem responsável</option>
                        </select>

                        <div class="edit-actions">
                            <button class="save-button">Salvar</button>
                            <button class="cancel-button">Cancelar</button>
                        </div>
                    `;

                    const prioritySelect = document.getElementById(`priority-${ticket.id}`);
                    const statusSelect = document.getElementById(`status-${ticket.id}`);
                    const assignedSelect = document.getElementById(`assigned-${ticket.id}`);

                    const cancelButton = ticketElement.querySelector(".cancel-button");
                    const saveButton = ticketElement.querySelector(".save-button");

                    prioritySelect.value = ticket.priority;
                    statusSelect.value = ticket.status;

                    assignableUsers.forEach((user) => {
                        const option = document.createElement("option");
                        option.value = user.id;
                        option.textContent = `${user.name} (${user.role})`;
                        assignedSelect.appendChild(option);
                    });
                    assignedSelect.value = ticket.assigned_to || "";

                    cancelButton.addEventListener("click", () => {
                        loadTickets();
                    });

                    saveButton.addEventListener("click", async () => {
                        try {
                            const response = await fetch(`/tickets/${ticket.id}`, {
                                method: "PATCH",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    status: statusSelect.value,
                                    priority: prioritySelect.value,
                                    assigned_to: assignedSelect.value ? Number(assignedSelect.value) : null
                                })
                            });

                            const data = await response.json();

                            if (!response.ok) {
                                alert(data.message);
                                return;
                            }

                            await loadTickets();
                        } catch (error) {
                            console.error(error);
                            alert("Erro ao atualizar ticket.");
                        }
                    });
                });

                ticketElement.appendChild(editButton);
            }

            ticketsList.appendChild(ticketElement);
        });
    } catch (error) {
        console.error(error);
        ticketsList.textContent = "Erro ao carregar tickets.";
    }
}

ticketForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const priority = document.getElementById("priority").value;

    try {
        const response = await fetch("/tickets", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                priority
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        ticketForm.reset();

        await loadTickets();
    } catch (error) {
        console.error(error);
        alert("Erro ao criar ticket.");
    }
});

async function loadAssignableUsers() {
    try {
        const response = await fetch("/users/assignable", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return;
        }

        assignableUsers = await response.json();
    } catch (error) {
        console.error(error);
    }
}

async function init() {
    await loadCurrentUser();

    if (currentUser.role === "SUPPORT" || currentUser.role === "ADMIN") {
        await loadAssignableUsers();
    }

    await loadTickets();
}

init();