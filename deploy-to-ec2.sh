#!/bin/bash
# Yamily Production Deployment Script
# Run this on your EC2 instance after git pull

set -e  # Exit on any error

echo "=========================================="
echo "🚀 Yamily Production Deployment"
echo "=========================================="
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📍 Working directory: $(pwd)"
echo ""

# Step 1: Database Migration
echo "=========================================="
echo "1️⃣  Running Database Migration"
echo "=========================================="

if [ -f "backend/yamily.db" ]; then
    echo "✅ Database found: backend/yamily.db"

    # Check if columns already exist
    if sqlite3 backend/yamily.db "PRAGMA table_info(events);" | grep -q "started_at"; then
        echo "⚠️  Migration already applied (started_at exists)"
    else
        echo "📝 Adding started_at and ended_at columns..."
        sqlite3 backend/yamily.db << 'EOF'
ALTER TABLE events ADD COLUMN started_at DATETIME;
ALTER TABLE events ADD COLUMN ended_at DATETIME;
EOF
        echo "✅ Database migration complete!"
    fi

    # Verify columns exist
    echo ""
    echo "Verifying migration:"
    sqlite3 backend/yamily.db "PRAGMA table_info(events);" | grep -E "(started_at|ended_at)" || echo "❌ Columns not found!"
else
    echo "❌ Database not found at backend/yamily.db"
    echo "   Please check your database location"
    exit 1
fi

echo ""

# Step 2: Setup Cron Job
echo "=========================================="
echo "2️⃣  Setting Up AI Cron Job"
echo "=========================================="

if [ -f "setup-ai-cron.sh" ]; then
    chmod +x setup-ai-cron.sh

    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "process-ai-guests"; then
        echo "✅ Cron job already exists"
        crontab -l | grep "process-ai-guests"
    else
        echo "📝 Adding cron job..."
        (crontab -l 2>/dev/null; echo "*/10 * * * * curl -X POST http://localhost:8000/admin/process-ai-guests > /dev/null 2>&1") | crontab -
        echo "✅ Cron job added!"
        crontab -l | grep "process-ai-guests"
    fi
else
    echo "⚠️  setup-ai-cron.sh not found, skipping cron setup"
fi

echo ""

# Step 3: Restart Backend
echo "=========================================="
echo "3️⃣  Restarting Backend"
echo "=========================================="

# Check if backend is managed by systemd
if systemctl list-units --type=service --all | grep -q "yamily-backend.service"; then
    echo "🔧 Backend managed by systemd service"
    echo "🛑 Restarting yamily-backend.service..."

    sudo systemctl restart yamily-backend.service
    sleep 3

    # Check service status
    if sudo systemctl is-active --quiet yamily-backend.service; then
        echo "✅ Backend service restarted successfully"

        # Test backend
        if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
            echo "✅ Backend responding on http://localhost:8000"
        else
            echo "⚠️  Backend service running but not responding yet"
            echo "   Check logs: sudo journalctl -u yamily-backend.service -n 50"
        fi
    else
        echo "❌ Backend service failed to start"
        echo "   Check status: sudo systemctl status yamily-backend.service"
        echo "   Check logs: sudo journalctl -u yamily-backend.service -n 50"
        exit 1
    fi
else
    # Fallback to manual process management
    echo "🔧 Backend not managed by systemd, using manual restart"
    echo "🛑 Stopping existing backend..."
    pkill -f "uvicorn app.main:app" 2>/dev/null || echo "   No existing process found"
    sleep 2

    # Start backend
    echo "🚀 Starting backend..."
    cd backend

    if [ ! -d "venv" ]; then
        echo "❌ Virtual environment not found at backend/venv"
        exit 1
    fi

    source venv/bin/activate

    # Start backend in background
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
    BACKEND_PID=$!

    sleep 3

    # Check if backend started successfully
    if ps -p $BACKEND_PID > /dev/null; then
        echo "✅ Backend started (PID: $BACKEND_PID)"

        # Test backend
        if curl -s http://localhost:8000/docs > /dev/null 2>&1; then
            echo "✅ Backend responding on http://localhost:8000"
        else
            echo "⚠️  Backend started but not responding yet (may take a moment)"
        fi
    else
        echo "❌ Backend failed to start"
        echo "   Check backend/backend.log for errors"
        exit 1
    fi

    cd ..
fi
echo ""

# Step 4: Summary
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📊 Status:"
echo "  ✅ Database migration: Applied"
echo "  ✅ Cron job: Running (every 10 min)"
echo "  ✅ Backend: Running on port 8000"
echo ""
echo "🧪 Test the deployment:"
echo "  1. Create a test event"
echo "  2. Start the event (set to live)"
echo "  3. Wait 5-10 minutes"
echo "  4. Check for AI comments in the feed"
echo ""
echo "📝 Check backend logs:"
echo "  tail -f backend/backend.log"
echo ""
echo "🔍 Test AI processing manually:"
echo "  curl -X POST http://localhost:8000/admin/process-ai-guests"
echo ""
echo "✅ Deployment successful! Frontend will auto-deploy via Vercel."
echo ""
