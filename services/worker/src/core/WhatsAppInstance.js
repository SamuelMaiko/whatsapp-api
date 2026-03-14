import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";
import P from "pino";
import boom from "@hapi/boom";
const { Boom } = boom;
import path from "path";
import fs from "fs";
import axios from "axios";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WhatsAppInstance {
    constructor(sessionId, options = {}) {
        this.sessionId = sessionId;
        this.options = options;
        this.sock = null;
        this.status = 'INIT';
        this.sessionDir = path.join(__dirname, "../../../../sessions", sessionId);

        this.logger = P({ level: "info" }); // Increased log level for debugging
        this.onStatusChange = options.onStatusChange || (() => { });
    }

    async init() {
        try {
            console.log(`[${this.sessionId}] Initializing instance...`);
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);

            const { version } = await fetchLatestBaileysVersion();
            console.log(`[${this.sessionId}] Using Baileys version: ${version}`);

            this.sock = makeWASocket.default ? makeWASocket.default({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, this.logger),
                },
                printQRInTerminal: true, // Also print to terminal for debugging
                logger: this.logger,
            }) : makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, this.logger),
                },
                printQRInTerminal: true,
                logger: this.logger,
            });

            this.sock.ev.on("creds.update", saveCreds);

            this.sock.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect, qr } = update;
                console.log(`[${this.sessionId}] Connection Update:`, { connection, qr: !!qr });

                if (qr) {
                    this.status = 'QR';
                    await this.onStatusChange(this.sessionId, 'QR', { qr });
                }

                if (connection === "close") {
                    const statusCode = (lastDisconnect?.error instanceof Boom)
                        ? lastDisconnect.error.output.statusCode
                        : 0;

                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    console.log(`[${this.sessionId}] Connection closed. Status: ${statusCode}. Reconnect: ${shouldReconnect}`);

                    if (shouldReconnect) {
                        this.init();
                    } else {
                        this.status = 'DISCONNECTED';
                        await this.onStatusChange(this.sessionId, 'DISCONNECTED');
                        this.clearSession();
                    }
                } else if (connection === "open") {
                    this.status = 'CONNECTED';
                    await this.onStatusChange(this.sessionId, 'CONNECTED');
                    console.log(`✅ [${this.sessionId}] Connected`);
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

        } catch (error) {
            console.error(`❌ [${this.sessionId}] Init error:`, error);
        }

        return this.sock;
    }

    async handleIncomingMessage(msg) {
        const jid = msg.key.remoteJid;
        const senderJid = msg.key.remoteJidAlt || jid;
        const phoneNumber = senderJid.split("@")[0];
        const pushName = msg.pushName || "Unknown";

        // Unwrap the message if it's nested (Forwarded View-Once, Ephemeral, etc.)
        const getMessage = (m) => {
            if (!m) return null;
            if (m.viewOnceMessageV2) return m.viewOnceMessageV2.message;
            if (m.viewOnceMessage) return m.viewOnceMessage.message;
            if (m.ephemeralMessage) return m.ephemeralMessage.message;
            if (m.documentWithCaptionMessage) return m.documentWithCaptionMessage.message;
            return m;
        };

        const actualMessage = getMessage(msg.message);
        if (!actualMessage) return;

        const text = actualMessage.conversation ||
            actualMessage.extendedTextMessage?.text ||
            actualMessage.imageMessage?.caption ||
            actualMessage.videoMessage?.caption ||
            actualMessage.documentMessage?.caption ||
            "";

        let imageUrl = null;

        // Handle Image Messages
        if (actualMessage.imageMessage) {
            try {
                console.log(`[${this.sessionId}] Downloading media from ${pushName}...`);
                const { downloadMediaMessage } = await import('@whiskeysockets/baileys');
                const buffer = await downloadMediaMessage(
                    msg,
                    'buffer',
                    {},
                    {
                        logger: this.logger,
                        reuploadRequest: this.sock?.updateMediaMessage
                    }
                );

                const filename = `${this.sessionId}_${Date.now()}.jpg`;
                const mediaDir = path.join(__dirname, "../../public", "media");

                if (!fs.existsSync(mediaDir)) {
                    fs.mkdirSync(mediaDir, { recursive: true });
                }

                const filePath = path.join(mediaDir, filename);
                fs.writeFileSync(filePath, buffer);

                const host = process.env.BASE_URL || 'http://localhost:4000';
                imageUrl = `${host}/media/${filename}`;
                console.log(`[${this.sessionId}] Image saved: ${imageUrl}`);
            } catch (err) {
                console.error(`❌ [${this.sessionId}] Error downloading media:`, err.message);
            }
        }

        console.log(`📩 [${this.sessionId}] Message from ${pushName} (${phoneNumber}): ${text}`);

        if (this.options.webhookUrl) {
            try {
                await axios.post(this.options.webhookUrl, {
                    sessionId: this.sessionId,
                    phoneNumber,
                    pushName,
                    text,
                    imageUrl,
                    raw: msg
                });
            } catch (error) {
                console.error(`❌ [${this.sessionId}] Webhook error:`, error.message);
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
            try {
                await this.sock.logout();
            } catch (err) {
                console.error(`[${this.sessionId}] Logout error:`, err.message);
            }
            this.clearSession();
        }
    }
}

export default WhatsAppInstance;
