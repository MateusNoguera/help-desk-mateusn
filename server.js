import express from "express";
import ticketsRouter from "./routes/tickets.js";

const app = express();

app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {
    res.json({
        message: "API running :)"
    });
});

app.use("/tickets", ticketsRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});