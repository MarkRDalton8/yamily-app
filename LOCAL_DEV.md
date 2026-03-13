# Yamily Local Development

Quick guide to running Yamily locally for development.

## Prerequisites

- Python 3.8+ with venv
- Node.js 18+
- Git

## First Time Setup

### 1. Clone and Navigate
```bash
cd /Users/markdalton/code/yamily
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Database Setup
The SQLite database will be created automatically on first run.

## Running the Servers

### Easy Way (Recommended)
```bash
./start-local.sh
```

This single command:
- ✅ Starts both backend and frontend
- ✅ Shows combined logs from both servers
- ✅ Automatically cleans up on Ctrl+C

**Access the app at:** http://localhost:3000

### Manual Way

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Stopping the Servers

If using `start-local.sh`, just press **Ctrl+C**

If you need to manually stop lingering processes:
```bash
./stop-local.sh
```

## Important URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs (Interactive Swagger UI)
- **Health Check:** http://localhost:8000/health

## Database Management

### Reset Database (Delete all data)
```bash
cd backend
rm yamily.db
# Database will recreate on next server start
```

### View Database
```bash
cd backend
sqlite3 yamily.db
# Then use SQL commands like:
# .tables
# SELECT * FROM users;
# .quit
```

## Log Files

When using `start-local.sh`, logs are saved to:
- `backend/backend.log`
- `frontend/frontend.log`

## Development Workflow

1. Start servers: `./start-local.sh`
2. Make code changes (servers auto-reload)
3. Test in browser at http://localhost:3000
4. Stop servers: Ctrl+C

## Troubleshooting

### "Port already in use"
```bash
./stop-local.sh
./start-local.sh
```

### "Backend won't start"
Check `backend/backend.log` for errors

### "Frontend won't start"
Check `frontend/frontend.log` for errors

### "Database schema changed"
Delete the database and restart:
```bash
cd backend
rm yamily.db
cd ..
./start-local.sh
```

## Environment Variables

Backend uses `.env` file in `backend/` directory:
```env
DATABASE_URL=sqlite:///./yamily.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,https://yamily.app
```

Frontend automatically uses `http://localhost:8000` for the API when running locally.

## Testing the Event Lifecycle Feature

1. Register as a user
2. Upgrade to host (if needed)
3. Create an event
4. Click "Start Event" (host only)
5. Live Feed becomes available
6. Click "End Event" (host only)
7. Reviews become available

## Next Steps

Ready to deploy? See the main repository README for deployment instructions.
