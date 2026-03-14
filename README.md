# WAMANAGE: WhatsApp Automation Platform

WAMANAGE is a robust, multi-service WhatsApp automation monorepo designed for developers. It allows you to manage multiple WhatsApp sessions, link devices via QR codes directly in a web dashboard, and interact with the WhatsApp API using standard REST endpoints and Webhooks.

---

## 🏗️ Repository Architecture

This project is structured as a collection of independent services focusing on high performance and developer experience:

- **`backend`**: The primary interaction layer.
    - **Django 5.0**: Powering the web interface and developer APIs.
    - **Modern Dashboard**: Built with Vanilla CSS and **HTMX** for a smooth, single-page application feel without the complexity of heavy JS frameworks.
    - **Sectional Documentation**: A dedicated portal providing separate routes for Authentication, Send Message (Text/Image), and Webhook integration.
- **`services/worker`**: The technical core.
    - **Baileys Library**: Maintains the WhatsApp socket connections and handles protocol logic.
    - **QR Generation**: Real-time QR code generation with automatic conversion to Data URLs for instant UI display.
    - **Session Persistence**: Efficiently manages multiple concurrent WhatsApp instances.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Python 3.11+**
- **SQLite** (Default) or PostgreSQL

### 2. Installation

**Backend (Django)**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
```

**Worker Service (Node.js)**
```bash
cd services/worker
npm install
```

### 3. Running the Application

**Tab 1: Backend (Port 8000)**
```bash
cd backend
python manage.py runserver
```

**Tab 2: Worker Service (Port 4000)**
```bash
cd services/worker
npm run dev
```

---

## 🛠️ Usage Flow

1.  **Authentication**: Access the dashboard at `http://localhost:8000`. Create an account or sign in.
2.  **Create Session**: Click **+ Add Session** to initialize a new WhatsApp engine instance.
3.  **Scan QR**: The session card will poll for status and display a QR code automatically. Scan it with your WhatsApp mobile app (Linked Devices).
4.  **API Integration**:
    -   Once status shows **CONNECTED**, your unique **API Key** becomes available.
    -   Configure your **Webhook URL** to receive real-time POST notifications for incoming messages.
5.  **Documentation**: Use the **Documentation** sidebar to access specific guides. Every code snippet includes a **COPY** button for rapid integration.

---

## 📜 Key Features

- ✅ **Multi-session Management**: Run and monitor multiple WhatsApp accounts simultaneously.
- ✅ **HTMX-Powered UI**: Lightning-fast, reactive dashboard with minimal client-side overhead.
- ✅ **Real-time Status Polling**: Automatic UI updates for connection states and QR codes.
- ✅ **Section-Based Documentation**: Clean, organized API routes with interactive copy functionality.
- ✅ **Webhook Support**: Receive incoming messages with session IDs and message metadata in JSON format.
- ✅ **Premium Aesthetics**: Professional dark/light mode UI with modern typography and animations.