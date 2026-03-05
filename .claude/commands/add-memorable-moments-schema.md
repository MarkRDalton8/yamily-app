# Add memorable_moments to ReviewResponse Schema

Before writing any code, read these files in full:
- backend/app/schemas.py
- backend/app/models.py (Review class)
- backend/app/main.py (get_event_reviews function)

## Context

The Review model in models.py has a `memorable_moments` field, but the ReviewResponse schema in schemas.py does not include it. This means when reviews are returned from the API, the memorable_moments data is not included in the response.

## Task

Add the memorable_moments field to the ReviewResponse Pydantic schema so it's included in API responses.

## Implementation Steps

### Step 1: Update ReviewResponse Schema

In `backend/app/schemas.py`, find the ReviewResponse class (around line 48-66):

**Current code:**
```python
class ReviewResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    food_quality: int
    drama_level: int
    alcohol_availability: int
    conversation_topics: int
    overall_rating: float
    review_text: str
    memorable_moments: Optional[str]  # This might already be here!
    tags: List[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
```

**Check if `memorable_moments` is already there:**
- If YES: No changes needed, this task is already done!
- If NO: Add the line `memorable_moments: Optional[str]` between `review_text` and `tags`

**The complete, correct schema should be:**
```python
class ReviewResponse(BaseModel):
    id: int
    event_id: int
    user_id: int
    food_quality: int
    drama_level: int
    alcohol_availability: int
    conversation_topics: int
    overall_rating: float
    review_text: str
    memorable_moments: Optional[str]  # Add this if missing
    tags: List[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### Step 2: Verify Import

Make sure `Optional` is imported at the top of schemas.py:
```python
from typing import Optional, List
```

If `Optional` is not imported, add it.

## Files to NOT Modify

- backend/app/models.py (Review model already has the field)
- backend/app/main.py (endpoints already return full Review objects)
- Frontend files

## Verification

After making changes:
```bash
cd backend
source venv/bin/activate

# Restart server
uvicorn app.main:app --reload

# Test via API
# Method 1: Check API docs schema
# Go to http://localhost:8000/docs
# Find GET /events/{event_id}/reviews
# Click "Try it out"
# Look at the response schema - should include memorable_moments

# Method 2: Submit a test review with memorable moments
# Use the frontend or API to submit a review
# Include text in memorable_moments field
# Retrieve the review via GET /events/{event_id}/reviews
# Verify memorable_moments is in the response

# Method 3: Use curl
curl http://localhost:8000/events/1/reviews
# Look for "memorable_moments" field in the JSON response
```

**Test with frontend:**
```bash
# Start frontend
cd frontend
npm run dev

# Go to event detail page
# Submit a review with memorable moments filled in
# View the event detail page
# The memorable moments should display (if frontend shows it)
```

## Expected Outcome

- ✅ ReviewResponse schema includes memorable_moments field
- ✅ API responses include memorable_moments data
- ✅ Frontend can access memorable_moments from reviews
- ✅ No API errors or schema validation issues

## When Done, Report:

1. Confirmation of whether field was already present or was added
2. Verification that API responses include memorable_moments
3. Example API response showing the field
4. Any warnings or issues encountered