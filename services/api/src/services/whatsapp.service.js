const axios = require('axios');
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:4000';

class WhatsAppService {
    async sendMessage(sessionId, to, message) {
        const res = await axios.post(`${WORKER_URL}/messaging/send-message`, { 
            sessionId, to, message 
        });
        return res.data;
    }

    async sendImage(sessionId, to, imageUrl, caption) {
        const res = await axios.post(`${WORKER_URL}/messaging/send-image`, { 
            sessionId, to, url: imageUrl, caption 
        });
        return res.data;
    }
}

module.exports = new WhatsAppService();
