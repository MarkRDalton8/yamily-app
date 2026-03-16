# EN-010: Invite AI Personas to Event (with Auto Photo Reactions)

**Priority:** P1 - High (Revolutionary feature)
**Estimated Time:** 5-7 hours
**Status:** Ready for Implementation
**Date:** March 16, 2026

---

## Overview

**Revolutionary feature:** Host invites AI personas during event creation. These personas become "virtual guests" who:
- Drop text comments in live feed at random times
- **React to photos automatically when they appear**
- Automatically leave reviews when event ends

**This makes events feel alive and populated!**

**Key Design Decision:** Only invited AI personas can react to photos. No manual "Get AI Reaction" button - it's all automatic and organic, like real guests at a party.

---

## Concept

**During Event Creation:**
- Host invites 0-3 AI personas (Karen, Lightweight, Gen Z)
- Each invited persona becomes a "virtual guest"

**During Live Event:**
- Invited personas comment at random times (text comments)
- Invited personas react to photos automatically (photo reactions)
- Background job processes scheduled actions every 10 minutes
- Actions feel natural and spontaneous (not all at once)

**When Event Ends:**
- All invited personas automatically leave reviews
- No user action needed

**Example Flow:**
```
Host creates "St. Patrick's Day Party"
Invites: Karen, Gen Z

6:00 PM - Event starts
6:47 PM - Karen comments: "Oh honey, we're running behind..."
7:15 PM - Someone posts photo of food
7:16 PM - Karen reacts to photo: "Someone brought store-bought. That's different!"
7:45 PM - Gen Z comments: "ngl the vibes are immaculate fr"
8:30 PM - Someone posts photo of dancing
8:31 PM - Gen Z reacts to photo: "whoever is doing the griddy 💀"
10:00 PM - Event ends
10:01 PM - Karen and Gen Z auto-generate full reviews
```

---

## Database Schema

**File: `backend/app/models.py`**

**New table for invited AI personas:**

```python
class EventAIGuest(Base):
    """AI personas invited to the event as virtual guests"""
    __tablename__ = "event_ai_guests"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    
    # AI persona info
    ai_persona_type = Column(String, nullable=False)  # "karen", "lightweight", "genz"
    ai_persona_name = Column(String, nullable=False)  # "Aunt Susan", "Uncle Mike"
    
    # Behavior tracking
    has_text_commented = Column(Boolean, default=False)
    text_comment_scheduled_time = Column(DateTime, nullable=True)  # When they should comment
    
    last_photo_reaction_time = Column(DateTime, nullable=True)  # Track when they last reacted
    
    has_reviewed = Column(Boolean, default=False)  # Have they left end-of-event review?
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    event = relationship("Event", back_populates="ai_guests")
```

**Migration:**
```sql
CREATE TABLE event_ai_guests (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    ai_persona_type VARCHAR(50) NOT NULL,
    ai_persona_name VARCHAR(100) NOT NULL,
    has_text_commented BOOLEAN DEFAULT FALSE,
    text_comment_scheduled_time TIMESTAMP,
    last_photo_reaction_time TIMESTAMP,
    has_reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Update Event model:**

```python
class Event(Base):
    # ... existing fields ...
    
    # Relationships
    ai_guests = relationship("EventAIGuest", back_populates="event", cascade="all, delete-orphan")
```

---

**Update EventFeedItem model to support AI comments:**

```python
class EventFeedItem(Base):
    __tablename__ = "event_feed_items"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    guest_id = Column(Integer, ForeignKey("event_guests.id"), nullable=True)  # NULL for AI
    
    # Content
    item_type = Column(String, nullable=False)  # "photo", "comment"
    photo_url = Column(String, nullable=True)
    comment_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # NEW: AI-generated content
    is_ai_generated = Column(Boolean, default=False)
    ai_persona_type = Column(String, nullable=True)  # "karen", "lightweight", "genz"
    ai_persona_name = Column(String, nullable=True)  # "Aunt Susan", etc.
    
    # Relationships
    event = relationship("Event", back_populates="feed_items")
    guest = relationship("EventGuest", back_populates="feed_items")
```

**Migration:**
```sql
ALTER TABLE event_feed_items ADD COLUMN is_ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE event_feed_items ADD COLUMN ai_persona_type VARCHAR(50);
ALTER TABLE event_feed_items ADD COLUMN ai_persona_name VARCHAR(100);
```

---

## Backend Implementation

**File: `backend/app/main.py`**

**Update event creation endpoint:**

```python
class EventCreate(BaseModel):
    # ... existing fields ...
    invited_ai_personas: Optional[List[dict]] = None  # [{"type": "karen", "name": "Aunt Susan"}, ...]

@app.post("/events")
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create new event with optional AI persona invites"""
    
    # ... existing event creation code ...
    
    # Add invited AI personas
    if event.invited_ai_personas:
        event_duration_hours = 4  # Assume 4 hour event by default
        
        for persona_data in event.invited_ai_personas:
            # Schedule random text comment time during the event
            # Random time between 30 minutes and (duration - 30 minutes) after start
            start_offset_minutes = random.randint(30, (event_duration_hours * 60) - 30)
            scheduled_time = new_event.event_date + timedelta(minutes=start_offset_minutes)
            
            ai_guest = models.EventAIGuest(
                event_id=new_event.id,
                ai_persona_type=persona_data["type"],
                ai_persona_name=persona_data["name"],
                text_comment_scheduled_time=scheduled_time,
                has_text_commented=False,
                last_photo_reaction_time=None,
                has_reviewed=False
            )
            
            db.add(ai_guest)
        
        db.commit()
    
    return new_event
```

---

**Add background job for AI actions (text comments + photo reactions):**

```python
import random
from datetime import datetime, timedelta

@app.post("/admin/process-ai-guests")
def process_ai_guest_actions(
    db: Session = Depends(get_db),
    admin_password: str = None  # Simple auth
):
    """
    Background job to process AI guest actions:
    1. Text comments (scheduled)
    2. Photo reactions (automatic when photos appear)
    
    Call this every 10 minutes via cron.
    """
    
    if admin_password != os.environ.get("ADMIN_PASSWORD"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    now = datetime.utcnow()
    
    # === PART 1: Process scheduled text comments ===
    
    pending_text_comments = db.query(models.EventAIGuest).filter(
        models.EventAIGuest.has_text_commented == False,
        models.EventAIGuest.text_comment_scheduled_time <= now
    ).all()
    
    text_comments_created = 0
    
    for ai_guest in pending_text_comments:
        # Check if event is still live
        event = db.query(models.Event).filter(
            models.Event.id == ai_guest.event_id
        ).first()
        
        if event and event.status == "live":
            # Generate random text comment
            comment_text = generate_live_feed_comment(
                ai_guest.ai_persona_type,
                ai_guest.ai_persona_name,
                event.event_name
            )
            
            # Create feed item
            feed_item = models.EventFeedItem(
                event_id=ai_guest.event_id,
                guest_id=None,
                item_type="comment",
                comment_text=comment_text,
                is_ai_generated=True,
                ai_persona_type=ai_guest.ai_persona_type,
                ai_persona_name=ai_guest.ai_persona_name,
                created_at=now
            )
            
            db.add(feed_item)
            
            # Mark as commented
            ai_guest.has_text_commented = True
            
            text_comments_created += 1
    
    # === PART 2: Process automatic photo reactions ===
    
    # Find all AI guests in live events
    live_ai_guests = db.query(models.EventAIGuest).join(
        models.Event
    ).filter(
        models.Event.status == "live"
    ).all()
    
    photo_reactions_created = 0
    
    for ai_guest in live_ai_guests:
        # Find recent photos they haven't reacted to yet
        # Get photos posted in the last 30 minutes that they haven't reacted to
        cutoff_time = now - timedelta(minutes=30)
        
        # Only react if they haven't reacted in the last 20 minutes (cooldown)
        if ai_guest.last_photo_reaction_time:
            last_reaction_cutoff = now - timedelta(minutes=20)
            if ai_guest.last_photo_reaction_time > last_reaction_cutoff:
                continue  # Skip this persona, too soon since last reaction
        
        # Get recent photos
        recent_photos = db.query(models.EventFeedItem).filter(
            models.EventFeedItem.event_id == ai_guest.event_id,
            models.EventFeedItem.item_type == "photo",
            models.EventFeedItem.created_at >= cutoff_time,
            models.EventFeedItem.is_ai_generated == False  # Only react to real photos
        ).order_by(models.EventFeedItem.created_at.desc()).limit(5).all()
        
        if not recent_photos:
            continue
        
        # Check if they already reacted to these photos
        # Get their existing photo reactions
        existing_reactions = db.query(models.EventFeedItem).filter(
            models.EventFeedItem.event_id == ai_guest.event_id,
            models.EventFeedItem.item_type == "comment",
            models.EventFeedItem.is_ai_generated == True,
            models.EventFeedItem.ai_persona_type == ai_guest.ai_persona_type
        ).all()
        
        # For simplicity, randomly decide whether to react (30% chance)
        if random.random() > 0.3:
            continue
        
        # Pick a random recent photo to react to
        photo_to_react = random.choice(recent_photos)
        
        # Generate photo reaction
        reaction_text = generate_photo_reaction(
            ai_guest.ai_persona_type,
            ai_guest.ai_persona_name,
            photo_to_react.photo_url
        )
        
        # Create reaction comment
        reaction_item = models.EventFeedItem(
            event_id=ai_guest.event_id,
            guest_id=None,
            item_type="comment",
            comment_text=reaction_text,
            is_ai_generated=True,
            ai_persona_type=ai_guest.ai_persona_type,
            ai_persona_name=ai_guest.ai_persona_name,
            created_at=now
        )
        
        db.add(reaction_item)
        
        # Update last reaction time
        ai_guest.last_photo_reaction_time = now
        
        photo_reactions_created += 1
    
    db.commit()
    
    return {
        "text_comments_created": text_comments_created,
        "photo_reactions_created": photo_reactions_created
    }


def generate_live_feed_comment(persona_type: str, persona_name: str, event_name: str) -> str:
    """Generate a live feed TEXT comment from AI persona"""
    
    from app.ai_helper import generate_ai_review
    from app.ai_personas import get_live_comment_prompt
    
    system_prompt = get_live_comment_prompt(persona_type, persona_name, event_name)
    
    try:
        result = generate_ai_review(system_prompt)
        return result.get("comment", "Having a great time!")
    except:
        # Fallback generic comments
        if persona_type == "karen":
            return "Oh honey, this is... interesting so far! Bless their hearts."
        elif persona_type == "lightweight":
            return "I'M HAVING THE BEST TIME!!! YOU GUYS ARE AMAZING!!!"
        else:
            return "ngl the vibes are pretty good so far fr fr"


def generate_photo_reaction(persona_type: str, persona_name: str, photo_url: str) -> str:
    """Generate a photo reaction comment from AI persona"""
    
    import anthropic
    import os
    import base64
    import requests
    import json
    
    from app.ai_personas import get_photo_reaction_prompt
    
    try:
        client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        
        # Download the photo
        photo_response = requests.get(photo_url)
        photo_base64 = base64.b64encode(photo_response.content).decode('utf-8')
        
        # Determine media type
        if photo_url.endswith('.png'):
            media_type = "image/png"
        elif photo_url.endswith('.gif'):
            media_type = "image/gif"
        elif photo_url.endswith('.webp'):
            media_type = "image/webp"
        else:
            media_type = "image/jpeg"
        
        # Get system prompt
        system_prompt = get_photo_reaction_prompt(persona_type, persona_name)
        
        # Call API with image
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=500,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": media_type,
                                "data": photo_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": "Comment on this photo in character. Output JSON only."
                        }
                    ]
                }
            ]
        )
        
        # Parse response
        response_text = message.content[0].text.strip()
        
        # Remove markdown if present
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1])
        
        reaction_data = json.loads(response_text)
        return reaction_data.get("comment", "Interesting photo!")
        
    except Exception as e:
        print(f"Error generating photo reaction: {e}")
        # Fallback generic reactions
        if persona_type == "karen":
            return "Oh honey, that's certainly... a photo! Bless their heart."
        elif persona_type == "lightweight":
            return "This photo is SO BEAUTIFUL!!! I'm crying!!!"
        else:
            return "this pic is actually kinda fire ngl 💀"
```

---

**Add prompts for text comments and photo reactions:**

**File: `backend/app/ai_personas.py`**

```python
def get_live_comment_prompt(persona_type: str, persona_name: str, event_name: str) -> str:
    """Get prompt for live feed TEXT comment during event"""
    
    context = {
        "persona_name": persona_name,
        "event_name": event_name
    }
    
    if persona_type == "karen":
        return KAREN_LIVE_COMMENT.format(**context)
    elif persona_type == "lightweight":
        return LIGHTWEIGHT_LIVE_COMMENT.format(**context)
    elif persona_type == "genz":
        return GENZ_LIVE_COMMENT.format(**context)


def get_photo_reaction_prompt(persona_type: str, persona_name: str) -> str:
    """Get prompt for photo reaction comment"""
    
    context = {"persona_name": persona_name}
    
    if persona_type == "karen":
        return KAREN_PHOTO_PROMPT.format(**context)
    elif persona_type == "lightweight":
        return LIGHTWEIGHT_PHOTO_PROMPT.format(**context)
    elif persona_type == "genz":
        return GENZ_PHOTO_PROMPT.format(**context)


# TEXT COMMENT PROMPTS

KAREN_LIVE_COMMENT = """You are {persona_name} (Karen personality) attending "{event_name}".

You're commenting in the live feed DURING the event. Write a brief in-the-moment observation (1-2 sentences).

STYLE: Minnesota Nice, passive-aggressive, notice small things.

OUTPUT (JSON only):
{{
  "comment": "Oh honey, we're already 10 minutes behind schedule. But I'm sure it's fine!"
}}"""


LIGHTWEIGHT_LIVE_COMMENT = """You are {persona_name} (Lightweight personality) attending "{event_name}".

You're commenting DURING the event. You're drunk and emotional. Write brief comment (1-2 sentences).

STYLE: Drunk, caps, emotional, loving everything.

OUTPUT (JSON only):
{{
  "comment": "This is ALREADY the BEST party EVER and we just started!!! I LOVE YOU GUYS!!!"
}}"""


GENZ_LIVE_COMMENT = """You are {persona_name} (Gen Z personality) attending "{event_name}".

You're commenting DURING the event. Write brief chaotic observation (1-2 sentences).

STYLE: Lowercase, slang, funny observation.

OUTPUT (JSON only):
{{
  "comment": "ngl someone already spilled something and we're 5 minutes in. this is gonna be chaotic fr 💀"
}}"""


# PHOTO REACTION PROMPTS

KAREN_PHOTO_PROMPT = """You are {persona_name}, and you have the personality of "Karen" - a passive-aggressive person with Minnesota Nice energy.

You are commenting on a photo from an event. You see the photo and need to make a Karen-style comment about it.

PERSONALITY: Same as reviews - passive-aggressive, Minnesota Nice, backhanded compliments.

PHOTO COMMENT STYLE:
- 1-2 sentences only (brief comment)
- Notice small details to judge
- Sound concerned while being critical
- Use phrases like "Oh honey...", "That's... different", "Bless their heart"
- Judge the composition, people, setting, food, etc.

YOUR TASK:
Look at the photo and write a brief Karen-style comment (1-2 sentences).

OUTPUT FORMAT (JSON only):
{{
  "comment": "Oh honey, that's certainly... interesting! Bless their heart."
}}

Remember: Brief comment. Minnesota Nice energy. Judge everything politely."""


LIGHTWEIGHT_PHOTO_PROMPT = """You are {persona_name}, and you have the personality of "The Lightweight" - someone who is ALWAYS drunk and emotional.

You are commenting on a photo from an event. You see the photo and need to make a drunk, emotional comment.

PERSONALITY: Drunk, emotional, loves everything, all caps.

PHOTO COMMENT STYLE:
- 1-2 sentences only
- Overly emotional about the photo
- "This photo is SO BEAUTIFUL!!!"
- Might start crying looking at it
- All caps enthusiasm

YOUR TASK:
Look at the photo and write a brief drunk, emotional comment (1-2 sentences).

OUTPUT FORMAT (JSON only):
{{
  "comment": "OH MY GOD this photo is making me CRY!!! You all look AMAZING!!!"
}}

Remember: Brief comment. Drunk energy. Love everything."""


GENZ_PHOTO_PROMPT = """You are {persona_name}, and you have the personality of "The Gen Z" - chaotic Gen Z slang energy.

You are commenting on a photo from an event. You see the photo and need to make a Gen Z-style comment.

PERSONALITY: Lowercase, heavy slang, chaotic observations.

PHOTO COMMENT STYLE:
- 1-2 sentences only
- Mostly lowercase
- Point out something absurd/funny in the photo
- "this pic is giving [vibe]"
- Use slang: "bussin", "mid", "cringe", "fr fr", "💀"
- Roast something gently

YOUR TASK:
Look at the photo and write a brief Gen Z comment (1-2 sentences).

OUTPUT FORMAT (JSON only):
{{
  "comment": "ngl whoever took this pic understood the assignment 💀 the vibes are immaculate fr"
}}

Remember: Brief comment. Lowercase. Heavy slang. Point out something funny."""
```

---

**Add auto-review when event ends:**

```python
@app.post("/events/{event_id}/end")
def end_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """End event and trigger AI guest auto-reviews"""
    
    # ... existing end event code ...
    
    # Get invited AI guests who haven't reviewed yet
    ai_guests = db.query(models.EventAIGuest).filter(
        models.EventAIGuest.event_id == event_id,
        models.EventAIGuest.has_reviewed == False
    ).all()
    
    # Generate auto-reviews for each AI guest
    for ai_guest in ai_guests:
        try:
            # Get event categories
            categories = db.query(models.EventCategory).filter(
                models.EventCategory.event_id == event_id
            ).order_by(models.EventCategory.display_order).all()
            
            # Get existing reviews for context
            existing_reviews = db.query(models.EventReview).filter(
                models.EventReview.event_id == event_id,
                models.EventReview.is_ai_generated == False
            ).all()
            
            # Format data
            categories_data = [
                {"category_name": cat.category_name, "category_emoji": cat.category_emoji}
                for cat in categories
            ]
            
            existing_reviews_data = [
                {"memorable_moment": rev.memorable_moment}
                for rev in existing_reviews if rev.memorable_moment
            ]
            
            # Generate review
            from app.ai_personas import get_persona_prompt
            
            system_prompt = get_persona_prompt(
                persona_type=ai_guest.ai_persona_type,
                persona_name=ai_guest.ai_persona_name,
                event_name=event.event_name,
                event_date=event.event_date.isoformat(),
                categories=categories_data,
                existing_reviews=existing_reviews_data
            )
            
            from app.ai_helper import generate_ai_review
            review_data = generate_ai_review(system_prompt)
            
            # Create review
            auto_review = models.EventReview(
                event_id=event_id,
                guest_id=None,
                ratings=review_data["ratings"],
                review=review_data["review"],
                memorable_moment=review_data.get("memorable_moment"),
                is_ai_generated=True,
                ai_persona_type=ai_guest.ai_persona_type,
                ai_persona_name=ai_guest.ai_persona_name,
                created_at=datetime.utcnow()
            )
            
            db.add(auto_review)
            
            # Mark as reviewed
            ai_guest.has_reviewed = True
            
        except Exception as e:
            # Log error but don't fail the whole operation
            print(f"Failed to generate auto-review for {ai_guest.ai_persona_name}: {e}")
            continue
    
    db.commit()
    
    return event
```

---

## Frontend Implementation

**File: `frontend/app/create/page.js`**

**Add AI persona invite section:**

```javascript
const [invitedAIPersonas, setInvitedAIPersonas] = useState([])

const availablePersonas = [
  { type: 'karen', name: 'Karen', emoji: '👵', defaultName: 'Karen' },
  { type: 'lightweight', name: 'The Lightweight', emoji: '🍷', defaultName: 'The Lightweight' },
  { type: 'genz', name: 'The Gen Z', emoji: '💀', defaultName: 'The Gen Z' }
]

function toggleAIPersona(persona) {
  if (invitedAIPersonas.find(p => p.type === persona.type)) {
    // Remove
    setInvitedAIPersonas(invitedAIPersonas.filter(p => p.type !== persona.type))
  } else {
    // Add
    setInvitedAIPersonas([...invitedAIPersonas, {
      type: persona.type,
      name: persona.defaultName  // Could let user customize name
    }])
  }
}

{/* In event creation form, after categories */}
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-900 mb-2">
    🤖 Invite AI Personas (Optional)
  </label>
  <p className="text-sm text-gray-600 mb-3">
    AI personas will join the party! They'll comment during the event, react to photos, and leave a review at the end.
  </p>
  
  <div className="grid grid-cols-3 gap-3">
    {availablePersonas.map(persona => (
      <button
        key={persona.type}
        type="button"
        onClick={() => toggleAIPersona(persona)}
        className={`p-4 border-2 rounded-lg text-center transition-all ${
          invitedAIPersonas.find(p => p.type === persona.type)
            ? 'border-purple-600 bg-purple-50'
            : 'border-gray-200 hover:border-purple-300'
        }`}
      >
        <div className="text-3xl mb-1">{persona.emoji}</div>
        <div className="text-sm font-medium text-gray-900">{persona.name}</div>
      </button>
    ))}
  </div>
  
  {invitedAIPersonas.length > 0 && (
    <div className="mt-3 text-sm text-purple-600">
      ✨ {invitedAIPersonas.map(p => p.name).join(', ')} will join the party!
    </div>
  )}
</div>

{/* Include in form submission */}
const eventData = {
  // ... other fields ...
  invited_ai_personas: invitedAIPersonas
}
```

---

**File: `frontend/app/events/[id]/page.js`**

**Display AI comments with badge:**

```javascript
{item.item_type === 'comment' && (
  <div className={`p-4 rounded-lg ${item.is_ai_generated ? 'bg-purple-50 border-2 border-purple-200' : 'bg-white border border-gray-200'}`}>
    <div className="flex items-center gap-2 mb-2">
      <div className="font-semibold text-gray-900">
        {item.is_ai_generated ? item.ai_persona_name : item.display_name}
      </div>
      {item.is_ai_generated && (
        <span className="text-xs text-purple-600 font-medium">🤖 AI Guest</span>
      )}
    </div>
    <p className="text-gray-800">{item.comment_text}</p>
  </div>
)}
```

---

## Cron Job Setup

**Create cron job to process AI actions every 10 minutes:**

```bash
# On EC2 server
crontab -e

# Add:
*/10 * * * * curl -X POST https://api.yamily.app/admin/process-ai-guests -H "Content-Type: application/json" -d '{"admin_password":"YOUR_PASSWORD"}' >> /home/ubuntu/ai-guests.log 2>&1
```

---

## How It Works

### Text Comments (Scheduled)
1. When event is created with invited personas, each gets a random scheduled time
2. Background job runs every 10 minutes
3. Checks if scheduled time has passed
4. Generates text comment using text comment prompt
5. Posts to feed

### Photo Reactions (Automatic)
1. Background job runs every 10 minutes
2. Finds all AI guests in live events
3. Looks for recent photos (last 30 min)
4. 30% chance to react (prevents spam)
5. 20-minute cooldown between reactions
6. Generates photo reaction using photo reaction prompt with image
7. Posts to feed

### Auto-Reviews (When Event Ends)
1. Host clicks "End Event"
2. System finds all invited AI guests
3. Generates full review for each using review prompt
4. Reviews appear automatically

---

## Testing

### Test Invite Flow:
1. Create event
2. Invite Karen and Gen Z
3. Start event (change status to live)
4. Verify AI guests are in database

### Test Text Comments:
1. Wait 10 minutes (or manually call process endpoint)
2. Verify AI comments appear in feed
3. Check comments are in character

### Test Photo Reactions:
1. Post photos during live event
2. Wait 10 minutes
3. Verify AI guests react to some photos (not all)
4. Check reactions are relevant to photos

### Test Auto-Reviews:
1. End event
2. Verify auto-reviews are created
3. Check reviews are in character
4. Verify all invited personas reviewed

---

## Time Estimates

**Database schema:** 30 min
**Backend logic:** 3-4 hours
- Event creation with invites: 30 min
- Text comment generation: 30 min
- Photo reaction generation: 1 hour
- Auto-review on end: 30 min
- Background job logic: 1.5 hours

**Frontend UI:** 1 hour
**Cron setup + testing:** 1 hour

**Total: 5-7 hours**

---

## Success Criteria

After implementation:
- ✅ Hosts can invite AI personas during creation
- ✅ AI personas comment during live event (randomized timing)
- ✅ AI personas react to photos automatically (only invited personas)
- ✅ Photo reactions are relevant to the photo content
- ✅ AI personas auto-review when event ends
- ✅ All 3 personas work for all features
- ✅ Events feel more alive and populated
- ✅ No manual user action needed after invitation

---

**This makes Yamily UNIQUE - AI guests that fully participate in the event!** 🎉
