import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Main webhook endpoint
app.post('/webhook', (req, res) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n[${timestamp}] 📩 Received Webhook:`);
    console.log(JSON.stringify(req.body, null, 2));
    console.log('-------------------------------------------');

    res.status(200).json({ success: true, message: 'Webhook received' });
});

// Health check
app.get('/', (req, res) => {
    res.send('Webhook Tester is running! Set your session webhook to: http://localhost:5000/webhook');
});

app.listen(PORT, () => {
    console.log('\x1b[36m%s\x1b[0m', '-------------------------------------------');
    console.log('\x1b[32m%s\x1b[0m', `🚀 Webhook Tester running on http://localhost:${PORT}`);
    console.log('\x1b[33m%s\x1b[0m', `👉 Set your Webhook URL to: http://localhost:${PORT}/webhook`);
    console.log('\x1b[36m%s\x1b[0m', '-------------------------------------------');
});
