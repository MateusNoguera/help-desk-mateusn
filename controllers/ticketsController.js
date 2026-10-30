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
                        creator.name AS created_by_name,
                        assignee.name AS assigned_to_name
                    FROM tickets
                    LEFT JOIN users AS creator ON creator.id = tickets.created_by
                    LEFT JOIN users AS assignee ON assignee.id = tickets.assigned_to
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
                        creator.name AS created_by_name,
                        assignee.name AS assigned_to_name
                    FROM tickets
                    LEFT JOIN users AS creator ON creator.id = tickets.created_by
                    LEFT JOIN users AS assignee ON assignee.id = tickets.assigned_to
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
        const { id } = req.params;

        let result;

        if (req.user.role === "EMPLOYEE") {
            result = await pool.query(
                `
                    SELECT
                        tickets.*,
                        users.name AS assigned_to_name
                    FROM tickets
                    LEFT JOIN users ON users.id = tickets.assigned_to
                    WHERE tickets.id = $1
                    AND tickets.created_by = $2
                `,
                [id, req.user.id]
            );
        } else {
            result = await pool.query(
                `
                    SELECT
                        tickets.*,
                        users.name AS assigned_to_name
                    FROM tickets
                    LEFT JOIN users ON users.id = tickets.assigned_to
                    WHERE tickets.id = $1
                `,
                [id]
            );
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                code: "TICKET_NOT_FOUND",
                message: "Ticket not found!"
            });
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error!"
        });
    }
}

export async function createTicket(req, res) {
    try {
        const { title, description, priority } = req.body;
        const userId = req.user.id;

        if (typeof title !== "string" || typeof description !== "string") {
            return res.status(400).json({
                code: "TITLE_DESCRIPTION_INVALID_TYPE",
                message: "Title and description must be strings!"
            });
        }

        const trimmedTitle = title?.trim();
        const trimmedDescription = description?.trim();

        if (!trimmedTitle || !trimmedDescription) {
            return res.status(400).json({
                code: "TITLE_DESCRIPTION_REQUIRED",
                message: "Title and description are required!"
            });
        }

        if (trimmedTitle.length > 100) {
            return res.status(400).json({
                code: "TITLE_TOO_LONG",
                message: "Title must have at most 100 characters!"
            });
        }

        if (trimmedDescription.length > 2000) {
            return res.status(400).json({
                code: "DESCRIPTION_TOO_LONG",
                message: "Description must have at most 2000 characters!"
            });
        }

        if (priority && !validPriorities.includes(priority)) {
            return res.status(400).json({
                code: "INVALID_PRIORITY",
                message: "Invalid priority!"
            });
        }

        const result = await pool.query(
            `
                INSERT INTO tickets (title, description, priority, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `,
            [trimmedTitle, trimmedDescription, priority || "MEDIUM", userId]
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
        const { id } = req.params;
        const { status, priority, assigned_to } = req.body;

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                code: "INVALID_STATUS",
                message: "Invalid status!"
            });
        }

        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                code: "INVALID_PRIORITY",
                message: "Invalid priority!"
            });
        }

        const currentTicket = await pool.query(
            "SELECT * FROM tickets WHERE id = $1",
            [id]
        );

        if (currentTicket.rows.length === 0) {
            return res.status(404).json({
                code: "TICKET_NOT_FOUND",
                message: "Ticket not found!"
            });
        }

        const ticket = currentTicket.rows[0];

        if (req.user.role === "SUPPORT" && ticket.assigned_to !== req.user.id) {
            return res.status(403).json({
                code: "SUPPORT_NOT_ASSIGNED",
                message: "You can only update tickets assigned to you!"
            });
        }

        if (req.user.role === "SUPPORT" && assigned_to !== req.user.id && assigned_to !== null) {
            return res.status(403).json({
                code: "SUPPORT_CANNOT_REASSIGN",
                message: "Support users cannot reassign tickets!"
            });
        }

        const currentStatus = ticket.status;

        const allowedTransitions = {
            OPEN: ["IN_PROGRESS"],
            IN_PROGRESS: ["OPEN", "RESOLVED"],
            RESOLVED: ["IN_PROGRESS", "CLOSED"],
            CLOSED: []
        };

        if (
            status !== currentStatus &&
            !allowedTransitions[currentStatus].includes(status)
        ) {
            return res.status(400).json({
                code: "INVALID_STATUS_TRANSITION",
                message: `Invalid status transition from ${currentStatus} to ${status}!`
            });
        }

        if (["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status) && !assigned_to) {
            return res.status(400).json({
                code: "ASSIGNEE_REQUIRED",
                message: "Ticket must have an assigned user for this status"
            });
        }

        if (assigned_to) {
            const userResult = await pool.query(
                "SELECT id, role, active FROM users WHERE id = $1",
                [assigned_to]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    code: "ASSIGNEE_NOT_FOUND",
                    message: "Assigned user not found!"
                });
            }

            if (!userResult.rows[0].active) {
                return res.status(400).json({
                    code: "ASSIGNEE_INACTIVE",
                    message: "Assigned user must be active!"
                });
            }

            if (!["SUPPORT", "ADMIN"].includes(userResult.rows[0].role)) {
                return res.status(400).json({
                    code: "ASSIGNEE_INVALID_ROLE",
                    message: "Assigned user must be SUPPORT or ADMIN!"
                });
            }
        }

        const result = await pool.query(
            `
                UPDATE tickets
                SET status = $1,
                    priority = $2,
                    assigned_to = $3,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING *
            `,
            [status, priority, assigned_to || null, id]
        );

        return res.json(result.rows[0]);
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
                code: "TICKET_NOT_FOUND",
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

export async function claimTicket(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const ticketResult = await pool.query(
            "SELECT * FROM tickets WHERE id = $1",
            [id]
        );

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({
                code: "TICKET_NOT_FOUND",
                message: "Ticket not found!"
            });
        }

        const ticket = ticketResult.rows[0];

        if (ticket.assigned_to) {
            return res.status(400).json({
                code: "TICKET_ALREADY_ASSIGNED",
                message: "Ticket already has an assigned user!"
            });
        }

        if (ticket.status !== "OPEN") {
            return res.status(400).json({
                code: "TICKET_NOT_OPEN",
                message: "Only open tickets can be claimed!"
            });
        }

        const result = await pool.query(
            `
                UPDATE tickets
                SET assigned_to = $1,
                    status = 'IN_PROGRESS',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `,
            [userId, id]
        );

        return res.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error!"
        });
    }
}