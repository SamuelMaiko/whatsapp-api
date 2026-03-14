const sessionManager = require("../core/SessionManager");

class WhatsAppService {
    async sendMessage(sessionId, to, message) {
        const instance = sessionManager.getInstance(sessionId);
        if (!instance) throw new Error("Session not found or not initialized");
        return await instance.sendMessage(to, message);
    }

    async sendImage(sessionId, to, imageUrl, caption) {
        const instance = sessionManager.getInstance(sessionId);
        if (!instance) throw new Error("Session not found or not initialized");
        return await instance.sendImage(to, imageUrl, caption);
    }
}

module.exports = new WhatsAppService();
