const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const P = require("pino");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");
const path = require("path");
const fs = require("fs");

class WhatsAppCore {
    constructor() {
        this.sock = null;
        this.state = null;
        this.saveCreds = null;
        this.sessionDir = path.join(__dirname, "../../sessions");
        this.logger = P({ level: "silent" });
    }

    async init() {
        const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);
        this.state = state;
        this.saveCreds = saveCreds;

        const { version, isLatest } = await fetchLatestBaileysVersion();
        console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

        this.sock = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, this.logger),
            },
            printQRInTerminal: false, // We'll handle it manually for better control
            logger: this.logger,
        });

        this.sock.ev.on("creds.update", saveCreds);

        this.sock.ev.on("connection.update", (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrcode.generate(qr, { small: true });
                console.log("Scan the QR code with WhatsApp");
            }

            if (connection === "close") {
                const shouldReconnect = (lastDisconnect.error instanceof Boom)
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true;

                console.log("Connection closed due to ", lastDisconnect.error, ", reconnecting ", shouldReconnect);

                if (shouldReconnect) {
                    this.init();
                } else {
                    console.log("Connection closed. You are logged out.");
                    // Optional: remove session directory
                    this.clearSession();
                }
            } else if (connection === "open") {
                console.log("✅ WhatsApp connection opened");
            }
        });

        return this.sock;
    }

    clearSession() {
        if (fs.existsSync(this.sessionDir)) {
            fs.rmSync(this.sessionDir, { recursive: true, force: true });
        }
    }

    getSocket() {
        return this.sock;
    }
}

module.exports = new WhatsAppCore();
