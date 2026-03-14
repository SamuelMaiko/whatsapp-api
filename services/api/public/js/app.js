const API_URL = '/api';
const BASE_URL = window.location.origin;
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));
let isLogin = true;

const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const sessionsView = document.getElementById('sessions-view');
const docsView = document.getElementById('docs-view');
const authForm = document.getElementById('auth-form');
const toggleAuth = document.getElementById('toggle-auth');
const sessionsContainer = document.getElementById('sessions-container');
const addSessionBtn = document.getElementById('add-session-btn');
const logoutBtn = document.getElementById('logout-btn');

// Nav Elements
const navSessions = document.getElementById('nav-sessions');
const navDocs = document.getElementById('nav-docs');
const docsSubmenu = document.getElementById('docs-submenu');
const docsContent = document.getElementById('docs-content');

// Initialize
if (token) {
    showDashboard();
}

// Auth Toggle
toggleAuth.addEventListener('click', () => {
    isLogin = !isLogin;
    document.getElementById('auth-title').innerText = isLogin ? 'Welcome Back' : 'Create Account';
    document.getElementById('auth-btn').innerText = isLogin ? 'Sign In' : 'Sign Up';
    document.getElementById('name-group').style.display = isLogin ? 'none' : 'block';
    toggleAuth.innerText = isLogin ? 'Create an account' : 'Already have an account?';
});

// Navigation Handling
navSessions.addEventListener('click', () => {
    setActiveNav(navSessions);
    sessionsView.style.display = 'block';
    docsView.style.display = 'none';
    docsSubmenu.style.display = 'none';
});

navDocs.addEventListener('click', () => {
    setActiveNav(navDocs);
    sessionsView.style.display = 'none';
    docsView.style.display = 'block';
    docsSubmenu.style.display = 'block';
    renderDocs('getting-started');
});

document.querySelectorAll('.sub-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        document.querySelectorAll('.sub-nav-item').forEach(el => el.classList.remove('active'));
        e.target.classList.add('active');
        renderDocs(e.target.dataset.doc);
    });
});

function setActiveNav(el) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
}

// Auth Submit
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;

    const endpoint = isLogin ? '/login' : '/register';
    const body = isLogin ? { email, password } : { email, password, name };

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.success) {
            if (isLogin) {
                token = data.token;
                user = data.user;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                showDashboard();
            } else {
                alert('Account created! Please login.');
                isLogin = true;
                toggleAuth.click();
            }
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
    }
});

function showDashboard() {
    authView.style.display = 'none';
    dashboardView.style.display = 'flex';
    loadSessions();
}

async function loadSessions() {
    try {
        const res = await fetch(`${API_URL}/sessions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            renderSessions(data.sessions);
        } else if (data.error && data.error.includes('authenticate')) {
            logout();
        }
    } catch (err) {
        console.error(err);
    }
}

function renderSessions(sessions) {
    sessionsContainer.innerHTML = '';
    sessions.forEach(session => {
        const card = document.createElement('div');
        card.className = 'session-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <h3 style="font-size: 1rem;">${session.id}</h3>
                <span class="status-badge status-${session.status.toLowerCase()}">${session.status}</span>
            </div>
            
            ${session.status === 'CONNECTED' ? `
            <div class="form-group">
                <label style="font-size: 0.75rem; color: var(--text-muted);">Session API Key (External Access)</label>
                <div style="display: flex; gap: 0.5rem; align-items: center; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem;">
                    <code id="apikey-${session.id}" style="font-family: monospace; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1;">••••••••••••••••••••••••••••••••</code>
                    <button class="btn" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.7rem;" onclick="toggleApiKey('${session.id}', '${session.apiKey}')">Show</button>
                    <button class="btn" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.7rem;" onclick="copyApiKey('${session.apiKey}')">Copy</button>
                </div>
            </div>
            ` : ''}

            <div class="form-group">
                <label style="font-size: 0.75rem;">Webhook URL</label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" value="${session.webhookUrl || ''}" placeholder="https://api.yourcom.com/webhook" style="padding: 0.5rem; font-size: 0.75rem;" id="webhook-${session.id}">
                    <button class="btn" style="width: auto; padding: 0.5rem;" onclick="updateWebhook('${session.id}')">Save</button>
                </div>
            </div>

            ${session.status === 'QR' && session.qr ? `
                <div class="qr-container">
                    <p style="font-size: 0.75rem; margin-bottom: 0.5rem;">Scan QR code</p>
                    <canvas id="qr-${session.id}" class="qr-code"></canvas>
                </div>
            ` : ''}

            <div style="margin-top: 1.5rem; display: flex; gap: 0.5rem;">
                <button class="btn btn-secondary" style="margin: 0; padding: 0.5rem; color: var(--danger); border-color: var(--danger);" onclick="deleteSession('${session.id}')">Delete</button>
            </div>
        `;
        sessionsContainer.appendChild(card);

        if (session.status === 'QR' && session.qr) {
            QRCode.toCanvas(document.getElementById(`qr-${session.id}`), session.qr);
        }
    });
}

function renderDocs(section) {
    let content = '';
    switch (section) {
        case 'getting-started':
            content = `
                <div class="docs-section">
                    <h1>Getting Started</h1>
                    <p style="margin-top: 1rem; color: var(--text-muted); line-height: 1.6;">
                        Welcome to WAMANAGE API. To start automating your WhatsApp, follow these three steps:
                    </p>
                    
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 0.5rem;">1. Create a Session</h3>
                        <p>Go to the Sessions tab and create a new instance. Wait for the QR code to appear.</p>
                        
                        <h3 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">2. Scan & Connect</h3>
                        <p>Scan the QR code with your phone. Once the status turns <span class="status-badge status-connected">CONNECTED</span>, your API Key will be revealed.</p>

                        <h3 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">3. Use the Base URL</h3>
                        <p>All API requests should be sent to your instance domain:</p>
                        <div class="code-block">${BASE_URL}/api</div>
                    </div>
                </div>
            `;
            break;
        case 'send-message':
            content = `
                <div class="docs-section">
                    <h1>Send Private Message</h1>
                    <p style="margin-bottom: 1.5rem;">Send simple text messages to any WhatsApp number.</p>
                    
                    <div class="endpoint-badge">
                        <span class="method-post">POST</span> /api/send-message
                    </div>

                    <h3>Authentication</h3>
                    <p>Required in Header:</p>
                    <div class="code-block">x-api-key: YOUR_SESSION_API_KEY</div>

                    <h3 class="code-title">REQUEST BODY</h3>
                    <div class="code-block">{
  "to": "2547XXXXXXXX",
  "message": "Hello from the API!"
}</div>

                    <h3 class="code-title">CURL EXAMPLE</h3>
                    <div class="code-block">curl -X POST ${BASE_URL}/api/send-message \\
  -H "x-api-key: your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"to": "254700000000", "message": "Hi there!"}'</div>
                </div>
            `;
            break;
        case 'send-image':
            content = `
                <div class="docs-section">
                    <h1>Send Image Message</h1>
                    <p style="margin-bottom: 1.5rem;">Send images with captions using a public URL.</p>
                    
                    <div class="endpoint-badge">
                        <span class="method-post">POST</span> /api/send-image
                    </div>

                    <h3 class="code-title">REQUEST BODY</h3>
                    <div class="code-block">{
  "to": "2547XXXXXXXX",
  "url": "https://example.com/image.jpg",
  "caption": "Check this out!"
}</div>
                    <table class="params-table">
                        <thead>
                            <tr><th>Field</th><th>Type</th><th>Description</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>to</td><td>String</td><td>Phonenumber with country code</td></tr>
                            <tr><td>url</td><td>String</td><td>Direct link to image (jpg/png)</td></tr>
                            <tr><td>caption</td><td>String</td><td>Text to show below image</td></tr>
                        </tbody>
                    </table>
                </div>
            `;
            break;
        case 'webhooks':
            content = `
                <div class="docs-section">
                    <h1>Webhooks</h1>
                    <p style="line-height: 1.6;">Configure a Webhook URL to receive incoming messages in real-time. We will send a POST request to your URL whenever a message is received.</p>
                    
                    <h3 class="code-title">PAYLOAD STRUCTURE</h3>
                    <div class="code-block">{
  "sessionId": "sess_123...",
  "phoneNumber": "2547XXXXXXXX",
  "pushName": "John Doe",
  "text": "Hello!",
  "raw": { ... }
}</div>
                </div>
            `;
            break;
    }
    docsContent.innerHTML = content;
}

// UI Helpers
window.toggleApiKey = (id, key) => {
    const el = document.getElementById(`apikey-${id}`);
    const isHidden = el.innerText.includes('•');
    el.innerText = isHidden ? key : '••••••••••••••••••••••••••••••••';
    event.target.innerText = isHidden ? 'Hide' : 'Show';
};

window.copyApiKey = (key) => {
    navigator.clipboard.writeText(key);
    alert('API Key copied to clipboard!');
};

addSessionBtn.addEventListener('click', async () => {
    try {
        const res = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        if (data.success) {
            loadSessions();
        }
    } catch (err) {
        console.error(err);
    }
});

async function updateWebhook(sessionId) {
    const url = document.getElementById(`webhook-${sessionId}`).value;
    try {
        const res = await fetch(`${API_URL}/sessions/webhook`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sessionId, webhookUrl: url })
        });
        const data = await res.json();
        if (data.success) alert('Webhook updated!');
    } catch (err) {
        console.error(err);
    }
}

async function deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
        const res = await fetch(`${API_URL}/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) loadSessions();
    } catch (err) {
        console.error(err);
    }
}

// Auto-refresh sessions every 5 seconds to get status/QR updates
setInterval(() => {
    if (token && sessionsView.style.display !== 'none') loadSessions();
}, 5000);

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

logoutBtn.addEventListener('click', logout);
