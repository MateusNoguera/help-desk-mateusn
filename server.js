import express from "express";

const app = express();

app.use(express.json());

const PORT = 3000;

const tickets = [];

app.get("/", (req, res) => {
    res.json({
        message: "API running :)"
    });
});

app.get("/tickets", (req, res) => {
    return res.json(tickets);
});

app.post("/tickets", (req, res) => {
    const { title, description, priority } = req.body;

    if (!title || !description) {
        return res.status(400).json({
            message: "Title and description are required!"
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});