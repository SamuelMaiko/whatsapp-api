import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import apiRoutes from "./routes/api.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

const publicPath = path.join(__dirname, "../public");
app.use(express.static(publicPath));

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "up" });
});

// API Routes
app.use("/api", apiRoutes);

export default app;
