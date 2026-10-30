const token = localStorage.getItem("token");

const ticketsList = document.getElementById("ticketsList");
const toggleTicketFormButton = document.getElementById("toggleTicketFormButton");
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

function handleUnauthorized(response) {
    if (response.status !== 401) {
        return false;
    }

    localStorage.removeItem("token");
    window.location.href = "/login.html";

    return true;
}

toggleTicketFormButton.addEventListener("click", () => {
    const formIsHidden = ticketForm.classList.contains("hidden");

    if (formIsHidden) {
        ticketForm.classList.remove("hidden");
        toggleTicketFormButton.textContent = t("cancelCreation");
    } else {
        ticketForm.classList.add("hidden");
        ticketForm.reset();
        toggleTicketFormButton.textContent = t("createTicket");
    }
});

async function loadCurrentUser() {
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

        currentUser = data.user;
    } catch (error) {
        console.error(error);
    }
}

function formatDate(date) {
    return new Date(date).toLocaleString(getCurrentLanguage());
}

function renderTickets(tickets) {
    ticketsList.innerHTML = "";

    if (tickets.length === 0) {
        ticketsList.textContent = t("noTicketsFound");
        return;
    }

    tickets.forEach((ticket) => {
        const ticketElement = document.createElement("div");
        ticketElement.classList.add("ticket-card");

        ticketElement.innerHTML = `
            <div class="ticket-card-header">
                <h2>${ticket.title}</h2>
                <span class="ticket-status">${translateStatus(ticket.status)}</span>
            </div>

            <p class="ticket-description">${ticket.description}</p>

            <div class="ticket-details">
                <p><strong>${t("priority")}:</strong> ${translatePriority(ticket.priority)}</p>
                <p><strong>${t("createdBy")}:</strong> ${ticket.created_by_name || t("unidentifiedUser")}</p>
                <p><strong>${t("assignedTo")}:</strong> ${ticket.assigned_to_name || t("noAssignee")}</p>
                <p><strong>${t("createdAt")}:</strong> ${formatDate(ticket.created_at)}</p>
                <p><strong>${t("updatedAt")}:</strong> ${formatDate(ticket.updated_at)}</p>
            </div>

            <div class="ticket-actions"></div>
        `;

        const ticketActions = ticketElement.querySelector(".ticket-actions");

        if (currentUser.role === "SUPPORT" || currentUser.role === "ADMIN") {

            if (currentUser.role === "SUPPORT" && ticket.status === "OPEN" && !ticket.assigned_to) {
                const claimButton = document.createElement("button");

                claimButton.textContent = t("claim");
                claimButton.classList.add("claim-button");

                claimButton.addEventListener("click", async () => {
                    try {
                        const response = await fetch(`/tickets/${ticket.id}/claim`, {
                            method: "PATCH",
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });

                        if (handleUnauthorized(response)) {
                            return;
                        }

                        const data = await response.json();

                        if (!response.ok) {
                            alert(getApiErrorMessage(data, "errorClaimTicket"));
                            return;
                        }

                        await loadTickets();
                    } catch (error) {
                        console.error(error);
                        alert(t("errorClaimTicket"));
                    }
                });

                ticketActions.appendChild(claimButton);
            }

            const canEdit = currentUser.role === "ADMIN" || (currentUser.role === "SUPPORT" && ticket.assigned_to === currentUser.id);

            if (canEdit) {
                
                const editButton = document.createElement("button");

                editButton.textContent = t("edit");
                editButton.classList.add("edit-button");

                editButton.addEventListener("click", () => {
                    ticketElement.innerHTML = `
                        <h2>${ticket.title}</h2>
                        <p>${ticket.description}</p>

                        <label for="priority-${ticket.id}">${t("priorityLabel")}</label>
                        <select id="priority-${ticket.id}">
                            <option value="LOW">${translatePriority("LOW")}</option>
                            <option value="MEDIUM">${translatePriority("MEDIUM")}</option>
                            <option value="HIGH">${translatePriority("HIGH")}</option>
                            <option value="CRITICAL">${translatePriority("CRITICAL")}</option>
                        </select>

                        <label for="status-${ticket.id}">${t("statusLabel")}</label>
                        <select id="status-${ticket.id}"></select>

                        <label for="assigned-${ticket.id}">${t("assignedToLabel")}</label>
                        <select id="assigned-${ticket.id}">
                            <option value="">${t("noAssignee")}</option>
                        </select>

                        <div class="edit-actions">
                            <button class="save-button">${t("save")}</button>
                            <button class="cancel-button">${t("cancel")}</button>
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
                        option.textContent = translateStatus(status);

                        statusSelect.appendChild(option);
                    });

                    statusSelect.value = ticket.status;

                    if (currentUser.role === "ADMIN") {
                        assignableUsers.forEach((user) => {
                            const option = document.createElement("option");

                            option.value = user.id;
                            option.textContent = `${user.name} (${translateRole(user.role)})`;

                            assignedSelect.appendChild(option);
                        });
                    }

                    if (currentUser.role === "SUPPORT") {
                        const supportUser = assignableUsers.find((user) => user.id === currentUser.id);

                        if (supportUser) {
                            const option = document.createElement("option");

                            option.value = supportUser.id;
                            option.textContent = `${supportUser.name} (${translateRole(supportUser.role)})`;

                            assignedSelect.appendChild(option);
                        }
                    }

                    assignedSelect.value = ticket.assigned_to || "";

                    saveButton.addEventListener("click", async () => {
                        const statusesThatRequireAssignee = ["IN_PROGRESS", "RESOLVED", "CLOSED"];

                        if (statusesThatRequireAssignee.includes(statusSelect.value) && !assignedSelect.value) {
                            alert(t("selectAssigneeRequired"));
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

                            if (handleUnauthorized(response)) {
                                return;
                            }

                            const data = await response.json();

                            if (!response.ok) {
                                alert(getApiErrorMessage(data, "errorUpdateTicket"));
                                return;
                            }

                            await loadTickets();
                        } catch (error) {
                            console.error(error);
                            alert(t("errorUpdateTicket"));
                        }
                    });

                    cancelButton.addEventListener("click", async () => {
                        await loadTickets();
                    });
                });

                ticketActions.appendChild(editButton);
                
            }

            if (currentUser.role === "ADMIN") {
                const deleteButton = document.createElement("button");

                deleteButton.textContent = t("delete");
                deleteButton.classList.add("delete-button");

                deleteButton.addEventListener("click", async () => {
                    const confirmed = confirm(`${t("deleteTicketConfirm")} "${ticket.title}"?`);

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

                        if (handleUnauthorized(response)) {
                            return;
                        }

                        const data = await response.json();

                        if (!response.ok) {
                            alert(getApiErrorMessage(data, "errorDeleteTicket"));
                            return;
                        }

                        await loadTickets();
                    } catch (error) {
                        console.error(error);
                        alert(t("errorDeleteTicket"));
                    }
                });

                ticketActions.appendChild(deleteButton);
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

        if (handleUnauthorized(response)) {
            return;
        }

        if (!response.ok) {
            throw new Error("Erro ao carregar tickets!");
        }

        const tickets = await response.json();

        loadedTickets = tickets;

        renderTickets(loadedTickets);

    } catch (error) {
        console.error(error);
        ticketsList.textContent = t("errorLoadTickets");
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
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                description,
                priority
            })
        });

        if (handleUnauthorized(response)) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            alert(getApiErrorMessage(data, "errorCreateTicket"));
            return;
        }

        ticketForm.reset();
        ticketForm.classList.add("hidden");
        toggleTicketFormButton.textContent = t("createTicket");
        await loadTickets();
    } catch (error) {
        console.error("Error creating ticket:", error);
        alert(t("errorCreateTicket"));
    }
});

async function loadAssignableUsers() {
    try {
        const response = await fetch("/users/assignable", {
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

        assignableUsers = await response.json();

        assignableUsers.forEach((user) => {
            const option = document.createElement("option");

            option.value = user.id;
            option.textContent = `${user.name} (${translateRole(user.role)})`;

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

function translateStatus(status) {
    const statusKeys = {
        OPEN: "statusOpen",
        IN_PROGRESS: "statusInProgress",
        RESOLVED: "statusResolved",
        CLOSED: "statusClosed"
    };

    return (t(statusKeys[status]) || status).toUpperCase();
}

function translatePriority(priority) {
    const priorityKeys = {
        LOW: "priorityLow",
        MEDIUM: "priorityMedium",
        HIGH: "priorityHigh",
        CRITICAL: "priorityCritical"
    };

    return t(priorityKeys[priority]) || priority;
}

function translateRole(role) {
    const roleKeys = {
        EMPLOYEE: "roleEmployee",
        SUPPORT: "roleSupport",
        ADMIN: "roleAdmin"
    };

    return t(roleKeys[role]) || role;
}

function getApiErrorMessage(data, fallbackKey) {
    const errorKeys = {
        TITLE_DESCRIPTION_REQUIRED: "errorTitleDescriptionRequired",
        TITLE_DESCRIPTION_INVALID_TYPE: "errorTitleDescriptionInvalidType",
        TITLE_TOO_LONG: "errorTitleTooLong",
        DESCRIPTION_TOO_LONG: "errorDescriptionTooLong",
        INVALID_PRIORITY: "errorInvalidPriority",
        INVALID_STATUS: "errorInvalidStatus",
        TICKET_NOT_FOUND: "errorTicketNotFound",
        SUPPORT_NOT_ASSIGNED: "errorSupportNotAssigned",
        SUPPORT_CANNOT_REASSIGN: "errorSupportCannotReassign",
        INVALID_STATUS_TRANSITION: "errorInvalidStatusTransition",
        ASSIGNEE_REQUIRED: "errorAssigneeRequired",
        ASSIGNEE_NOT_FOUND: "errorAssigneeNotFound",
        ASSIGNEE_INACTIVE: "errorAssigneeInactive",
        ASSIGNEE_INVALID_ROLE: "errorAssigneeInvalidRole",
        TICKET_ALREADY_ASSIGNED: "errorTicketAlreadyAssigned",
        TICKET_NOT_OPEN: "errorTicketNotOpen"
    };

    if (data.code && errorKeys[data.code]) {
        return t(errorKeys[data.code]);
    }

    return t(fallbackKey);
}

document.addEventListener("languageChanged", () => {
    renderTickets(loadedTickets);

    if (!ticketForm.classList.contains("hidden")) {
        toggleTicketFormButton.textContent = t("cancelCreation");
    }
});

async function init() {
    await loadCurrentUser();

    if (!currentUser) {
        return;
    }

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