const Session = require('../../../../shared/models/Session');
const axios = require('axios');
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:4000';

exports.createSession = async (req, res) => {
    try {
        const sessionId = `sess_${Date.now()}`;
        const session = await Session.create({
            id: sessionId,
            userId: req.user.id,
            status: 'INIT'
        });

        // Tell worker to start the instance
        try {
            await axios.post(`${WORKER_URL}/sessions/start`, { sessionId, userId: req.user.id });
        } catch (err) {
            console.error("Worker not reachable:", err.message);
            // We still return success as the DB record is created and worker will pick it up on next restart
        }

        res.status(201).json({ success: true, session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSessions = async (req, res) => {
    try {
        const sessions = await Session.findAll({ where: { userId: req.user.id } });
        res.json({ success: true, sessions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateWebhook = async (req, res) => {
    try {
        const { sessionId, webhookUrl } = req.body;
        await Session.update({ webhookUrl }, { where: { id: sessionId, userId: req.user.id } });

        // Tell worker to update live instance
        try {
            await axios.patch(`${WORKER_URL}/sessions/webhook`, { sessionId, webhookUrl });
        } catch (err) {
            console.error("Worker not reachable:", err.message);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        try {
            await axios.delete(`${WORKER_URL}/sessions/${sessionId}`);
        } catch (err) {
            console.error("Worker not reachable:", err.message);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
