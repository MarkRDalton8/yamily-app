# Fix ReviewVote vote_type Column Type

Before writing any code, read these files in full:
- backend/app/models.py
- backend/app/main.py (specifically the vote_on_review function)

## Context

There's a data type mismatch in the ReviewVote model:
- The column is defined as `String` in models.py
- The validation in main.py checks for integer values (1 or -1)
- The comment says "1 for upvote, -1 for downvote" (integers)

This works currently because SQLite is lenient about types, but will cause issues with PostgreSQL in production.

## Task

Change the ReviewVote.vote_type column from String to Integer.

## Implementation Steps

### Step 1: Update the Model

In `backend/app/models.py`, find the ReviewVote class (around line 77-86):

**Current code:**
```python
class ReviewVote(Base):
    __tablename__ = "review_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vote_type = Column(String, nullable=False)  # 1 for upvote, -1 for downvote
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

**Change to:**
```python
class ReviewVote(Base):
    __tablename__ = "review_votes"
    
    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vote_type = Column(Integer, nullable=False)  # 1 for upvote, -1 for downvote
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

Only change: `String` → `Integer`

### Step 2: Delete and Recreate Database

Since we're changing the schema, we need to recreate the database:
```bash
cd backend

# Stop the backend server if running (Ctrl+C)

# Delete the database file
rm yamily.db

# The database will be recreated when you start the server
```

### Step 3: Verify the Change

The API endpoint already validates vote_type as integer (in main.py line ~274):
```python
if vote.vote_type not in [1, -1]:
    raise HTTPException(status_code=400, detail="vote_type must be 1 (upvote) or -1 (downvote)")
```

This validation is correct and doesn't need to change.

## Files to NOT Modify

- backend/app/main.py (validation is already correct)
- backend/app/schemas.py (VoteCreate already expects int)
- Frontend files
- Any other backend files

## Verification

After making changes:
```bash
cd backend
source venv/bin/activate

# Start server (this recreates database with new schema)
uvicorn app.main:app --reload

# Check that server starts without errors
# Database tables should be created fresh

# Test via API docs
# Go to http://localhost:8000/docs
# Find POST /reviews/{review_id}/vote
# Try to vote with vote_type: 1
# Should work

# Try to vote with vote_type: -1
# Should work

# Try to vote with invalid value like 0
# Should return 400 error

# Check database schema
sqlite3 yamily.db ".schema review_votes"
# Should show: vote_type INTEGER NOT NULL
```

## Expected Outcome

- ✅ vote_type column is now Integer instead of String
- ✅ Database recreated with correct schema
- ✅ Voting still works (upvote/downvote)
- ✅ Invalid vote types are rejected
- ✅ Ready for PostgreSQL migration

## When Done, Report:

1. Confirmation that column type was changed
2. Verification that database was recreated
3. Test results from voting (upvote and downvote)
4. Database schema output showing INTEGER type
5. Any warnings or issues encountered

## Note

This change requires deleting the database, so any test data will be lost. This is fine for development. In production, this would require a proper database migration using Alembic.