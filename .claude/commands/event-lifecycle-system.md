# Event Lifecycle - Start and End Events

## Problem

**Currently:**
- Events are created but never "end"
- No way to mark event as live vs ended
- Reviews can't be submitted (no end state)
- No host controls to manage event lifecycle

**This breaks core functionality!** Users can't review events.

---

## Solution: Event Status System

**Three states:**
1. **Upcoming** - Event created, not started yet
2. **Live** - Event is happening now (Live Feed active)
3. **Ended** - Event is over (Reviews can be submitted)

**Host controls:**
- "Start Event" button (upcoming → live)
- "End Event" button (live → ended)

**Business logic:**
- Live Feed: Available when `live` or `ended`
- Reviews: Only available when `ended`
- Join: Available when `upcoming` or `live` (not after ended)

---

## Implementation

### Part 1: Backend Changes

#### Step 1: Add Status Field to Event Model

**File:** `backend/app/models.py`

**Find the Event model and add status field:**

```python
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
import enum

# Add this enum class before the Event model
class EventStatus(str, enum.Enum):
    UPCOMING = "upcoming"
    LIVE = "live"
    ENDED = "ended"

class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    # ... existing fields ...
    
    # ADD THIS FIELD
    status = Column(String, default=EventStatus.UPCOMING.value)
    
    # ... rest of model ...
```

**Default:** New events start as "upcoming"

---

#### Step 2: Add Event Lifecycle Endpoints

**File:** `backend/app/main.py`

**Add these endpoints:**

```python
@app.post("/events/{event_id}/start")
def start_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Host starts an event (upcoming → live)
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Only host can start event
    if event.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only host can start event")
    
    # Can only start if upcoming
    if event.status != "upcoming":
        raise HTTPException(status_code=400, detail="Event already started or ended")
    
    event.status = "live"
    db.commit()
    db.refresh(event)
    
    return {"message": "Event started", "status": event.status}


@app.post("/events/{event_id}/end")
def end_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Host ends an event (live → ended)
    """
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Only host can end event
    if event.host_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only host can end event")
    
    # Can only end if live
    if event.status != "live":
        raise HTTPException(status_code=400, detail="Event not currently live")
    
    event.status = "ended"
    db.commit()
    db.refresh(event)
    
    return {"message": "Event ended", "status": event.status}
```

---

#### Step 3: Update Event Response Schema

**File:** `backend/app/schemas.py`

**Add status to EventResponse:**

```python
class EventResponse(BaseModel):
    id: int
    title: str
    event_date: datetime
    description: Optional[str] = None
    host_id: int
    invite_code: str
    status: str  # ADD THIS LINE
    host: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True
```

---

#### Step 4: Update Review Submission Logic

**File:** `backend/app/main.py`

**Find the create_review endpoint and add status check:**

```python
@app.post("/events/{event_id}/reviews", response_model=schemas.ReviewResponse)
def create_review(
    event_id: int,
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # ... existing code ...
    
    # ADD THIS CHECK - Reviews only allowed after event ends
    if event.status != "ended":
        raise HTTPException(
            status_code=400, 
            detail="Reviews can only be submitted after event has ended"
        )
    
    # ... rest of existing code ...
```

---

### Part 2: Frontend Changes

#### Step 5: Add Host Controls to Event Detail Page

**File:** `frontend/app/events/[id]/page.js`

**Add state for event status:**

```javascript
const [eventStatus, setEventStatus] = useState('upcoming') // upcoming, live, ended
const [changingStatus, setChangingStatus] = useState(false)
```

**Fetch event status when loading event:**

```javascript
useEffect(() => {
  async function fetchEvent() {
    // ... existing fetch code ...
    const data = await response.json()
    setEvent(data)
    setEventStatus(data.status) // ADD THIS LINE
  }
  fetchEvent()
}, [])
```

**Add functions to start/end event:**

```javascript
async function handleStartEvent() {
  if (!confirm('Start this event? The Live Feed will become active.')) return
  
  try {
    setChangingStatus(true)
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/events/${eventId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      setEventStatus('live')
      alert('Event started! 🎉')
    } else {
      const error = await response.json()
      alert(error.detail || 'Failed to start event')
    }
  } catch (err) {
    alert('Error starting event')
  } finally {
    setChangingStatus(false)
  }
}

async function handleEndEvent() {
  if (!confirm('End this event? Guests will be able to submit reviews.')) return
  
  try {
    setChangingStatus(true)
    const token = localStorage.getItem('token')
    const response = await fetch(`${API_URL}/events/${eventId}/end`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      setEventStatus('ended')
      alert('Event ended! Guests can now submit reviews.')
    } else {
      const error = await response.json()
      alert(error.detail || 'Failed to end event')
    }
  } catch (err) {
    alert('Error ending event')
  } finally {
    setChangingStatus(false)
  }
}
```

---

#### Step 6: Add Status Banner and Host Controls

**Add this above the event header (before the gradient header div):**

```javascript
{/* Event Status Banner */}
<div className={`rounded-lg p-4 mb-4 ${
  eventStatus === 'upcoming' ? 'bg-blue-100 border-blue-300' :
  eventStatus === 'live' ? 'bg-green-100 border-green-300' :
  'bg-gray-100 border-gray-300'
} border-2`}>
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
    {/* Status indicator */}
    <div className="flex items-center gap-2">
      <span className="text-2xl">
        {eventStatus === 'upcoming' ? '📅' : 
         eventStatus === 'live' ? '🎉' : 
         '✅'}
      </span>
      <div>
        <div className="font-bold text-gray-800">
          {eventStatus === 'upcoming' ? 'Event Upcoming' :
           eventStatus === 'live' ? 'Event is LIVE!' :
           'Event Ended'}
        </div>
        <div className="text-sm text-gray-600">
          {eventStatus === 'upcoming' ? 'Waiting for host to start' :
           eventStatus === 'live' ? 'Live Feed is active!' :
           'Reviews are now open'}
        </div>
      </div>
    </div>
    
    {/* Host controls - only show to host */}
    {isHost && (
      <div className="flex gap-2">
        {eventStatus === 'upcoming' && (
          <button
            onClick={handleStartEvent}
            disabled={changingStatus}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition-colors"
          >
            {changingStatus ? 'Starting...' : '▶️ Start Event'}
          </button>
        )}
        
        {eventStatus === 'live' && (
          <button
            onClick={handleEndEvent}
            disabled={changingStatus}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium transition-colors"
          >
            {changingStatus ? 'Ending...' : '⏹️ End Event'}
          </button>
        )}
        
        {eventStatus === 'ended' && (
          <div className="text-sm text-gray-600 italic">
            Event has ended
          </div>
        )}
      </div>
    )}
  </div>
</div>
```

---

#### Step 7: Update Tab Visibility Based on Status

**Modify the tab navigation to show/hide based on status:**

```javascript
{/* Tab Navigation */}
<div className="flex border-b border-gray-200 mb-6">
  <button
    onClick={() => setActiveTab('reviews')}
    className={`px-6 py-3 font-medium ${
      activeTab === 'reviews'
        ? 'border-b-2 border-blue-600 text-blue-600'
        : 'text-gray-600 hover:text-gray-800'
    }`}
  >
    ⭐ Reviews
    {/* Show count if available */}
  </button>
  
  {/* Live Feed - show when live or ended */}
  {(eventStatus === 'live' || eventStatus === 'ended') && (
    <button
      onClick={() => setActiveTab('feed')}
      className={`px-6 py-3 font-medium ${
        activeTab === 'feed'
          ? 'border-b-2 border-purple-600 text-purple-600'
          : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      💬 Live Feed
      {comments.length > 0 && (
        <span className="ml-2 bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
          {comments.length}
        </span>
      )}
    </button>
  )}
</div>
```

---

#### Step 8: Update Reviews Tab to Check Status

**In the Reviews tab content:**

```javascript
{activeTab === 'reviews' && (
  <div>
    {eventStatus === 'ended' ? (
      // Show review form (existing code)
      <div>
        {/* Existing review submission form */}
      </div>
    ) : (
      // Show message that reviews aren't available yet
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
        <p className="text-gray-700 text-lg mb-2">
          {eventStatus === 'upcoming' 
            ? '📅 Reviews will be available after the event ends'
            : '🎉 Event is live! Reviews will open when the host ends the event.'}
        </p>
        <p className="text-gray-600 text-sm">
          Check back later to share your thoughts!
        </p>
      </div>
    )}
    
    {/* Existing reviews display */}
    {reviews.length > 0 && (
      <div className="mt-6">
        {/* Show existing reviews */}
      </div>
    )}
  </div>
)}
```

---

#### Step 9: Update Live Feed Tab Messaging

**When Live Feed tab is selected but event is upcoming:**

```javascript
{activeTab === 'feed' && (
  <div>
    {eventStatus === 'upcoming' ? (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-700 text-lg mb-2">
          🔒 Live Feed opens when the event starts
        </p>
        <p className="text-gray-600 text-sm">
          The host will start the event when everyone arrives!
        </p>
      </div>
    ) : (
      // Show existing Live Feed (comment composer + feed)
      <div>
        {/* Existing Live Feed code */}
      </div>
    )}
  </div>
)}
```

---

## Database Migration

**Since we're adding a status field to existing events:**

### Option 1: Recreate Database (Easiest for MVP)

**On next deployment:**
- Delete yamily.db
- Database recreates with new schema
- All events will default to "upcoming"

### Option 2: Add Default to Existing Events (If you want to keep data)

**Run this SQL on EC2:**

```bash
sqlite3 ~/yamily-app/backend/yamily.db

UPDATE events SET status = 'upcoming' WHERE status IS NULL;
.quit
```

**For MVP, Option 1 (recreate) is recommended.**

---

## Testing

### Test 1: Host Start Event

1. Create event as host
2. **Verify:** Event shows "Upcoming" status
3. **Verify:** "Start Event" button visible to host
4. **Verify:** Live Feed tab not visible
5. Click "Start Event"
6. **Verify:** Status changes to "Live"
7. **Verify:** Live Feed tab now visible
8. **Verify:** Can post to Live Feed
9. **Verify:** Reviews not yet available

### Test 2: Host End Event

1. Start event (from Test 1)
2. **Verify:** "End Event" button visible to host
3. Click "End Event"
4. **Verify:** Status changes to "Ended"
5. **Verify:** Reviews tab now shows review form
6. **Verify:** Can submit review
7. **Verify:** Live Feed still visible (read-only or still active)

### Test 3: Attendee View

1. Join event as attendee
2. **Verify:** See status banner but NO start/end buttons
3. When upcoming: **Verify** can't access Live Feed or Reviews
4. When live: **Verify** can access Live Feed, not Reviews
5. When ended: **Verify** can access both Live Feed and Reviews

### Test 4: Status Persistence

1. Start event
2. Refresh page
3. **Verify:** Still shows "Live" status
4. End event
5. Refresh page
6. **Verify:** Still shows "Ended" status

---

## UI/UX Flow

**Event Lifecycle from Host Perspective:**

```
CREATE EVENT
   ↓
[Upcoming] 📅
- "Start Event" button visible
- Live Feed: Hidden
- Reviews: "Not available yet"
   ↓
CLICK "START EVENT"
   ↓
[Live] 🎉
- "End Event" button visible
- Live Feed: Active (posting enabled)
- Reviews: "Not available yet"
   ↓
CLICK "END EVENT"
   ↓
[Ended] ✅
- No more status buttons
- Live Feed: Visible (posting still enabled or read-only)
- Reviews: Form visible, can submit
```

**Event Lifecycle from Attendee Perspective:**

```
JOIN EVENT
   ↓
[Upcoming] 📅
- Wait message
- Live Feed: Not visible
- Reviews: Not visible
   ↓
HOST STARTS
   ↓
[Live] 🎉
- Live Feed: Can post/vote
- Reviews: Not available
   ↓
HOST ENDS
   ↓
[Ended] ✅
- Live Feed: Still visible
- Reviews: Can submit
```

---

## Expected Outcome

After implementation:

✅ **Events have clear lifecycle:** Upcoming → Live → Ended
✅ **Host controls:** Can start and end events
✅ **Reviews work:** Only available after event ends
✅ **Live Feed controlled:** Only available when live or ended
✅ **Clear status indicators:** Users know what state event is in
✅ **Core functionality restored:** People can actually review events!

---

## Estimated Time

**Backend:** 2-3 hours
- Add status field: 30 min
- Add endpoints: 1 hour
- Update review logic: 30 min
- Testing: 30 min

**Frontend:** 2-3 hours
- Status banner: 45 min
- Host controls: 45 min
- Conditional tabs: 30 min
- Testing: 30 min

**Total:** 4-6 hours

---

## Files Modified

**Backend:**
- `backend/app/models.py` - Add status field and enum
- `backend/app/schemas.py` - Add status to response
- `backend/app/main.py` - Add start/end endpoints, update review logic

**Frontend:**
- `frontend/app/events/[id]/page.js` - Add status banner, host controls, conditional UI

---

## When Done, Report:

1. ✅ Events default to "upcoming" status
2. ✅ Host can start event (upcoming → live)
3. ✅ Host can end event (live → ended)
4. ✅ Live Feed only visible when live or ended
5. ✅ Reviews only available when ended
6. ✅ Status banner shows current state
7. ✅ Attendees see status but no controls
8. ✅ Screenshots of all three states

---

## Critical for Launch

**This fixes a fundamental product gap!** Without event lifecycle:
- ❌ Reviews can't be submitted
- ❌ No way to control when Live Feed is active
- ❌ No clear event states

**With event lifecycle:**
- ✅ Reviews work as intended
- ✅ Host controls event flow
- ✅ Clear user expectations
- ✅ Product actually functions correctly!

**Priority: CRITICAL - Must have for MVP** 🔥
