import express from "express";

const app = express();

app.use(express.json());

const PORT = 3000;

const tickets = [];

const validStatuses = [
    "OPEN",
    "IN_PROGRESS",
    "RESOLVED",
    "CLOSED"
];

const validPriorities = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
];

app.get("/", (req, res) => {
    res.json({
        message: "API running :)"
    });
});

app.get("/tickets", (req, res) => {
    return res.json(tickets);
});

app.get("/tickets/:id", (req, res) => {
    const id = Number(req.params.id);

    const ticket = tickets.find((ticket) => ticket.id === id);

    if (!ticket) {
        return res.status(404).json({
            message: "Ticket not found!"
        });
    }

    return res.json(ticket);
});

app.post("/tickets", (req, res) => {
    const { title, description, priority } = req.body;

    if (!title || !description) {
        return res.status(400).json({
            message: "Title and description are required!"
        });
    }

    if (priority && !validPriorities.includes(priority)) {
        return res.status(400).json({
            message: "Invalid priority!"
        });
    }

    const ticket = {
        id: tickets.length + 1,
        title: title,
        description: description,
        priority: priority || "MEDIUM",
        status: "OPEN",
        createdAt: new Date()
    };

    tickets.push(ticket);

    return res.status(201).json({
        message: "Ticket created",
        ticket: ticket
    });
});

app.patch("/tickets/:id", (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    const ticket = tickets.find((ticket) => ticket.id === id);

    if (!ticket) {
        return res.status(404).json({
            message: "Ticket not found!"
        });
    }

    if (!status) {
        return res.status(400).json({
            message: "Status is required!"
        });
    }

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            message: "Invalid status!"
        });
    }

    ticket.status = status;

    return res.json({
        message: "Ticket updated",
        ticket
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});