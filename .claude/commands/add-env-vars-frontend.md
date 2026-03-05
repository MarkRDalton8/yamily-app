# Add Environment Variables to Frontend

Before writing any code, read these files in full:
- frontend/app/login/page.js
- frontend/app/register/page.js
- frontend/app/events/page.js
- frontend/app/events/[id]/page.js
- frontend/app/events/[id]/review/page.js
- frontend/app/join/page.js
- frontend/app/my-events/page.js

## Context

The frontend has hardcoded API URLs (`http://localhost:8000`) in 7 different files. These need to be replaced with an environment variable so the frontend can connect to the production backend when deployed to AWS.

## Task

Replace all hardcoded localhost:8000 URLs with a centralized environment variable.

## Implementation Steps

### Step 1: Create .env.local.example File

Create `frontend/.env.local.example`:
```
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 2: Create .env.local File

Create `frontend/.env.local` (copy from .env.local.example):
```
# Backend API URL - Development
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Step 3: Create API Configuration File (Optional but Clean)

Create `frontend/lib/api.js`:
```javascript
// Centralized API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
```

Create the lib directory if it doesn't exist:
```bash
mkdir -p frontend/lib
```

### Step 4: Update All Files with Hardcoded URLs

Replace `http://localhost:8000` with the API_URL constant in these files:

**File 1: frontend/app/login/page.js (line ~59)**

Add import at top:
```javascript
import { API_URL } from '../../lib/api'
```

Find and replace:
```javascript
// OLD
const response = await fetch('http://localhost:8000/login', {

// NEW
const response = await fetch(`${API_URL}/login`, {
```

**File 2: frontend/app/register/page.js (line ~22)**

Add import at top:
```javascript
import { API_URL } from '../lib/api'
```

Find and replace:
```javascript
// OLD
const response = await fetch('http://localhost:8000/register', {

// NEW
const response = await fetch(`${API_URL}/register`, {
```

**File 3: frontend/app/events/page.js (line ~55)**

Add import at top:
```javascript
import { API_URL } from '../lib/api'
```

Find and replace:
```javascript
// OLD
const response = await fetch('http://localhost:8000/events', {

// NEW
const response = await fetch(`${API_URL}/events`, {
```

**File 4: frontend/app/events/[id]/page.js (line ~44)**

Add import at top:
```javascript
import { API_URL } from '../../../lib/api'
```

Find and replace:
```javascript
// OLD
const response = await fetch(`http://localhost:8000/events/${eventId}/reviews`)

// NEW
const response = await fetch(`${API_URL}/events/${eventId}/reviews`)
```

And also update the vote function (around line ~63):
```javascript
// OLD
const response = await fetch(`http://localhost:8000/reviews/${reviewId}/vote`, {

// NEW
const response = await fetch(`${API_URL}/reviews/${reviewId}/vote`, {
```

**File 5: frontend/app/events/[id]/review/page.js (line ~83)**

Add import at top:
```javascript
import { API_URL } from '../../../lib/api'
```

Find and replace:
```javascript
// OLD
const response = await fetch(`http://localhost:8000/events/${eventId}/reviews`, {

// NEW
const response = await fetch(`${API_URL}/events/${eventId}/reviews`, {
```

**File 6: frontend/app/join/page.js (line ~54)**

Add import at top:
```javascript
import { API_URL } from '../lib/api'
```

Find and replace:
```javascript
// OLD
const response = await fetch('http://localhost:8000/events/join', {

// NEW
const response = await fetch(`${API_URL}/events/join`, {
```

**File 7: frontend/app/my-events/page.js (line ~44)**

Add import at top:
```javascript
import { API_URL } from '../lib/api'
```

Find and replace:
```javascript
// OLD
const response = await fetch('http://localhost:8000/users/me/events', {

// NEW
const response = await fetch(`${API_URL}/users/me/events`, {
```

### Step 5: Update .gitignore

Verify `frontend/.env.local` is in .gitignore. Add if not present:
```
# Frontend
frontend/.env.local
frontend/.env*.local
frontend/node_modules/
frontend/.next/
```

## Files to NOT Modify

- Backend files
- Other frontend files not listed above
- package.json
- next.config.js

## Verification

After making changes:
```bash
cd frontend

# Verify environment variable is loaded
npm run dev
# Open browser console and check: console.log(process.env.NEXT_PUBLIC_API_URL)
# Should show: http://localhost:8000

# Test registration
# Go to http://localhost:3000/register
# Register a new user
# Should work and redirect to login

# Test login
# Should work and redirect to /events

# Test creating event
# Should work and return invite code

# Check browser console for any errors
# Should see no CORS or network errors
```

## Expected Outcome

- ✅ All 7 files updated with API_URL
- ✅ .env.local.example created
- ✅ .env.local created and NOT committed to git
- ✅ lib/api.js created with centralized config
- ✅ Frontend connects to backend successfully
- ✅ All user flows work (register, login, create event, etc.)
- ✅ No hardcoded localhost:8000 URLs remain

## When Done, Report:

1. Confirmation that all 7 files were updated
2. List of files modified with import statements
3. Verification that frontend connects to backend
4. Any warnings or issues encountered
5. Confirmation that .env.local is NOT committed to git