const WhatsAppInstance = require('./WhatsAppInstance');
const Session = require('../models/Session');

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
            await instance.logout();
            this.instances.delete(sessionId);
        }
        await Session.destroy({ where: { id: sessionId } });
    }
}

module.exports = new SessionManager();
