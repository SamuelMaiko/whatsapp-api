import express from 'express';
const router = express.Router();
import * as authController from '../controllers/auth.controller.js';
import * as sessionController from '../controllers/session.controller.js';
import { auth, apiKeyAuth } from '../middleware/auth.js';
import whatsappService from '../services/whatsapp.service.js';

// Auth routes (No auth)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Session management (Web UI - Requires JWT)
router.post('/sessions', auth, sessionController.createSession);
router.get('/sessions', auth, sessionController.getSessions);
router.patch('/sessions/webhook', auth, sessionController.updateWebhook);
router.delete('/sessions/:sessionId', auth, sessionController.deleteSession);

// Messaging APIs (External devs - Requires API Key)
router.post('/send-message', apiKeyAuth, async (req, res) => {
    try {
        const { to, message } = req.body;
        // Middleware verified the API key and attached the session object to req.session
        const sessionId = req.session.id;

        const result = await whatsappService.sendMessage(sessionId, to, message);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/send-image', apiKeyAuth, async (req, res) => {
    try {
        const { to, url, caption } = req.body;
        const sessionId = req.session.id;

        const result = await whatsappService.sendImage(sessionId, to, url, caption);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
