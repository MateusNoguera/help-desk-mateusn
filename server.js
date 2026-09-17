import express from "express";
import pool from "./database/db.js";

const app = express();

app.use(express.json());

const PORT = 3000;

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

app.get("/tickets", async (req, res) => {
    const result = await pool.query(
        "SELECT * FROM tickets ORDER BY id"
    );

    return res.json(result.rows);
});

app.get("/tickets/:id", async (req, res) => {
    const id = Number(req.params.id);

    const result = await pool.query(
        "SELECT * FROM tickets WHERE id = $1",
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            message: "Ticket not found!"
        });
    }

    return res.json(result.rows[0]);
});

app.post("/tickets", async (req, res) => {
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

    const result = await pool.query(
        `
            INSERT INTO tickets (title, description, priority)
            VALUES ($1, $2, $3)
            RETURNING *
        `,
        [
            title,
            description,
            priority || "MEDIUM"
        ]
    );

    return res.status(201).json({
        message: "Ticket created!",
        ticket: result.rows[0]
    });
});

app.patch("/tickets/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;

    const ticketResult = await pool.query(
        "SELECT * FROM tickets WHERE id = $1",
        [id]
    );

    if (ticketResult.rows.length === 0) {
        return res.status(404).json({
            message: "Ticket not found"
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

    const result = await pool.query(
        `
            UPDATE tickets
            SET status = $1
            WHERE id = $2
            RETURNING *
        `,
        [status, id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            message: "Ticket not found!"
        });
    }

    return res.json({
        message: "Ticket updated!",
        ticket: result.rows[0]
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});