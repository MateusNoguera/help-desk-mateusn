import pool from "../database/db.js";

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

export async function getTickets(req, res) {
    try {
        const result = await pool.query(
            "SELECT * FROM tickets ORDER BY id"
        );

        return res.json(result.rows);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function getTicketsById(req, res) {
    try {
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
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export async function createTicket(req, res) {
    try {

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

    } catch (error) {
        
        console.error(error);

        return res.status(500).json({
            message: "Internal server error!"
        });

    }
};

export async function updateTicketStatus(req, res) {
    try {
        const id = Number(req.params.id);
        const { status } = req.body;

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
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error!"
        });
    }
};

export async function deleteTicket(req, res) {
    try {
        const id = Number(req.params.id);

        const result = await pool.query(
            `
                DELETE FROM tickets
                WHERE id = $1
                RETURNING *
            `,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Ticket not found!"
            });
        }

        return res.json({
            message: "Ticket deleted!",
            ticket: result.rows[0]
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error!"
        });
    }
};