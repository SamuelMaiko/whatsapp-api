import User from '../../../../shared/models/User.js';

export const register = async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const user = await User.create({ email, password, name });
        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                apiKey: user.apiKey
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({
            success: true,
            apiKey: user.apiKey,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
