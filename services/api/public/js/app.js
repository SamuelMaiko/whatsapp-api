const API_URL = '/api';
let token = localStorage.getItem('token');
let user = JSON.parse(localStorage.getItem('user'));
let isLogin = true;

const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');
const authForm = document.getElementById('auth-form');
const toggleAuth = document.getElementById('toggle-auth');
const sessionsContainer = document.getElementById('sessions-container');
const addSessionBtn = document.getElementById('add-session-btn');
const logoutBtn = document.getElementById('logout-btn');

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
            
            <div class="form-group">
                <label style="font-size: 0.75rem; color: var(--text-muted);">Session API Key (External Access)</label>
                <div style="display: flex; gap: 0.5rem; align-items: center; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem;">
                    <code id="apikey-${session.id}" style="font-family: monospace; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1;">••••••••••••••••••••••••••••••••</code>
                    <button class="btn" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.7rem;" onclick="toggleApiKey('${session.id}', '${session.apiKey}')">Show</button>
                    <button class="btn" style="width: auto; padding: 0.25rem 0.5rem; font-size: 0.7rem;" onclick="copyApiKey('${session.apiKey}')">Copy</button>
                </div>
            </div>

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
    if (token) loadSessions();
}, 5000);

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
}

logoutBtn.addEventListener('click', logout);
