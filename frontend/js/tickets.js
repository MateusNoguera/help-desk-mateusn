const token = localStorage.getItem("token");

const ticketsList = document.getElementById("ticketsList");
const ticketForm = document.getElementById("ticketForm");

const logoutButton = document.getElementById("logoutButton");

const searchFilter = document.getElementById("searchFilter");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const assigneeFilter = document.getElementById("assigneeFilter");
const clearFiltersButton = document.getElementById("clearFiltersButton");

let loadedTickets = [];
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

function formatDate(date) {
    return new Date(date).toLocaleString("pt-BR");
}

function renderTickets(tickets) {
    ticketsList.innerHTML = "";

    if (tickets.length === 0) {
        ticketsList.textContent = "Nenhum ticket encontrado!";
        return;
    }

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
            <p>Criado em: ${formatDate(ticket.created_at)}</p>
            <p>Atualizado em: ${formatDate(ticket.updated_at)}</p>
        `;

        if (currentUser.role === "SUPPORT" || currentUser.role === "ADMIN") {

            if (currentUser.role === "SUPPORT" && ticket.status === "OPEN" && !ticket.assigned_to) {
                const claimButton = document.createElement("button");

                claimButton.textContent = "Assumir ticket";
                claimButton.classList.add("claim-button");

                claimButton.addEventListener("click", async () => {
                    try {
                        const response = await fetch(`/tickets/${ticket.id}/claim`, {
                            method: "PATCH",
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            alert(data.message);
                            return;
                        }

                        await loadTickets();
                    } catch (error) {
                        console.error(error);
                        alert("Erro ao assumir ticket!");
                    }
                });

                ticketElement.appendChild(claimButton);
            }

            const canEdit = currentUser.role === "ADMIN" || (currentUser.role === "SUPPORT" && ticket.assigned_to === currentUser.id);

            if (canEdit) {
                
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
                        <select id="status-${ticket.id}"></select>

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

                    const allowedTransitions = {
                        OPEN: ["IN_PROGRESS"],
                        IN_PROGRESS: ["OPEN", "RESOLVED"],
                        RESOLVED: ["IN_PROGRESS", "CLOSED"],
                        CLOSED: []
                    };

                    const availableStatuses = [
                        ticket.status,
                        ...allowedTransitions[ticket.status]
                    ];

                    availableStatuses.forEach((status) => {
                        const option = document.createElement("option");

                        option.value = status;
                        option.textContent = status;

                        statusSelect.appendChild(option);
                    });

                    statusSelect.value = ticket.status;

                    if (currentUser.role === "ADMIN") {
                        assignableUsers.forEach((user) => {
                            const option = document.createElement("option");

                            option.value = user.id;
                            option.textContent = `${user.name} (${user.role})`;

                            assignedSelect.appendChild(option);
                        });
                    }

                    if (currentUser.role === "SUPPORT") {
                        const supportUser = assignableUsers.find((user) => user.id === currentUser.id);

                        if (supportUser) {
                            const option = document.createElement("option");

                            option.value = supportUser.id;
                            option.textContent = `${supportUser.name} (${supportUser.role})`;

                            assignedSelect.appendChild(option);
                        }
                    }

                    assignedSelect.value = ticket.assigned_to || "";

                    saveButton.addEventListener("click", async () => {
                        const statusesThatRequireAssignee = ["IN_PROGRESS", "RESOLVED", "CLOSED"];

                        if (statusesThatRequireAssignee.includes(statusSelect.value) && !assignedSelect.value) {
                            alert("Selecione um responsável para este status.");
                            return;
                        }

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

                    cancelButton.addEventListener("click", async () => {
                        await loadTickets();
                    });
                });

                ticketElement.appendChild(editButton);
                
            }

            if (currentUser.role === "ADMIN") {
                const deleteButton = document.createElement("button");

                deleteButton.textContent = "Excluir";
                deleteButton.classList.add("delete-button");

                deleteButton.addEventListener("click", async () => {
                    const confirmed = confirm(`Deseja realmente excluir o ticket "${ticket.title}"?`);

                    if (!confirmed) {
                        return;
                    }

                    try {
                        const response = await fetch(`/tickets/${ticket.id}`, {
                            method: "DELETE",
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            alert(data.message);
                            return;
                        }

                        await loadTickets();
                    } catch (error) {
                        console.error(error);
                        alert("Erro ao excluir ticket.");
                    }
                });

                ticketElement.appendChild(deleteButton);
            }

        }

        ticketsList.appendChild(ticketElement);

    });
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

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("token");
                window.location.href = "/login.html";
                return;
            }

            throw new Error("Erro ao carregar tickets!");
        }

        const tickets = await response.json();

        loadedTickets = tickets;

        renderTickets(loadedTickets);

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

        assignableUsers.forEach((user) => {
            const option = document.createElement("option");

            option.value = user.id;
            option.textContent = `${user.name} (${user.role})`;

            assigneeFilter.appendChild(option);
        });

    } catch (error) {
        console.error(error);
    }
}

function applyFilters() {
    const search = searchFilter.value.trim().toLowerCase();
    const status = statusFilter.value;
    const priority = priorityFilter.value;
    const assignee = assigneeFilter.value;

    const filteredTickets = loadedTickets.filter((ticket) => {
        const matchesStatus = !status || ticket.status === status;
        const matchesPriority = !priority || ticket.priority === priority;

        let matchesAssignee = true;

        if (assignee === "unassigned") {
            matchesAssignee = !ticket.assigned_to;
        } else if (assignee) {
            matchesAssignee = ticket.assigned_to === Number(assignee);
        }

        const matchesSearch = !search || ticket.title.toLowerCase().includes(search) || ticket.description.toLowerCase().includes(search);

        return matchesStatus && matchesPriority && matchesAssignee && matchesSearch;
    });

    renderTickets(filteredTickets);
}

async function init() {
    await loadCurrentUser();

    if (currentUser.role === "SUPPORT" || currentUser.role === "ADMIN") {
        await loadAssignableUsers();
    }

    await loadTickets();
}

init();

searchFilter.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);
priorityFilter.addEventListener("change", applyFilters);
assigneeFilter.addEventListener("change", applyFilters);

clearFiltersButton.addEventListener("click", () => {
    statusFilter.value = "";
    priorityFilter.value = "";
    assigneeFilter.value = "";
    searchFilter.value = "";

    renderTickets(loadedTickets);
});