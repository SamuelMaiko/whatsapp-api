const whatsappCore = require("../core/whatsapp");

class WhatsAppService {
    async sendMessage(to, message) {
        const sock = whatsappCore.getSocket();
        if (!sock) {
            throw new Error("WhatsApp socket not initialized");
        }

        // Format number: remove plus, add @s.whatsapp.net
        let formattedNumber = to.replace(/[^\d]/g, "");
        if (!formattedNumber.endsWith("@s.whatsapp.net")) {
            formattedNumber = `${formattedNumber}@s.whatsapp.net`;
        }

        const sentMsg = await sock.sendMessage(formattedNumber, { text: message });
        return sentMsg;
    }

    // Future: sendMedia, receiveMessage hooks, etc.
}

module.exports = new WhatsAppService();
