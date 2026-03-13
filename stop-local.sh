#!/bin/bash
# Stop Yamily Local Development Servers

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Yamily local servers...${NC}"

# Kill backend processes
BACKEND_PIDS=$(pgrep -f "uvicorn app.main:app")
if [ ! -z "$BACKEND_PIDS" ]; then
    echo "Stopping backend (PIDs: $BACKEND_PIDS)..."
    kill $BACKEND_PIDS 2>/dev/null
    echo -e "${GREEN}✓ Backend stopped${NC}"
else
    echo "No backend processes found"
fi

# Kill frontend processes (npm and next)
FRONTEND_PIDS=$(pgrep -f "next dev")
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "Stopping frontend (PIDs: $FRONTEND_PIDS)..."
    kill $FRONTEND_PIDS 2>/dev/null
    echo -e "${GREEN}✓ Frontend stopped${NC}"
else
    echo "No frontend processes found"
fi

# Also kill any node processes related to next
NODE_PIDS=$(pgrep -f "node.*next")
if [ ! -z "$NODE_PIDS" ]; then
    kill $NODE_PIDS 2>/dev/null
fi

echo -e "${GREEN}Done!${NC}"
