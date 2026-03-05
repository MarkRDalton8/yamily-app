# Review Yamily Codebase Before AWS Deployment

Before doing anything, read these files in full:

**Backend:**
- backend/app/main.py
- backend/app/models.py
- backend/app/schemas.py
- backend/app/database.py
- backend/app/auth.py
- backend/requirements.txt (if exists)

**Frontend:**
- frontend/package.json
- frontend/app/layout.js
- frontend/app/page.js
- frontend/app/components/Navbar.js
- frontend/app/login/page.js
- frontend/app/register/page.js
- frontend/app/events/page.js
- frontend/app/events/[id]/page.js
- frontend/app/events/[id]/review/page.js
- frontend/app/join/page.js
- frontend/app/my-events/page.js
- frontend/next.config.js (if exists)

## Context

Yamily is a full-stack review application for family gatherings. We built it locally and it's working, but before deploying to AWS, we want to:
1. Review all code for issues or inconsistencies
2. Verify both backend and frontend work locally
3. Identify any missing dependencies or configurations
4. Check for hardcoded localhost URLs that need to change for production
5. Ensure database migrations/schema are clean

## Task

Perform a comprehensive code review and verification:

### 1. Backend Review

**Check for:**
- Are all imports correct?
- Is CORS configured properly? (should allow localhost:3000 now, will need to add yamily.app later)
- Are all API endpoints consistent and working?
- Is the JWT secret hardcoded? (it is - note this for production)
- Are all Pydantic schemas complete and matching models?
- Are there any SQL injection vulnerabilities?
- Is error handling comprehensive?
- Are all database relationships properly defined?

**Test the backend:**
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Verify:
- Server starts without errors on port 8000
- Visit http://localhost:8000/docs - Swagger UI loads
- Health check works: curl http://localhost:8000/health

### 2. Frontend Review

**Check for:**
- Are all API calls pointing to the correct backend URL?
- Are there any hardcoded URLs that need environment variables?
- Is authentication flow complete? (login → store token → use token)
- Are all components importing correctly?
- Is Tailwind CSS configured properly?
- Are there any console errors or warnings?
- Do all pages have proper error handling?
- Are forms validated properly?

**Test the frontend:**
```bash
cd frontend
npm run dev
```

Verify:
- Server starts without errors on port 3000
- Visit http://localhost:3000 - homepage loads
- No console errors in browser
- Can navigate to all pages

### 3. Integration Testing

**Test the complete flow:**

1. **Registration:**
   - Go to http://localhost:3000/register
   - Register a new user
   - Should redirect to login
   - Check backend logs for successful user creation

2. **Login:**
   - Login with registered user
   - Should redirect to /events
   - Check that JWT token is stored in localStorage
   - Navbar should show user's name

3. **Create Event:**
   - Create a test event
   - Should receive invite code
   - Verify event appears in database

4. **Join Event:**
   - Join the event with invite code
   - Choose a pseudonym
   - Should see success message

5. **Submit Review:**
   - Go to event detail page
   - Submit a review with ratings
   - Add tags
   - Should save successfully

6. **View Reviews:**
   - View event detail page
   - Should see review with pseudonym (not real name)
   - Should see vote buttons

7. **Vote:**
   - Upvote the review
   - Should update count
   - Change to downvote
   - Should update count

### 4. Production Readiness Check

**Identify issues for deployment:**
- List all hardcoded localhost URLs
- Note which need to be environment variables
- Check if there's a .env.example or environment variable documentation
- Verify .gitignore excludes sensitive files (venv/, node_modules/, .env, yamily.db)
- Check for any TODO or FIXME comments
- Note any security concerns (hardcoded secrets, etc.)

### 5. Dependencies Check

**Backend:**
```bash
cd backend
source venv/bin/activate
pip freeze > requirements.txt
```

Verify all dependencies are listed.

**Frontend:**
```bash
cd frontend
npm list --depth=0
```

Verify package.json is complete.

## Files to NOT Modify

During this review, DO NOT modify:
- Any database files (yamily.db)
- Git configuration (.git/)
- Node modules or venv
- Any existing user data

## When Done, Provide:

### 1. Code Review Summary
- Overall code quality assessment
- Any bugs or issues found
- Security concerns
- Best practices violations

### 2. Local Testing Results
- Did backend start successfully? ✅/❌
- Did frontend start successfully? ✅/❌
- Did integration tests pass? ✅/❌
- Any errors in console/logs?

### 3. Production Readiness Report
- List of hardcoded URLs that need environment variables
- Missing configurations
- Security items to address (JWT secret, CORS for production)
- Recommended changes before AWS deployment

### 4. Fixes Applied (if any)
- What issues were fixed automatically
- What issues need manual intervention

### 5. Deployment Checklist
Create a checklist of items to address before/during AWS deployment:
- [ ] Environment variables to set
- [ ] CORS origins to update
- [ ] Secrets to rotate
- [ ] Database migration plan
- [ ] DNS configuration needed
- [ ] SSL certificate setup

## Verification

After review and any fixes:
```bash
# Backend should start cleanly
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
# No errors, port 8000 listening

# Frontend should start cleanly  
cd frontend
npm run dev
# No errors, port 3000 listening

# Full user flow should work end-to-end
# (Register → Login → Create Event → Join → Review → Vote)
```

## Expected Outcome

By the end of this review, we should have:
1. ✅ Confirmed all code is working locally
2. ✅ Identified any issues that need fixing
3. ✅ Clear list of production changes needed
4. ✅ Confidence to proceed with AWS deployment