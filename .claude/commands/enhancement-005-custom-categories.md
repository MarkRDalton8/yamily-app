# EN-005: Custom Rating Categories

**Priority:** P1 - High
**Estimated Time:** 4-6 hours
**Status:** Ready for Implementation

---

## Overview

Allow hosts to define custom rating categories for their events instead of being locked into Food/Drama/Alcohol/Conversation. Makes Yamily work for any type of gathering.

**Goal:** Host flexibility + personalization = higher engagement

---

## Current State vs Future State

### Current (Hardcoded):
- Every event has: Food, Drama, Alcohol, Conversation
- Guests rate these 4 categories (1-5 stars each)
- Works for family dinners, not great for game nights or sports parties

### Future (Custom):
- Host defines 2-8 categories when creating event
- Each category has: name + optional emoji
- Examples:
  - Game Night: Competition 🎮, Snacks 🍕, Trash Talk 💬, Games 🎲
  - Wedding: Food 🍽️, Open Bar 🍷, Dancing 💃, Drama 🎭
  - Birthday: Gifts 🎁, Cake 🎂, Fun 🎉, Surprises ✨

---

## PART 1: Database Changes

### Step 1: Create Categories Table

**File: `backend/app/models.py`**

**ADD this new model (after Event model):**

```python
class EventCategory(Base):
    __tablename__ = "event_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    category_name = Column(String, nullable=False)  # e.g., "Food Quality"
    category_emoji = Column(String, nullable=True)  # e.g., "🍽️"
    display_order = Column(Integer, default=0)  # For ordering categories
    
    # Relationship
    event = relationship("Event", back_populates="categories")

# UPDATE Event model to add relationship:
class Event(Base):
    # ... existing fields ...
    
    # ADD this relationship:
    categories = relationship("EventCategory", back_populates="event", cascade="all, delete-orphan")
```

---

### Step 2: Update Reviews Table for Custom Ratings

**File: `backend/app/models.py`**

**UPDATE EventReview model:**

```python
from sqlalchemy.types import JSON

class EventReview(Base):
    __tablename__ = "event_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"))
    guest_id = Column(Integer, ForeignKey("event_guests.id"))
    
    # OLD APPROACH - Remove these:
    # food_rating = Column(Integer)
    # drama_rating = Column(Integer)
    # alcohol_rating = Column(Integer)
    # conversation_rating = Column(Integer)
    
    # NEW APPROACH - Use JSON:
    ratings = Column(JSON, nullable=False)  # {"Food Quality": 5, "Drama": 4, "Open Bar": 5}
    
    memorable_moment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    event = relationship("Event", back_populates="reviews")
    guest = relationship("EventGuest", back_populates="reviews")
```

**⚠️ IMPORTANT:** This is a breaking change. Existing reviews will need migration (see Part 5).

---

### Step 3: Create Schemas

**File: `backend/app/schemas.py`**

**ADD these schemas:**

```python
from typing import Dict

# Category schemas
class CategoryCreate(BaseModel):
    category_name: str
    category_emoji: Optional[str] = None
    display_order: int = 0

class CategoryResponse(BaseModel):
    id: int
    category_name: str
    category_emoji: Optional[str]
    display_order: int
    
    class Config:
        from_attributes = True

# Updated Event Create schema
class EventCreate(BaseModel):
    event_name: str
    event_date: str
    description: Optional[str] = None
    expected_guests: List[str]
    categories: Optional[List[CategoryCreate]] = None  # NEW: Custom categories
    
    # If no categories provided, use defaults

# Updated Review Create schema
class ReviewCreate(BaseModel):
    ratings: Dict[str, int]  # NEW: {"Food Quality": 5, "Drama": 4}
    memorable_moment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    guest_id: int
    display_name: Optional[str]
    ratings: Dict[str, int]  # NEW: Custom ratings
    memorable_moment: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
```

---

## PART 2: Backend Endpoints

### Step 1: Update Create Event Endpoint

**File: `backend/app/main.py`**

**UPDATE create event endpoint:**

```python
@app.post("/events", response_model=schemas.EventResponse)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Create event
    new_event = models.Event(
        event_name=event.event_name,
        event_date=datetime.fromisoformat(event.event_date),
        description=event.description,
        host_id=current_user.id,
        status="upcoming"
    )
    
    db.add(new_event)
    db.flush()  # Get event ID
    
    # Add categories
    if event.categories and len(event.categories) > 0:
        # Use custom categories
        for cat in event.categories:
            category = models.EventCategory(
                event_id=new_event.id,
                category_name=cat.category_name,
                category_emoji=cat.category_emoji,
                display_order=cat.display_order
            )
            db.add(category)
    else:
        # Use default categories
        default_categories = [
            {"name": "Food", "emoji": "🍽️", "order": 0},
            {"name": "Drama", "emoji": "🎭", "order": 1},
            {"name": "Alcohol", "emoji": "🍷", "order": 2},
            {"name": "Conversation", "emoji": "💬", "order": 3}
        ]
        for cat in default_categories:
            category = models.EventCategory(
                event_id=new_event.id,
                category_name=cat["name"],
                category_emoji=cat["emoji"],
                display_order=cat["order"]
            )
            db.add(category)
    
    # ... rest of function (add guests, etc.) ...
    
    db.commit()
    db.refresh(new_event)
    
    return new_event
```

---

### Step 2: Update Get Event Endpoints

**Make sure event responses include categories:**

```python
@app.get("/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get categories
    categories = db.query(models.EventCategory).filter(
        models.EventCategory.event_id == event_id
    ).order_by(models.EventCategory.display_order).all()
    
    # Return event with categories
    return {
        "id": event.id,
        "event_name": event.event_name,
        "event_date": event.event_date,
        "status": event.status,
        "host_id": event.host_id,
        "categories": [
            {
                "id": cat.id,
                "category_name": cat.category_name,
                "category_emoji": cat.category_emoji,
                "display_order": cat.display_order
            }
            for cat in categories
        ],
        # ... other event fields ...
    }
```

---

### Step 3: Update Review Endpoints

**CREATE review with custom ratings:**

```python
@app.post("/events/{event_id}/reviews", response_model=schemas.ReviewResponse)
def create_review(
    event_id: int,
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Validate event status
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event.status != "ended":
        raise HTTPException(status_code=400, detail="Reviews only available after event ends")
    
    # Get event categories
    categories = db.query(models.EventCategory).filter(
        models.EventCategory.event_id == event_id
    ).all()
    
    # Validate ratings match event categories
    expected_categories = {cat.category_name for cat in categories}
    provided_categories = set(review.ratings.keys())
    
    if expected_categories != provided_categories:
        raise HTTPException(
            status_code=400, 
            detail=f"Ratings must match event categories. Expected: {expected_categories}"
        )
    
    # Validate rating values (1-5)
    for category, rating in review.ratings.items():
        if rating < 1 or rating > 5:
            raise HTTPException(status_code=400, detail=f"Rating for '{category}' must be 1-5")
    
    # Find guest
    guest = db.query(models.EventGuest).filter(
        models.EventGuest.event_id == event_id,
        models.EventGuest.user_id == current_user.id
    ).first()
    
    if not guest:
        raise HTTPException(status_code=403, detail="Not a guest of this event")
    
    # Check if already reviewed
    existing = db.query(models.EventReview).filter(
        models.EventReview.event_id == event_id,
        models.EventReview.guest_id == guest.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="You've already submitted a review")
    
    # Create review
    new_review = models.EventReview(
        event_id=event_id,
        guest_id=guest.id,
        ratings=review.ratings,  # Store as JSON
        memorable_moment=review.memorable_moment
    )
    
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    
    return {
        "id": new_review.id,
        "guest_id": new_review.guest_id,
        "display_name": guest.display_name,
        "ratings": new_review.ratings,
        "memorable_moment": new_review.memorable_moment,
        "created_at": new_review.created_at
    }
```

---

## PART 3: Frontend - Event Creation

### Step 1: Update Create Event Page

**File: `frontend/app/create-event/page.js`**

**ADD category management UI:**

```javascript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_URL } from '@/app/lib/api'

export default function CreateEventPage() {
  const router = useRouter()
  
  // Existing state
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [description, setDescription] = useState('')
  const [expectedGuests, setExpectedGuests] = useState([''])
  
  // NEW: Category state
  const [categories, setCategories] = useState([
    { category_name: 'Food', category_emoji: '🍽️', display_order: 0 },
    { category_name: 'Drama', category_emoji: '🎭', display_order: 1 },
    { category_name: 'Alcohol', category_emoji: '🍷', display_order: 2 },
    { category_name: 'Conversation', category_emoji: '💬', display_order: 3 }
  ])
  
  const [creating, setCreating] = useState(false)

  function addCategory() {
    if (categories.length >= 8) {
      alert('Maximum 8 categories allowed')
      return
    }
    
    setCategories([
      ...categories,
      { category_name: '', category_emoji: '', display_order: categories.length }
    ])
  }

  function removeCategory(index) {
    if (categories.length <= 2) {
      alert('Minimum 2 categories required')
      return
    }
    
    const updated = categories.filter((_, i) => i !== index)
    // Update display_order
    updated.forEach((cat, i) => cat.display_order = i)
    setCategories(updated)
  }

  function updateCategory(index, field, value) {
    const updated = [...categories]
    updated[index][field] = value
    setCategories(updated)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    // Validate categories
    for (let cat of categories) {
      if (!cat.category_name.trim()) {
        alert('All categories must have a name')
        return
      }
    }
    
    if (categories.length < 2 || categories.length > 8) {
      alert('Please have 2-8 categories')
      return
    }
    
    try {
      setCreating(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event_name: eventName,
          event_date: eventDate,
          description: description || null,
          expected_guests: expectedGuests.filter(g => g.trim()),
          categories: categories  // NEW: Include categories
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('Event created! Share the invite links with your guests. 🎉')
        router.push(`/events/${data.id}`)
      } else {
        const error = await response.json()
        alert(`Failed to create event: ${error.detail || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Error:', err)
      alert('Error creating event')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Event
        </h1>
        <p className="text-gray-600 mb-8">
          Set up your gathering. We'll help you document what really happens.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {/* Existing fields: Event Name, Date, Description, Expected Guests */}
          {/* ... keep all existing fields ... */}

          {/* NEW: Rating Categories Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Rating Categories
              <span className="text-gray-500 font-normal ml-2">(2-8 categories)</span>
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Choose what guests will rate. Default categories work for most events, or customize for your specific gathering.
            </p>

            <div className="space-y-3 mb-4">
              {categories.map((category, index) => (
                <div key={index} className="flex gap-3 items-center">
                  {/* Emoji input */}
                  <input
                    type="text"
                    value={category.category_emoji || ''}
                    onChange={(e) => updateCategory(index, 'category_emoji', e.target.value)}
                    placeholder="🎉"
                    maxLength="2"
                    className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl"
                  />
                  
                  {/* Name input */}
                  <input
                    type="text"
                    value={category.category_name}
                    onChange={(e) => updateCategory(index, 'category_name', e.target.value)}
                    placeholder="Category name"
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  
                  {/* Remove button */}
                  {categories.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeCategory(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Category button */}
            {categories.length < 8 && (
              <button
                type="button"
                onClick={addCategory}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                + Add Category
              </button>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={creating}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:bg-gray-400"
          >
            {creating ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

---

## PART 4: Frontend - Review Form

### Update Review Form to Use Custom Categories

**File: `frontend/app/events/[id]/page.js`**

**UPDATE the Reviews tab to dynamically show categories:**

```javascript
// When fetching event, also get categories
const [eventCategories, setEventCategories] = useState([])

async function fetchEvent() {
  // ... existing fetch code ...
  const data = await response.json()
  setEvent(data)
  setEventCategories(data.categories || [])  // NEW: Store categories
}

// Review form state - dynamic ratings
const [ratings, setRatings] = useState({})

// Initialize ratings when categories load
useEffect(() => {
  if (eventCategories.length > 0) {
    const initialRatings = {}
    eventCategories.forEach(cat => {
      initialRatings[cat.category_name] = 0
    })
    setRatings(initialRatings)
  }
}, [eventCategories])

// Review form submission
async function handleSubmitReview(e) {
  e.preventDefault()
  
  // Validate all categories rated
  const allRated = Object.values(ratings).every(r => r > 0)
  if (!allRated) {
    alert('Please rate all categories')
    return
  }
  
  try {
    setSubmittingReview(true)
    const token = localStorage.getItem('token')
    
    const response = await fetch(`${API_URL}/events/${eventId}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ratings: ratings,  // NEW: Send dynamic ratings
        memorable_moment: memorableMoment || null
      })
    })

    if (response.ok) {
      alert('Review submitted! Your honest opinion is now immortalized. 🌟')
      fetchReviews()
      setRatings({})
      setMemorableMoment('')
    } else {
      const error = await response.json()
      alert(`Failed: ${error.detail}`)
    }
  } catch (err) {
    alert('Error submitting review')
  } finally {
    setSubmittingReview(false)
  }
}

// Review form JSX - Dynamic categories
{eventCategories.map(category => (
  <div key={category.id} className="mb-4">
    <label className="block text-sm font-medium text-gray-900 mb-2">
      {category.category_emoji} {category.category_name}
    </label>
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => setRatings({...ratings, [category.category_name]: star})}
          className={`text-3xl transition-transform hover:scale-110 ${
            ratings[category.category_name] >= star ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ⭐
        </button>
      ))}
    </div>
  </div>
))}
```

---

## PART 5: Database Migration

### Migrating Existing Events

**⚠️ CRITICAL: This is a breaking change**

**Options:**

**Option A: Start Fresh (Recommended for MVP)**
- Recreate database on deployment
- Lose existing test data
- Clean slate with new schema

**Option B: Data Migration Script**
- Create migration script to convert old reviews
- Map old columns to new JSON format
- Preserve existing data

**For now, recommend Option A since you're pre-launch.**

**Migration script (if needed later):**

```python
# migration_script.py
from backend.app.database import SessionLocal
from backend.app import models

db = SessionLocal()

# Get all events
events = db.query(models.Event).all()

for event in events:
    # Create default categories for existing events
    default_categories = [
        {"name": "Food", "emoji": "🍽️", "order": 0},
        {"name": "Drama", "emoji": "🎭", "order": 1},
        {"name": "Alcohol", "emoji": "🍷", "order": 2},
        {"name": "Conversation", "emoji": "💬", "order": 3}
    ]
    
    for cat in default_categories:
        category = models.EventCategory(
            event_id=event.id,
            category_name=cat["name"],
            category_emoji=cat["emoji"],
            display_order=cat["order"]
        )
        db.add(category)

# Convert old reviews to new format
reviews = db.query(models.EventReview).all()

for review in reviews:
    # Convert old columns to JSON
    review.ratings = {
        "Food": review.food_rating,
        "Drama": review.drama_rating,
        "Alcohol": review.alcohol_rating,
        "Conversation": review.conversation_rating
    }

db.commit()
```

---

## Testing

### Test Category Creation

1. Create new event
2. **Test default categories:**
   - Leave categories as-is
   - Submit form
   - **Verify:** Event created with Food/Drama/Alcohol/Conversation

3. **Test custom categories:**
   - Click "Add Category"
   - Add "Competition 🎮"
   - Remove "Alcohol"
   - Submit
   - **Verify:** Event created with custom categories

4. **Test validation:**
   - Try to remove all categories except 1
   - **Verify:** Error "Minimum 2 categories"
   - Try to add 9th category
   - **Verify:** Error "Maximum 8 categories"

### Test Review Submission

1. Create event with custom categories
2. End event
3. Go to Reviews tab
4. **Verify:** Form shows custom categories (not hardcoded 4)
5. Rate all categories
6. Submit review
7. **Verify:** Review stored with custom ratings
8. **Verify:** Review displays with correct category names

### Test Summary Page

1. Event with custom categories
2. Submit reviews
3. Go to `/events/{id}/summary`
4. **Verify:** Custom categories show in "Overall Ratings"
5. **Verify:** Reviews show custom category ratings

---

## Deployment

**Requires database recreation:**

```bash
# Push code
git add .
git commit -m "Add custom rating categories"
git push origin main

# SSH to EC2
ssh -i ~/.ssh/yamily-ec2-key.pem ubuntu@32.192.255.113

# Pull and recreate database
cd ~/yamily-app && git pull && cd backend && rm yamily.db && kill $(ps aux | grep uvicorn | grep -v grep | awk '{print $2}') && sleep 2 && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --limit-max-requests 52428800 > /dev/null 2>&1 &
```

---

## Expected Outcome

**After implementation:**

**Event Creation:**
- ✅ Host can customize rating categories
- ✅ 2-8 categories allowed
- ✅ Each category has name + optional emoji
- ✅ Default to Food/Drama/Alcohol/Conversation if not customized

**Reviews:**
- ✅ Review form dynamically shows event's categories
- ✅ Guests rate each custom category
- ✅ Reviews store and display custom ratings

**Flexibility:**
- ✅ Game Night: Competition, Snacks, Trash Talk, Games
- ✅ Wedding: Food, Open Bar, Dance Floor, Speeches
- ✅ Any event type works!

**Summary Page:**
- ✅ Shows custom category averages
- ✅ Reviews display custom category names

---

## Files Created/Modified

**Backend:**
- `backend/app/models.py` - Added EventCategory model, updated EventReview
- `backend/app/schemas.py` - Added category schemas, updated event/review schemas
- `backend/app/main.py` - Updated event creation, review endpoints

**Frontend:**
- `frontend/app/create-event/page.js` - Added category management UI
- `frontend/app/events/[id]/page.js` - Dynamic review form, display custom ratings

**Database:**
- New table: `event_categories`
- Modified table: `event_reviews` (ratings as JSON)

---

## Time Estimate

**Total: 4-6 hours**

- Database models/migration: 1 hour
- Backend endpoints: 1.5 hours
- Frontend event creation: 1.5 hours
- Frontend review form: 1 hour
- Testing/polish: 1 hour

---

## Why This Is Awesome

**Flexibility:**
- ✅ Works for ANY type of gathering
- ✅ Not just family dinners anymore
- ✅ Host controls the experience

**Personalization:**
- ✅ Each event feels unique
- ✅ Categories match the occasion
- ✅ Higher engagement

**Premium Potential:**
- ✅ Could limit free tier to 4 categories
- ✅ Unlimited categories = premium feature
- ✅ Category templates = premium

**Market Expansion:**
- ✅ Now works for game nights, sports parties, book clubs, etc.
- ✅ Much bigger addressable market
- ✅ More use cases = more users

---

## Future Enhancements

**Category Templates (Phase 2):**
- Pre-built category sets for common events
- "Game Night Template" → auto-fills Competition, Snacks, Games
- "Wedding Template" → auto-fills Food, Bar, Dancing, Speeches

**Category Icons (Phase 2):**
- Emoji picker UI (not just text input)
- Pre-defined emoji library

**Premium Tier:**
- Free: 4 categories max
- Premium: Unlimited categories + templates

---

## When Done, Report:

1. ✅ EventCategory table created
2. ✅ EventReview using JSON ratings
3. ✅ Event creation UI has category management
4. ✅ Can add/remove/customize categories
5. ✅ Review form shows custom categories
6. ✅ Reviews store custom ratings
7. ✅ Summary page shows custom categories
8. ✅ Tested with various event types
9. ✅ Database deployed with new schema

---

**This makes Yamily work for EVERY type of gathering!** 🎯
