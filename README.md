# WAMANAGE: WhatsApp Automation Platform

WAMANAGE is a robust, multi-service WhatsApp automation monorepo designed for developers. It allows you to manage multiple WhatsApp sessions, scan QR codes via a web dashboard, and interact with the WhatsApp API using standard REST endpoints and Webhooks.

---

## 🏗️ Repository Architecture

This project is structured as a Node.js monorepo using **NPM Workspaces**:

-   **`services/api`**: The primary entry point.
    -   **Web Dashboard**: A modern, interactive interface for managing sessions.
    -   **Developer Documentation**: An integrated portal explaining how to use the API.
    -   **Authentication**: JWT-based auth for the dashboard and API Key auth for external developers.
-   **`services/worker`**: The technical core.
    -   **Connection Management**: Uses `@whiskeysockets/baileys` to maintain real-time WhatsApp socket connections.
    -   **Media Handling**: Automatically downloads incoming images and hosts them locally.
    -   **Webhook Dispatcher**: Forwards incoming messages (Text/Images) to registered URLs.
-   **`services/webhook-tester`**: A lightweight utility for developers to test and debug incoming webhooks.
-   **`shared/`**: Contains shared logic, including Sequelize models and database configurations used across all services.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **PostgreSQL** database
- **NPM** (v7+ for workspaces support)

### 2. Installation
Clone the repository and install all dependencies from the root directory:

```bash
git clone <your-repo-url>
cd WhatsappAPI
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