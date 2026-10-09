import bcrypt from "bcrypt";
import pool from "../database/db.js";

const validRoles = [
    "EMPLOYEE",
    "SUPPORT",
    "ADMIN"
];

export async function createUser(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required!"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `
                INSERT INTO users (name, email, password)
                VALUES ($1, $2, $3)
                RETURNING id, name, email, role, created_at
            `,
            [
                name,
                email,
                hashedPassword
            ]
        );

        return res.status(201).json({
            message: "User created!",
            user: result.rows[0]
        });
    } catch (error) {
        console.error(error);

        if (error.code === "23505") {
            return res.status(409).json({
                message: "Email already registered!"
            });
        }

        return res.status(500).json({
            message: "Internal server error!"
        });
    }
}

export async function getUsers(req, res) {
    try {
        const result = await pool.query(
            `
                SELECT id, name, email, role, created_at
                FROM users
                ORDER BY id
            `
        );

        return res.json(result.rows);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error!"
        });
    }
}

export async function updateUserRole(req, res) {
    try {
        const id = Number(req.params.id);
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({
                message: "Role is required!"
            });
        }

        if (!validRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role!"
            });
        }

        const result = await pool.query(
            `
                UPDATE users
                SET role = $1
                WHERE id = $2
                RETURNING id, name, email, role, created_at
            `,
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found!"
            });
        }

        return res.json({
            message: "User role updated!",
            user: result.rows[0]
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Internal server error!"
        });
    }
}