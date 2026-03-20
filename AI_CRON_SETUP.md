# AI Persona Background Job Setup

## Overview

Yamily AI personas post live comments during events. This requires a background job to run periodically.

**Hybrid Approach (Implemented):**
- ✅ **Frontend Polling**: When viewing a live event, frontend polls every 5 minutes (immediate feedback)
- ✅ **Cron Job**: Server polls every 10 minutes (reliable, works even when page is closed)

---

## Frontend Polling (Already Implemented)

The event detail page now automatically:
- Polls `/admin/process-ai-guests` every 5 minutes when event status is "live"
- Refreshes comments automatically
- Stops polling when event ends or page is closed

**No action needed** - this works automatically in local development and production.

---

## EC2 Cron Job Setup

For production reliability, set up a cron job on your EC2 instance.

### Quick Setup

1. **Copy the setup script to your EC2 instance:**
   ```bash
   scp setup-ai-cron.sh your-ec2-user@your-ec2-ip:~/
   ```

2. **SSH into EC2 and run the script:**
   ```bash
   ssh your-ec2-user@your-ec2-ip
   cd ~
   chmod +x setup-ai-cron.sh
   ./setup-ai-cron.sh
   ```

3. **Verify it was added:**
   ```bash
   crontab -l
   ```

   You should see:
   ```
   */10 * * * * curl -X POST http://localhost:8000/admin/process-ai-guests > /dev/null 2>&1
   ```

### Manual Setup (Alternative)

If you prefer to set it up manually:

```bash
# Add cron job
(crontab -l 2>/dev/null; echo "*/10 * * * * curl -X POST http://localhost:8000/admin/process-ai-guests > /dev/null 2>&1") | crontab -

# Verify
crontab -l
```

---

## How It Works

### When Event Goes Live:
1. **Immediate (0s)**: Frontend triggers AI processing
2. **5 min**: Frontend polls again (if page is open)
3. **10 min**: Cron job runs (reliable backup)
4. **15 min**: Frontend polls
5. **20 min**: Cron job runs
6. **Continues every 5/10 min...**

### When No Events Are Live:
- Frontend: Does nothing (no live events to poll)
- Cron job: Runs but exits immediately (lightweight query)

### Endpoint Behavior:
The `/admin/process-ai-guests` endpoint:
- ✅ Only processes events with status = "live"
- ✅ Skips events that are "upcoming" or "ended"
- ✅ Very lightweight when no events are active
- ✅ Safe to call frequently

---

## Testing

### Test Frontend Polling (Local):
1. Start backend: `cd backend && ./venv/bin/uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Create an event with AI personas
4. Start the event (set status to "live")
5. Watch the browser console - you'll see polling every 5 minutes
6. AI comments appear automatically

### Test Cron Job (EC2):
1. SSH into EC2
2. Run: `crontab -l` to verify job exists
3. Create a live event
4. Wait 10 minutes
5. Check event feed for AI comments

### Verify Cron is Working:
```bash
# On EC2, check if cron job ran recently
grep "process-ai-guests" /var/log/syslog

# Or manually trigger it
curl -X POST http://localhost:8000/admin/process-ai-guests
```

---

## Troubleshooting

### No AI Comments Appearing

1. **Check event status:**
   - Event must have status = "live"
   - Check in admin dashboard or database

2. **Check if AI guests exist:**
   ```bash
   # View AI guests for event
   sqlite3 yamily.db "SELECT * FROM event_ai_guests WHERE event_id = YOUR_EVENT_ID;"
   ```

3. **Check scheduled times:**
   ```bash
   # Check when comments are scheduled
   sqlite3 yamily.db "SELECT ai_persona_name, text_comment_scheduled_time, has_text_commented FROM event_ai_guests WHERE event_id = YOUR_EVENT_ID;"
   ```

4. **Manually trigger processing:**
   ```bash
   curl -X POST http://localhost:8000/admin/process-ai-guests
   ```

### Cron Not Running

1. **Verify cron is installed:**
   ```bash
   which cron
   systemctl status cron
   ```

2. **Check cron logs:**
   ```bash
   grep CRON /var/log/syslog
   ```

3. **Test manually:**
   ```bash
   curl -X POST http://localhost:8000/admin/process-ai-guests
   ```

---

## Removing the Cron Job

If you need to remove the cron job:

```bash
crontab -l | grep -v process-ai-guests | crontab -
```

---

## Summary

✅ **Frontend polling**: Automatic, already working
✅ **EC2 cron job**: Run `setup-ai-cron.sh` on your EC2 instance
✅ **Testing**: Create a live event and wait 5-10 minutes
✅ **Monitoring**: Check `/admin/events` dashboard for live events

Questions? Check the troubleshooting section or backend logs.
