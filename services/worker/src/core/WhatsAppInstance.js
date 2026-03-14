import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";
import P from "pino";
import boom from "@hapi/boom";
const { Boom } = boom;
import qrcode from "qrcode-terminal";
import path from "path";
import fs from "fs";
import axios from "axios";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WhatsAppInstance {
    constructor(sessionId, options = {}) {
        this.sessionId = sessionId;
        this.options = options; // For webhookUrl, etc.
        this.sock = null;
        this.status = 'INIT';
        this.sessionDir = path.join(__dirname, "../../../sessions", sessionId);

        this.logger = P({ level: "silent" });
        this.onStatusChange = options.onStatusChange || (() => { });
    }

    async init() {
        const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);

        const { version, isLatest } = await fetchLatestBaileysVersion();

        this.sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, this.logger),
            },
            printQRInTerminal: false,
            logger: this.logger,
        });

        this.sock.ev.on("creds.update", saveCreds);

        this.sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.status = 'QR';
                this.onStatusChange(this.sessionId, 'QR', { qr });
            }

            if (connection === "close") {
                const shouldReconnect = (lastDisconnect.error instanceof Boom)
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true;

                if (shouldReconnect) {
                    this.init();
                } else {
                    this.status = 'DISCONNECTED';
                    this.onStatusChange(this.sessionId, 'DISCONNECTED');
                    this.clearSession();
                }
            } else if (connection === "open") {
                this.status = 'CONNECTED';
                this.onStatusChange(this.sessionId, 'CONNECTED');
                console.log(`✅ Session ${this.sessionId} connected`);
            }
        });

        this.sock.ev.on("messages.upsert", async (m) => {
            if (m.type === "notify") {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe) {
                        await this.handleIncomingMessage(msg);
                    }
                }
            }
        });

        return this.sock;
    }

    async handleIncomingMessage(msg) {
        const jid = msg.key.remoteJid;
        const senderJid = msg.key.remoteJidAlt || jid;
        const phoneNumber = senderJid.split("@")[0];
        const pushName = msg.pushName || "Unknown";

        const text = msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            "Non-text message";

        console.log(`📩 [${this.sessionId}] New message from ${pushName} (${phoneNumber}): ${text}`);

        if (this.options.webhookUrl) {
            try {
                await axios.post(this.options.webhookUrl, {
                    sessionId: this.sessionId,
                    phoneNumber,
                    pushName,
                    text,
                    raw: msg
                });
            } catch (error) {
                console.error(`❌ Webhook error for session ${this.sessionId}:`, error.message);
            }
        }
    }

    async sendMessage(to, message) {
        if (!this.sock) throw new Error("Socket not initialized");
        let formattedNumber = to.replace(/[^\d]/g, "");
        if (!formattedNumber.endsWith("@s.whatsapp.net")) {
            formattedNumber = `${formattedNumber}@s.whatsapp.net`;
        }
        return await this.sock.sendMessage(formattedNumber, { text: message });
    }

    async sendImage(to, imageUrl, caption) {
        if (!this.sock) throw new Error("Socket not initialized");
        let formattedNumber = to.replace(/[^\d]/g, "");
        if (!formattedNumber.endsWith("@s.whatsapp.net")) {
            formattedNumber = `${formattedNumber}@s.whatsapp.net`;
        }
        return await this.sock.sendMessage(formattedNumber, {
            image: { url: imageUrl },
            caption: caption
        });
    }

    clearSession() {
        if (fs.existsSync(this.sessionDir)) {
            fs.rmSync(this.sessionDir, { recursive: true, force: true });
        }
    }

    async logout() {
        if (this.sock) {
            await this.sock.logout();
            this.clearSession();
        }
    }
}

export default WhatsAppInstance;
