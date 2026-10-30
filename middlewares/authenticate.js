import jwt from "jsonwebtoken";
import pool from "../database/db.js";

export async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Token not provided!"
        });
    }

    const [, token] = authHeader.split(" ");

    if (!token) {
        return res.status(401).json({
            message: "Invalid token format!"
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const result = await pool.query(
            "SELECT id, name, email, role, active FROM users WHERE id = $1",
            [decoded.id]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({
                message: "User not found!"
            });
        }

        const user = result.rows[0];

        if (!user.active) {
            return res.status(401).json({
                message: "User account is inactive!"
            });
        }

        req.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token!"
        });
    }
}