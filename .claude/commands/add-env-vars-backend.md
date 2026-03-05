# Add Environment Variables to Backend

Before writing any code, read these files in full:
- backend/app/auth.py
- backend/app/main.py
- backend/app/database.py

## Context

The backend has hardcoded configuration values that need to be environment variables for production deployment to AWS. Specifically:
- JWT secret key (auth.py)
- CORS origins (main.py)
- Database URL (database.py)

## Task

Refactor all hardcoded configuration to use environment variables with sensible defaults for development.

## Implementation Steps

### Step 1: Create .env.example File

Create `backend/.env.example`:
```
# JWT Secret - Generate with: openssl rand -hex 32
JWT_SECRET_KEY=your-secret-key-change-this-in-production

# CORS - Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:3000

# Database URL
DATABASE_URL=sqlite:///./yamily.db

# Server Port (optional)
PORT=8000
```

### Step 2: Create .env File for Development

Create `backend/.env` (copy from .env.example):
```
JWT_SECRET_KEY=dev-secret-key-replace-in-production
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=sqlite:///./yamily.db
PORT=8000
```

### Step 3: Update auth.py

In `backend/app/auth.py`, replace the hardcoded SECRET_KEY:

**Current code (around line 20):**
```python
SECRET_KEY = "your-secret-key-change-this-in-production"
```

**Replace with:**
```python
import os

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable must be set")
```

Make sure the `import os` is at the top of the file with other imports.

### Step 4: Update main.py for CORS

In `backend/app/main.py`, replace the hardcoded CORS origins:

**Current code (around line 16):**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Replace with:**
```python
import os

# Get CORS origins from environment variable
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Make sure the `import os` is at the top of the file.

### Step 5: Update database.py

In `backend/app/database.py`, replace the hardcoded database URL:

**Current code (around line 6):**
```python
SQLALCHEMY_DATABASE_URL = "sqlite:///./yamily.db"
```

**Replace with:**
```python
import os

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./yamily.db")
```

Make sure the `import os` is at the top of the file.

### Step 6: Install python-dotenv (Optional but Recommended)

For local development, install python-dotenv to automatically load .env:
```bash
cd backend
source venv/bin/activate
pip install python-dotenv
```

Then update `backend/app/main.py` to load .env at startup (add at the very top):
```python
from dotenv import load_dotenv
load_dotenv()
```

Update requirements.txt:
```bash
pip freeze > requirements.txt
```

### Step 7: Update .gitignore

Verify `backend/.env` is in .gitignore. Add if not present:
```
# Backend
backend/.env
backend/venv/
backend/__pycache__/
backend/*.pyc
backend/yamily.db
```

## Files to NOT Modify

- backend/app/models.py
- backend/app/schemas.py
- Any database files
- Frontend files

## Verification

After making changes:
```bash
cd backend
source venv/bin/activate

# Verify .env is loaded (if using python-dotenv)
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('JWT_SECRET_KEY:', os.getenv('JWT_SECRET_KEY'))"
# Should print the key from .env

# Start server
uvicorn app.main:app --reload

# Test health endpoint
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"yamily-api"}

# Check server logs for any errors
# Should start without issues
```

## Expected Outcome

- ✅ Backend starts successfully with environment variables
- ✅ .env.example documents all required variables
- ✅ .env contains development values
- ✅ .env is NOT committed to git
- ✅ JWT authentication still works
- ✅ CORS still allows localhost:3000
- ✅ Database still connects

## When Done, Report:

1. Confirmation that all three files were updated
2. Verification that backend starts with .env
3. List of environment variables now configured
4. Any warnings or issues encountered