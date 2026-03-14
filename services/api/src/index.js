import app from "./app.js";
import sequelize from "../../../shared/config/database.js";
import User from "../../../shared/models/User.js";
import Session from "../../../shared/models/Session.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        console.log("Checking Database connection (API Service)...");
        await sequelize.authenticate();
        console.log("✅ Database connected.");

        console.log("Syncing Models...");
        // Ensure both models are loaded for sync
        await sequelize.sync({ alter: true });
        console.log("✅ Models synced.");

        app.listen(PORT, () => {
            console.log(`🚀 API Service running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start API Service:", error);
    }
}

start();
