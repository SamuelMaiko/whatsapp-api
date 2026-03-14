# WAMANAGE: WhatsApp Automation Platform

WAMANAGE is a robust, multi-service WhatsApp automation monorepo designed for developers. It allows you to manage multiple WhatsApp sessions, scan QR codes via a web dashboard, and interact with the WhatsApp API using standard REST endpoints and Webhooks.

---

## 🏗️ Repository Architecture

This project is structured as a collection of independent services:

-   **`backend`**: The primary entry point.
    -   **Django & DRF**: Modern Python backend replaces the old Node service.
    -   **Web Dashboard**: Django templates with interactive JS.
    -   **Developer Documentation**: Integrated portal for API usage.
-   **`services/worker`**: The technical core.
    -   **Connection Management**: Maintains WhatsApp socket connections.
    -   **Local Architecture**: Contains its own Sequelize models and database config.
    -   **Media Handling**: Downloads and hosts incoming images.
-   **`services/webhook-tester`**: Lightweight utility for debugging webhooks.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **Python 3.11+**
- **PostgreSQL** database

### 2. Installation
Clone the repository and install dependencies for the services you need:

**API Service (Django)**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Worker Service (Node.js)**
```bash
cd services/worker
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory (or individual service directories if preferred). The following variables are required:

```env
# Database Configuration
DB_NAME=whatsapp_api
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Security
JWT_SECRET=your_super_secret_jwt_key

# Service URLs
WORKER_URL=http://localhost:4000
API_URL=http://localhost:3000
```

### 4. Database Setup
Ensure you have created the database specified in `DB_NAME`. The services will automatically synchronize the tables on startup.

### 5. Running the Application
You need to run both the **API** and the **Worker** for the platform to function. Open two terminal tabs:

**Tab 1: API Service (Port 3000)**
```bash
cd services/api
npm start
```

**Tab 2: Worker Service (Port 4000)**
```bash
cd services/worker
npm start
```

---

## 🛠️ Usage Flow

1.  **Register/Login**: Access the dashboard at `http://localhost:3000`.
2.  **Create Session**: Click "Add Session" to generate a new instance.
3.  **Scan QR**: Wait for the QR code to appear and scan it with your WhatsApp mobile app.
4.  **Get API Key**: Once connected, click "Show" on the API Key section.
5.  **Setup Webhooks**: Input your destination URL in the Webhook field and click **Save**.
6.  **Start Automating**: Use the **Documentation** tab in the dashboard for interactive code examples and CURL commands.

---

## 🧪 Testing Webhooks
If you want to test incoming messages locally, we have included a tester service:
```bash
node services/webhook-tester/index.js
```
Then set your session webhook to `http://localhost:5000/webhook` in the dashboard.

---

## 📜 Key Features
- ✅ Multi-session support.
- ✅ QR Code generation and real-time status updates.
- ✅ Bearer Token authentication for developer APIs.
- ✅ Automatic image downloading for incoming messages.
- ✅ Forwarded and View-Once message support.
- ✅ Beautifully formatted Markdown/JSON documentation portal.