#!/bin/bash
# Yamily AI Persona Background Job Setup
# This script sets up a cron job to process AI guest comments every 10 minutes

echo "=========================================="
echo "Yamily AI Persona Cron Job Setup"
echo "=========================================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/docs > /dev/null 2>&1; then
    echo "⚠️  WARNING: Backend doesn't appear to be running on localhost:8000"
    echo "   The cron job will be added, but it won't work until the backend is running."
    echo ""
fi

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "process-ai-guests"; then
    echo "ℹ️  AI processing cron job already exists!"
    echo ""
    echo "Current cron jobs:"
    crontab -l | grep "process-ai-guests"
    echo ""
    read -p "Do you want to replace it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting without changes."
        exit 0
    fi

    # Remove existing AI cron job
    crontab -l 2>/dev/null | grep -v "process-ai-guests" | crontab -
fi

# Add new cron job to run every 10 minutes
(crontab -l 2>/dev/null; echo "*/10 * * * * curl -X POST http://localhost:8000/admin/process-ai-guests > /dev/null 2>&1") | crontab -

echo "✅ Cron job successfully added!"
echo ""
echo "Current cron configuration:"
crontab -l
echo ""
echo "=========================================="
echo "What this does:"
echo "=========================================="
echo "• Runs every 10 minutes"
echo "• Calls /admin/process-ai-guests endpoint"
echo "• Only processes AI guests for LIVE events"
echo "• Does nothing if no events are live"
echo ""
echo "✅ Setup complete! AI personas will now post"
echo "   comments automatically during live events."
echo ""
echo "To verify it's working:"
echo "1. Start a live event"
echo "2. Wait 10 minutes"
echo "3. Check the event feed for AI comments"
echo ""
echo "To remove the cron job later:"
echo "  crontab -l | grep -v process-ai-guests | crontab -"
echo ""
