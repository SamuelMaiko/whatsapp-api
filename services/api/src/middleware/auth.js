import User from '../../../../shared/models/User.js';

const auth = async (req, res, next) => {
    try {
        // Try getting API Key from Authorization header or x-api-key header
        const apiKey = req.header('x-api-key') || req.header('Authorization')?.replace('Bearer ', '');

        if (!apiKey) {
            return res.status(401).json({ error: 'Auth Error: No API Key provided' });
        }

        const user = await User.findOne({ where: { apiKey } });

        if (!user) {
            return res.status(401).json({ error: 'Auth Error: Invalid API Key' });
        }

        req.user = user;
        req.apiKey = apiKey;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

export default auth;
