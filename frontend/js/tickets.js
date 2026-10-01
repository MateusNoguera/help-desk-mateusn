const token = localStorage.getItem("token");
const ticketsList = document.getElementById("ticketsList");

const logoutButton = document.getElementById("logoutButton");

logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
});

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

            ticketsList.appendChild(ticketElement);
        });
    } catch (error) {
        console.error(error);
        ticketsList.textContent = "Erro ao carregar tickets.";
    }
}

loadTickets();