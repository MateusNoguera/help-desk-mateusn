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
        let result;

        if (req.user.role === "EMPLOYEE") {
            result = await pool.query(
                `
                    SELECT
                        tickets.*,
                        users.name AS assigned_to_name
                    FROM tickets
                    LEFT JOIN users ON users.id = tickets.assigned_to
                    WHERE tickets.created_by = $1
                    ORDER BY tickets.id
                `,
                [req.user.id]
            );
        } else {
            result = await pool.query(
                `
                    SELECT
                        tickets.*,
                        users.name AS assigned_to_name
                    FROM tickets
                    LEFT JOIN users ON users.id = tickets.assigned_to
                    ORDER BY tickets.id
                `
            );
        }

        return res.json(result.rows);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error!"
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
        const userId = req.user.id;

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
                INSERT INTO tickets (title, description, priority, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `,
            [title, description, priority || "MEDIUM", userId]
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
}

export async function updateTicket(req, res) {
    try {
        const id = Number(req.params.id);
        const { status, priority, assigned_to } = req.body;

        if (!status || !priority) {
            return res.status(400).json({
                message: "Status and priority are required!"
            });
        }

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status!"
            });
        }

        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                message: "Invalid priority!"
            });
        }

        if (assigned_to) {
            const userResult = await pool.query(
                "SELECT id, role FROM users WHERE id = $1",
                [assigned_to]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    message: "Assigned user not found!"
                });
            }

            if (!["SUPPORT", "ADMIN"].includes(userResult.rows[0].role)) {
                return res.status(400).json({
                    message: "Assigned user must be SUPPORT or ADMIN!"
                });
            }
        }

        const result = await pool.query(
            `
                UPDATE tickets
                SET status = $1,
                    priority = $2,
                    assigned_to = $3
                WHERE id = $4
                RETURNING *
            `,
            [status, priority, assigned_to || null, id]
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
}

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