import WhatsAppInstance from './WhatsAppInstance.js';
import Session from "../../models/Session.js";

class SessionManager {
    constructor() {
        this.instances = new Map();
    }

    async init() {
        // Load existing sessions from database and resume if they were connected
        const sessions = await Session.findAll();
        for (const session of sessions) {
            if (session.status !== 'DISCONNECTED') {
                await this.createSession(session.id, session.userId, {
                    webhookUrl: session.webhookUrl
                });
            }
        }
    }

    async createSession(sessionId, userId, options = {}) {
        if (this.instances.has(sessionId)) {
            return this.instances.get(sessionId);
        }

        const instance = new WhatsAppInstance(sessionId, {
            ...options,
            onStatusChange: async (sid, status, extra = {}) => {
                await Session.update({ status, ...extra }, { where: { id: sid } });
            }
        });

        this.instances.set(sessionId, instance);
        await instance.init();
        return instance;
    }

    getInstance(sessionId) {
        return this.instances.get(sessionId);
    }

    async deleteSession(sessionId) {
        const instance = this.instances.get(sessionId);
        if (instance) {
            try {
                await instance.logout();
            } catch (err) {
                console.error(`Logout failed for ${sessionId}:`, err.message);
                // Still delete from map to avoid zombie instances
            }
            this.instances.delete(sessionId);
        }
        // DB deletion is handled by the API service to ensure ownership verification
    }
}

export default new SessionManager();
