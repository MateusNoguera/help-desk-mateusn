import bcrypt from "bcrypt";
import pool from "../database/db.js";

export async function createUser(req, res) {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required!"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `
                INSERT INTO users (name, email, password, role)
                VALUES ($1, $2, $3, $4)
                RETURNING id, name, email, role, created_at
            `,
            [
                name,
                email,
                hashedPassword,
                role || "EMPLOYEE"
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