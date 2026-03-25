# Hi ALL - Real-Time Chat & Video Calling Application

A full-stack, offline-capable application featuring enterprise-level real-time chat, dynamic group messaging, and WebRTC video/audio calling.

## 🚀 Features
- **User Authentication**: Secure Signup, Login, and Session management using JWT Access & Refresh Tokens.
- **Offline-First PWA Support**: All messages and group structures are aggressively cached directly to browser hardware using IndexedDB (`Dexie`), allowing instant loads and seamless network disruption handling.
- **Real-Time WebSockets**: 
  - Sub-millisecond 1-on-1 and Group messaging.
  - Active read receipts, online indicators, and immediate push synchronization.
  - System dynamic broadcasts (e.g., "*Admin removed John from the group*").
- **Group Management Engine**: Group creation, Admin control schemas, dynamic member rendering and robust local-state purging.
- **Video & Audio Calling**: Integrated Peer-to-Peer encrypted communication pipelines utilizing pure WebRTC signaling.
- **User Search & Contacts**: Find users dynamically by registered email addressing.

## 🛠️ Tech Stack
- **Frontend**: 
  - **Framework**: React.js powered by Vite
  - **UI / Styling**: Material-UI (MUI), Lucide-React
  - **Database**: IndexedDB (via `dexie` wrapper)
  - **Connectivity**: Axios, Native JavaScript WebSockets
- **Backend**:
  - **Framework**: FastAPI (Asynchronous Python App Environment)
  - **Database & ORM**: MySQL executed natively over raw TCP via `aiomysql` and `SQLAlchemy v2` Async Sessions.
  - **Testing Infrastructure**: `pytest-asyncio` & `httpx` async clients
- **Build / Packaging**: `npm` (Frontend), `uv` (Ultra-fast Python Environment Manager)

---

## 📋 Prerequisites
Ensure you have the following frameworks globally installed on your system before proceeding:
- **Node.js**: v18+ & **npm**
- **Python**: v3.9 or newer
- **uv**: The rust-based python package installer. (`pip install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **MySQL Database Server** running locally or remotely.

---

## 🔧 Setup Instructions

### 1. Backend Environment Configurations
1. Navigate to the `backend` boundary directory.
   ```bash
   cd backend
   ```
2. Spawn and engage a new Python virtual environment utilizing `uv`.
   ```bash
   uv venv
   
   # Activate on Windows:
   .venv\Scripts\activate
   # Activate on Unix/Mac:
   source .venv/bin/activate
   ```
3. Inject the server requirements using UV's high-speed pipelines:
   ```bash
   
   uv sync
   ```
   *(Note: For test execution capabilities, you may optionally append `uv pip install pytest-asyncio httpx aiosqlite`)*
4. Environment Vaulting: Ensure you have an active `.env` file configuring your API secrets and MySQL connection parameters.
   ```env

   JWT_SECRET_KEY = YOUR_JWT_SECRET_KEY
   JWT_ALGORITHM = HS256
   JWT_ACCESS_TOKEN_TIME_MIN = 5
   JWT_REFRESH_TOKEN_TIME_DAY = 7

   EMAIL_VERIFICATION_TOKEN_TIME_HOUR = 1
   EMAIL_PASSWORD_RESET_TOKEN_TIME_HOUR = 2
   FRONTEND_URL = "http://localhost:5173"

   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=chat_database
   ```
5. Build your database tables using Alembic migrations:
   ```bash
   alembic upgrade head
   ```
6. Ignite the asynchronous WebSocket API Server:
   ```bash
   fastapi dev app/main.py
   ```
   *The backend will boot up locally at `http://localhost:8000`.*

### 📝 Database Migrations (Alembic Guide)
If you ever modify the Python database models (e.g. adding a new table or column), run these commands to synchronize the MySQL database schema:
1. Auto-generate the new migration script:
   ```bash
   alembic revision --autogenerate -m "describe_your_changes"
   ```
2. Apply the newly created migration to your database:
   ```bash
   alembic upgrade head
   ```

### 2. Frontend React Client Configurations
1. Execute a directory jump to the root `frontend` boundary.
   ```bash
   cd frontend
   ```
2. Retrieve the complete NPM package dependency branch:
   ```bash
   npm install
   ```
3. Secure your backend pointing variables inside `frontend/.env`
   ```env
   VITE_BACKEND_BASE_URL=http://localhost:8000
   ```
4. Run the dynamic React development suite:
   ```bash
   npm run dev
   ```
   *The Progressive Web App portal will become fully accessible at `http://localhost:5173`.*

---

## 📂 System Directory Structure

```text
chatApp/
├── backend/
│   ├── app/
│   │   ├── account/       # JWT Auth logic, User Pydantic schemas, routing.
│   │   ├── chat/          # WS Connection dispatchers, groups, real-time message pipelines.
│   │   ├── db/            # SQLAlchemy async metadata and MySQL TCP initializations.
│   │   └── main.py        # Central FastAPI mount point
│   ├── tests/             # Pytest Async suites validating isolated API triggers.
│   ├── .env               # Server Database environment tokens (Hidden)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable React UI forms, Modals, Call Overlays, Toolbars.
│   │   ├── context/       # Auth state injection tunnels.
│   │   ├── db/            # Offline-First Dexie databases mapping schemas.
│   │   ├── hooks/         # Client-Side socket processors / React State syncs.
│   │   ├── pages/         # High-level DOM mounting grids.
│   │   └── services/      # Hardened Axios HTTPS request definitions.
│   ├── .env               # Vite compilation targeting hooks (Hidden)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md              # Project Documentation Reference
```

## 🧪 Testing

- **Backend Pytest Harnesses**: Ensure your UV environment is active, then run tests over the isolated SQLite offline mock-database suite.
  ```bash
  cd backend
  pytest tests/
  ```
