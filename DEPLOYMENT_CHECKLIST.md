# Production Deployment Checklist

## ✅ Code Pushed to GitHub
- Commit: `26bdd11`
- Branch: `main`
- All changes committed and pushed

---

## 🚀 Deployment Steps

### 1. Backend Deployment (EC2)

**SSH into EC2:**
```bash
ssh your-ec2-user@your-ec2-ip
```

**Pull latest code:**
```bash
cd /path/to/yamily
git pull origin main
```

**Restart backend:**
```bash
# Stop current process
pkill -f "uvicorn app.main:app"

# Start with updated code
cd backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

---

### 2. Database Migration (EC2)

**Run these SQL commands:**
```bash
sqlite3 yamily.db
```

```sql
-- Add timestamp columns to events table
ALTER TABLE events ADD COLUMN started_at DATETIME;
ALTER TABLE events ADD COLUMN ended_at DATETIME;

-- Verify columns were added
PRAGMA table_info(events);

-- Exit
.quit
```

**Verify migration:**
```bash
sqlite3 yamily.db "SELECT started_at, ended_at FROM events LIMIT 1;"
```

---

### 3. Setup AI Cron Job (EC2)

**Copy setup script from repo and run:**
```bash
cd /path/to/yamily
chmod +x setup-ai-cron.sh
./setup-ai-cron.sh
```

**Verify cron job was added:**
```bash
crontab -l
```

You should see:
```
*/10 * * * * curl -X POST http://localhost:8000/admin/process-ai-guests > /dev/null 2>&1
```

**Test it manually:**
```bash
curl -X POST http://localhost:8000/admin/process-ai-guests
```

---

### 4. Frontend Deployment (Vercel)

Vercel should auto-deploy from GitHub, but verify:

**Check Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Find your yamily project
3. Check if latest commit is deploying
4. Wait for deployment to complete

**Manual deploy (if needed):**
```bash
cd frontend
vercel --prod
```

**Verify deployment:**
- Visit https://yamily.app (or your domain)
- Check browser console for polling logs
- Create a test event and verify AI comments appear

---

## 🧪 Post-Deployment Testing

### Test 1: Admin Dashboard
1. Go to https://yamily.app/admin/events
2. Verify you see:
   - Host names and emails
   - AI guest counts
   - Event durations
   - Delete buttons

### Test 2: AI Personas
1. Create new event with AI guests
2. Invite: Karen, Conspiracy Carl, Gen Z, etc.
3. Start event (set to live)
4. Wait 5-10 minutes
5. Check Feed tab for AI comments
6. Verify personas have:
   - Karen: Varied openings, diverse critiques
   - Conspiracy Carl: Conspiracy theory references

### Test 3: Frontend Polling
1. Open live event page
2. Open browser console (F12)
3. Watch for polling logs every 5 minutes
4. Verify comments auto-refresh

### Test 4: Cron Job
1. SSH into EC2
2. Check logs:
   ```bash
   tail -f /var/log/syslog | grep CRON
   ```
3. Wait 10 minutes for cron to run
4. Verify AI comments appear in live events

---

## 🔍 Troubleshooting

### Backend Issues

**Check if backend is running:**
```bash
curl http://localhost:8000/docs
```

**Check backend logs:**
```bash
tail -f backend/backend.log
```

**Restart backend:**
```bash
pkill -f uvicorn
cd backend && source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
```

### Database Issues

**Check if migration ran:**
```bash
sqlite3 yamily.db "PRAGMA table_info(events);"
```

Should show `started_at` and `ended_at` columns.

### Cron Job Issues

**Check if cron is running:**
```bash
systemctl status cron
```

**View cron logs:**
```bash
grep CRON /var/log/syslog | tail -20
```

**Test endpoint manually:**
```bash
curl -X POST http://localhost:8000/admin/process-ai-guests
```

### Frontend Issues

**Check Vercel deployment status:**
```bash
vercel ls
```

**View deployment logs:**
- Go to Vercel dashboard
- Click on deployment
- Check build and function logs

---

## ✅ Success Criteria

- [ ] Backend restarted on EC2
- [ ] Database migration complete (started_at, ended_at columns exist)
- [ ] Cron job running (check with `crontab -l`)
- [ ] Frontend deployed to Vercel
- [ ] Admin dashboard shows new fields
- [ ] AI personas post varied content (Karen, Conspiracy Carl)
- [ ] Frontend polling works (check console logs)
- [ ] AI comments appear within 5-10 minutes during live events

---

## 📝 Notes

- Frontend polling: Works immediately, no setup needed
- Cron job: Runs every 10 minutes as backup
- Database: SQLite on EC2 (consider PostgreSQL for scale)
- AI comments: Only generated for events with status = "live"

---

## 🆘 Need Help?

If something isn't working:
1. Check backend logs: `tail -f backend/backend.log`
2. Test AI endpoint: `curl -X POST http://localhost:8000/admin/process-ai-guests`
3. Check cron: `crontab -l` and `grep CRON /var/log/syslog`
4. Verify database migration: `sqlite3 yamily.db "PRAGMA table_info(events);"`

Questions? Refer to AI_CRON_SETUP.md for detailed troubleshooting.
