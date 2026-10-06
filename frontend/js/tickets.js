const token = localStorage.getItem("token");
const ticketsList = document.getElementById("ticketsList");
const logoutButton = document.getElementById("logoutButton");
const ticketForm = document.getElementById("ticketForm");

let currentUser = null;


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
            `;

            if (currentUser.role === "SUPPORT" || currentUser.role === "ADMIN") {
                const statusSelect = document.createElement("select");

                statusSelect.innerHTML = `
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                `;

                statusSelect.value = ticket.status;

                ticketElement.appendChild(statusSelect);
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

async function init() {
    await loadCurrentUser();
    await loadTickets();
}

init();