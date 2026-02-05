# ChatCop - Video Calling & Chat Application

A WhatsApp-like application featuring real-time chat, group messaging, and video calling.

## Features
- **User Authentication**: Signup, Login, Logout using JWT.
- **Real-time Chat**: One-on-one and Group messaging.
- **Video Calling**: Peer-to-Peer video calls using WebRTC.
- **User Search**: Find users by email.
- **Invites**: Send email invites to users not on the platform (Mock).
- **Responsive Design**: Premium UI built with React & TailwindCSS.

## Tech Stack
- **Frontend**: React (Vite), TailwindCSS
- **Backend**: FastAPI, SQLite, WebSockets
- **Database**: SQLite (local `chat.db`)

## Prerequisites
- Node.js & npm
- Python 3.8+

## Setup Instructions

### Backend
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create virtual environment (optional) and install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   Server runs at `http://localhost:8000`.

### Frontend
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173`.

## Testing
- **Backend Tests**: Run `pytest` in the `backend` directory.
- **Frontend Tests**: Run `npm test` in the `frontend` directory.

## Contributing
1. Fork the repo
2. Create a feature branch
3. Submit a PR
