const app = require("./app");
const whatsappCore = require("./core/whatsapp");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

async function start() {
    try {
        console.log("Starting WhatsApp Core...");
        await whatsappCore.init();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start application:", error);
    }
}

start();
