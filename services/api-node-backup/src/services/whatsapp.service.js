import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const WORKER_URL = process.env.WORKER_URL || 'http://localhost:4000';

class WhatsAppService {
    async sendMessage(sessionId, to, message) {
        try {
            const res = await axios.post(`${WORKER_URL}/messaging/send-message`, {
                sessionId, to, message
            });
            return res.data;
        } catch (err) {
            console.error("Worker error:", err.response?.data || err.message);
            throw new Error(err.response?.data?.error || "Worker service unreachable");
        }
    }

    async sendImage(sessionId, to, imageUrl, caption) {
        try {
            const res = await axios.post(`${WORKER_URL}/messaging/send-image`, {
                sessionId, to, url: imageUrl, caption
            });
            return res.data;
        } catch (err) {
            console.error("Worker error:", err.response?.data || err.message);
            throw new Error(err.response?.data?.error || "Worker service unreachable");
        }
    }
}

export default new WhatsAppService();
