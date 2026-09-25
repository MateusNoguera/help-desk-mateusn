import express from "express";
import ticketsRouter from "./routes/tickets.js";
import usersRouter from "./routes/users.js";
import authRouter from "./routes/auth.js";

const app = express();

app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {
    res.json({
        message: "API running :)"
    });
});

app.use("/tickets", ticketsRouter);

app.use("/users", usersRouter);

app.use("/auth", authRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});