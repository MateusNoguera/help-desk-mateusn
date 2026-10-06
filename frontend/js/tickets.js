const token = localStorage.getItem("token");
const ticketsList = document.getElementById("ticketsList");
const logoutButton = document.getElementById("logoutButton");
const ticketForm = document.getElementById("ticketForm");


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

loadTickets();