const whatsappCore = require("../core/whatsapp");

class WhatsAppService {
    async formatNumber(to) {
        let formattedNumber = to.replace(/[^\d]/g, "");
        if (!formattedNumber.endsWith("@s.whatsapp.net")) {
            formattedNumber = `${formattedNumber}@s.whatsapp.net`;
        }
        return formattedNumber;
    }

    async sendMessage(to, message) {
        const sock = whatsappCore.getSocket();
        if (!sock) throw new Error("WhatsApp socket not initialized");

        const jid = await this.formatNumber(to);
        return await sock.sendMessage(jid, { text: message });
    }

    async sendImage(to, imageUrl, caption) {
        const sock = whatsappCore.getSocket();
        if (!sock) throw new Error("WhatsApp socket not initialized");

        const jid = await this.formatNumber(to);
        return await sock.sendMessage(jid, {
            image: { url: imageUrl },
            caption: caption
        });
    }
}

module.exports = new WhatsAppService();
