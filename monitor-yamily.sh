#!/bin/bash
# Yamily AWS Monitoring Script

SERVER_IP="32.192.255.113"
SSH_KEY="~/.ssh/yamily-ec2-key.pem"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║           Yamily AWS Monitoring                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Select an option:"
echo "1) Watch Backend Logs (real-time)"
echo "2) Watch Frontend Logs (real-time)"
echo "3) Watch Both Logs (split view)"
echo "4) Check Service Status"
echo "5) Restart Backend"
echo "6) Restart Frontend"
echo "7) Test Endpoints"
echo "8) SSH into Server"
echo ""
read -p "Enter choice [1-8]: " choice

case $choice in
  1)
    echo "=== Watching Backend Logs (Ctrl+C to exit) ==="
    ssh -i $SSH_KEY ubuntu@$SERVER_IP "sudo journalctl -u yamily-backend -f"
    ;;
  2)
    echo "=== Watching Frontend Logs (Ctrl+C to exit) ==="
    ssh -i $SSH_KEY ubuntu@$SERVER_IP "sudo journalctl -u yamily-frontend -f"
    ;;
  3)
    echo "=== Watching Both Logs ==="
    echo "Backend logs will show above, Frontend below"
    ssh -i $SSH_KEY ubuntu@$SERVER_IP "sudo journalctl -u yamily-backend -u yamily-frontend -f"
    ;;
  4)
    echo "=== Service Status ==="
    ssh -i $SSH_KEY ubuntu@$SERVER_IP << 'EOF'
    echo "Backend:"
    sudo systemctl status yamily-backend --no-pager | head -15
    echo ""
    echo "Frontend:"
    sudo systemctl status yamily-frontend --no-pager | head -15
EOF
    ;;
  5)
    echo "=== Restarting Backend ==="
    ssh -i $SSH_KEY ubuntu@$SERVER_IP "sudo systemctl restart yamily-backend && echo 'Backend restarted!'"
    ;;
  6)
    echo "=== Restarting Frontend ==="
    ssh -i $SSH_KEY ubuntu@$SERVER_IP "sudo systemctl restart yamily-frontend && echo 'Frontend restarted!'"
    ;;
  7)
    echo "=== Testing Endpoints ==="
    echo ""
    echo "Backend Health:"
    curl -s http://$SERVER_IP:8000/health | jq . || curl -s http://$SERVER_IP:8000/health
    echo ""
    echo "Frontend:"
    curl -s -I http://$SERVER_IP:3000 | head -5
    ;;
  8)
    echo "=== Connecting to Server ==="
    ssh -i $SSH_KEY ubuntu@$SERVER_IP
    ;;
  *)
    echo "Invalid choice"
    ;;
esac
