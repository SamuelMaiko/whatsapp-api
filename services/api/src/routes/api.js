import express from 'express';
const router = express.Router();
import * as authController from '../controllers/auth.controller.js';
import * as sessionController from '../controllers/session.controller.js';
import auth from '../middleware/auth.js';
import whatsappService from '../services/whatsapp.service.js';

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Session routes
router.post('/sessions', auth, sessionController.createSession);
router.get('/sessions', auth, sessionController.getSessions);
router.patch('/sessions/webhook', auth, sessionController.updateWebhook);
router.delete('/sessions/:sessionId', auth, sessionController.deleteSession);

// Messaging routes
router.post('/send-message', auth, async (req, res) => {
    try {
        const { sessionId, to, message } = req.body;
        const result = await whatsappService.sendMessage(sessionId, to, message);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/send-image', auth, async (req, res) => {
    try {
        const { sessionId, to, url, caption } = req.body;
        const result = await whatsappService.sendImage(sessionId, to, url, caption);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
