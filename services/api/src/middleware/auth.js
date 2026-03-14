import jwt from 'jsonwebtoken';
import User from '../../../../shared/models/User.js';
import Session from '../../../../shared/models/Session.js';

// Middleware for Dashboard (Web UI) using JWT
export const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new Error();

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret');
        const user = await User.findOne({ where: { id: decoded.id } });

        if (!user) throw new Error();

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate with a valid session.' });
    }
};

// Middleware for External Developers using Session API Key
export const apiKeyAuth = async (req, res, next) => {
    try {
        const apiKey = req.header('x-api-key') || req.header('Authorization')?.replace('Bearer ', '');

        if (!apiKey) {
            return res.status(401).json({ error: 'No API Key provided' });
        }

        // Find the session that this API key belongs to
        const session = await Session.findOne({ where: { apiKey } });

        if (!session) {
            return res.status(401).json({ error: 'Invalid API Key' });
        }

        // Attach session to request for use in controllers
        req.session = session;
        next();
    } catch (error) {
        res.status(401).json({ error: 'API Authentication failed' });
    }
};
