const app = require("./app");
const sequelize = require("./config/database");
require("./models/User");
require("./models/Session");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        console.log("Checking Database connection...");
        await sequelize.authenticate();
        console.log("✅ Database connected.");

        console.log("Syncing Models...");
        await sequelize.sync({ alter: true });
        console.log("✅ Models synced.");

        console.log("Initializing Session Manager...");
        const sessionManager = require("./core/SessionManager");
        await sessionManager.init();
        console.log("✅ Session Manager ready.");

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start application:", error);
    }
}

start();
