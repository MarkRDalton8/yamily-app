#!/bin/bash
# Quick test script for AI persona feature

API_URL="http://32.192.255.113:8000"
TOKEN="" # You'll need to fill this in

echo "=========================================="
echo "AI Persona Invite Feature - Quick Test"
echo "=========================================="
echo ""

# Step 1: Check if AI guests exist
echo "1. Checking for AI guests in database..."
ssh -i ~/.ssh/yamily-ec2-key.pem ubuntu@32.192.255.113 \
  "cd yamily-app/backend && sqlite3 yamily.db 'SELECT COUNT(*) FROM event_ai_guests;'" || echo "Table doesn't exist yet"
echo ""

# Step 2: Show how to create event with AI persona via API
echo "2. To test via API (copy this curl command):"
echo ""
echo "curl -X POST $API_URL/events \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "  -d '{"
echo "    \"title\": \"Test Event with AI Guest\","
echo "    \"description\": \"Testing AI persona invites\","
echo "    \"event_date\": \"2026-03-16T20:00:00\","
echo "    \"ai_guests\": ["
echo "      {"
echo "        \"ai_persona_type\": \"karen\","
echo "        \"ai_persona_name\": \"Aunt Karen\""
echo "      }"
echo "    ]"
echo "  }'"
echo ""

# Step 3: Manual trigger of background job
echo "3. To manually trigger AI comment generation (run after creating event):"
echo ""
echo "curl -X POST $API_URL/admin/process-ai-guests"
echo ""

echo "=========================================="
echo "Or use the UI at https://yamily-app.vercel.app/events"
echo "=========================================="
