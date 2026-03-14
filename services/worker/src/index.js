import express from 'express';
import sequelize from "../../../shared/config/database.js";
import User from "../../../shared/models/User.js";
import Session from "../../../shared/models/Session.js";
import sessionManager from "./core/SessionManager.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

const WORKER_PORT = process.env.WORKER_PORT || 4000;

// Internal API for the Web Service to command the Worker
app.post('/sessions/start', async (req, res) => {
    try {
        const { sessionId, userId, webhookUrl } = req.body;
        await sessionManager.createSession(sessionId, userId, { webhookUrl });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/sessions/webhook', async (req, res) => {
    try {
        const { sessionId, webhookUrl } = req.body;
        const instance = sessionManager.getInstance(sessionId);
        if (instance) {
            instance.options.webhookUrl = webhookUrl;
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/sessions/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        await sessionManager.deleteSession(sessionId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Messaging routes
app.post('/messaging/send-message', async (req, res) => {
    try {
        const { sessionId, to, message } = req.body;
        const instance = sessionManager.getInstance(sessionId);
        if (!instance) return res.status(404).json({ error: "Session not found" });
        const result = await instance.sendMessage(to, message);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/messaging/send-image', async (req, res) => {
    try {
        const { sessionId, to, url, caption } = req.body;
        const instance = sessionManager.getInstance(sessionId);
        if (!instance) return res.status(404).json({ error: "Session not found" });
        const result = await instance.sendImage(to, url, caption);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

async function start() {
    try {
        console.log("Checking Database connection (Worker Service)...");
        await sequelize.authenticate();
        console.log("✅ Database connected.");

        await sequelize.sync({ alter: true });

        console.log("Initializing Session Manager...");
        await sessionManager.init();
        console.log("✅ Session Manager ready.");

        app.listen(WORKER_PORT, () => {
            console.log(`🚀 Worker Internal Server running on http://localhost:${WORKER_PORT}`);
        });

    } catch (error) {
        console.error("❌ Failed to start Worker Service:", error);
    }
}

start();
