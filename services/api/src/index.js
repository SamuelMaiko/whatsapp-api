const app = require("./app");
const sequelize = require("../../../shared/config/database");
require("../../../shared/models/User");
require("../../../shared/models/Session");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        console.log("Checking Database connection (API Service)...");
        await sequelize.authenticate();
        console.log("✅ Database connected.");

        console.log("Syncing Models...");
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
