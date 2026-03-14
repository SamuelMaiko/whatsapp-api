const Session = require('../models/Session');
const sessionManager = require('../core/SessionManager');
const { v4: uuidv4 } = require('uuid');

exports.createSession = async (req, res) => {
    try {
        const sessionId = `sess_${Date.now()}`;
        const session = await Session.create({
            id: sessionId,
            userId: req.user.id,
            status: 'INIT'
        });

        // Start the instance
        await sessionManager.createSession(sessionId, req.user.id);

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

        // Update live instance if exists
        const instance = sessionManager.getInstance(sessionId);
        if (instance) {
            instance.options.webhookUrl = webhookUrl;
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        await sessionManager.deleteSession(sessionId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
