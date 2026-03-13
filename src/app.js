const express = require("express");
const whatsappService = require("./services/whatsapp.service");

const app = express();
app.use(express.json());

// Basic health check
app.get("/health", (req, res) => {
    res.json({ status: "up" });
});

// Route to send messages
app.post("/send-message", async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: "Missing 'to' or 'message' field" });
        }

        const result = await whatsappService.sendMessage(to, message);
        res.json({ success: true, result });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
