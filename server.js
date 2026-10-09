import express from "express";
import ticketsRouter from "./routes/ticketsRoutes.js";
import usersRouter from "./routes/usersRoutes.js";
import authRouter from "./routes/authRoutes.js";

const app = express();

app.use(express.json());
app.use(express.static("frontend"));

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