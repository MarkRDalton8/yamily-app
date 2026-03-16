# Yamily - March 10 Implementation Guide for Claude Code

**Tasks:** 3 enhancements to implement in order
**Total Time:** 4-7 hours
**Order:** EN-007 (Messaging) → EN-006 (Custom Scales) → EN-008 (PWA)

---

# TASK 1: EN-007 - Messaging Update (CRITICAL)

**Time:** 1-2 hours
**Priority:** Must do first - critical for correct positioning

## Overview

Change all "family gatherings" references to "all gatherings" throughout the app. Yamily works for ALL types of gatherings (family, friends, game nights, birthdays, sports parties), not just family events.

## Key Changes

**Replace:**
- "family gatherings" → "gatherings" or "parties"
- "family members" → "people" or "guests"
- "family events" → "events" or "gatherings"

**New tagline:** "Because every dinner party deserves a rating"

**Examples should mix:** family dinners, game nights, birthdays, watch parties, book clubs

## Files to Update

### 1. Homepage (`frontend/app/page.js`)

**Find and replace throughout:**

**Change hero headline:**
```javascript
// OLD:
<h1>Rate Your Family Gatherings</h1>

// NEW:
<h1>Rate Your Gatherings</h1>
```

**Update tagline/subtitle:**
```javascript
// Add this prominent tagline:
<p className="text-xl text-gray-600">
  Because every dinner party deserves a rating
</p>
```

**Update description text:**
```javascript
// OLD: Any text mentioning "family gatherings", "family dinners", "family members"
// NEW: Use "gatherings", "dinner parties", "people", "guests"

// Example:
// OLD: "Track your family gatherings..."
// NEW: "Track your gatherings and parties..."
```

**Update examples/features section:**
```javascript
// Mix family AND friend contexts:
// Examples:
// - "Game night with friends"
// - "Family holiday dinner"
// - "Birthday party"
// - "Sports watch party"
// - "Book club gathering"
// - "Dinner party"
```

### 2. Event Creation Page (`frontend/app/create-event/page.js`)

**Update page title:**
```javascript
// OLD:
<h1>Create Family Event</h1>

// NEW:
<h1>Create Event</h1>
```

**Update description text:**
```javascript
// OLD:
<p>Set up your family gathering. We'll help you document what really happens.</p>

// NEW:
<p>Set up your gathering. We'll help you document what really happens.</p>
```

**Update any other "family" references in helper text, labels, placeholders**

### 3. My Events Page (`frontend/app/my-events/page.js`)

**Update headers:**
```javascript
// OLD:
<h1>My Family Events</h1>

// NEW:
<h1>My Events</h1>
```

**Update empty state text:**
```javascript
// OLD: "You haven't hosted any family gatherings yet"
// NEW: "You haven't hosted any gatherings yet"

// OLD: "You haven't joined any family events yet"
// NEW: "You haven't joined any events yet"
```

### 4. Event Detail Page (`frontend/app/events/[id]/page.js`)

**Search for any "family" references in:**
- Tab labels
- Button text
- Helper text
- Empty states

**Replace with:** "event", "gathering", "people", "guests"

### 5. Join Page (`frontend/app/join/[inviteCode]/page.js`)

**Update invitation text:**
```javascript
// OLD:
<h1>You're invited to a family gathering!</h1>

// NEW:
<h1>You're invited!</h1>
// or
<h1>Join this event</h1>
```

**Update description:**
```javascript
// OLD: "Join this family event"
// NEW: "Join this gathering"
```

### 6. Register Page (`frontend/app/register/page.js`)

**Update value proposition text:**
```javascript
// OLD: "Rate your family gatherings"
// NEW: "Rate your gatherings"

// OLD: "Document family events"
// NEW: "Document your gatherings"
```

### 7. Login Page (`frontend/app/login/page.js`)

**Update value proposition text:**
```javascript
// Same as register page - remove "family" references
```

## Messaging Guidelines

**Use these phrases:**
✅ "gatherings"
✅ "parties"
✅ "dinner parties"
✅ "events"
✅ "people"
✅ "guests"

**Avoid these phrases:**
❌ "family gatherings" (unless specifically about family)
❌ "family members"
❌ "family events"

**Examples are inclusive:**
- Family holiday dinner ✅
- Game night with friends ✅
- Birthday party ✅
- Sports watch party ✅
- Book club ✅
- Dinner party ✅

## Testing After Implementation

1. Load homepage → Check headline and tagline
2. Check create event page → No "family" references
3. Check my events page → Generic "events" language
4. Check register/login → Broader positioning
5. Overall feel: App works for ANY gathering type

**Deliverable:** App positioned for all gatherings, not just family events

---

# TASK 2: EN-006 - Custom Rating Scales

**Time:** 2-3 hours
**Priority:** High - makes custom categories more powerful

## Overview

Currently all categories use 1-5 stars with labels:
- 1 = "Terrible"
- 2 = "Poor"
- 3 = "Good"
- 4 = "Great"
- 5 = "Amazing"

**Enhancement:** Let hosts customize these labels per category.

**Examples:**
- Competition: 1="Boring" → 5="Cutthroat"
- Spice Level: 1="Mild" → 5="Fire Alarm"
- Drama: 1="Peaceful" → 5="Jerry Springer"

## Backend Changes

### Step 1: Update EventCategory Model

**File: `backend/app/models.py`**

**Find the EventCategory class and add scale_labels field:**

```python
from sqlalchemy.types import JSON

class EventCategory(Base):
    __tablename__ = "event_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    category_name = Column(String, nullable=False)
    category_emoji = Column(String, nullable=True)
    display_order = Column(Integer, default=0)
    scale_labels = Column(JSON, nullable=True)  # NEW - Add this field
    
    # Relationship
    event = relationship("Event", back_populates="categories")
```

### Step 2: Update Schemas

**File: `backend/app/schemas.py`**

**Update CategoryCreate schema:**

```python
from typing import Dict, Optional

class CategoryCreate(BaseModel):
    category_name: str
    category_emoji: Optional[str] = None
    display_order: int = 0
    scale_labels: Optional[Dict[str, str]] = None  # NEW - Add this field

class CategoryResponse(BaseModel):
    id: int
    category_name: str
    category_emoji: Optional[str]
    display_order: int
    scale_labels: Optional[Dict[str, str]]  # NEW - Add this field
    
    class Config:
        from_attributes = True
```

### Step 3: Update Event Creation Endpoint

**File: `backend/app/main.py`**

**Find the create_event endpoint and update the category creation logic:**

```python
@app.post("/events", response_model=schemas.EventResponse)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # ... existing event creation code ...
    
    # FIND THIS SECTION and UPDATE it:
    
    # Add categories
    if event.categories and len(event.categories) > 0:
        # Use custom categories
        for cat in event.categories:
            # Use custom scale if provided, otherwise use default
            scale_labels = cat.scale_labels if cat.scale_labels else {
                "1": "Terrible",
                "2": "Poor",
                "3": "Good",
                "4": "Great",
                "5": "Amazing"
            }
            
            category = models.EventCategory(
                event_id=new_event.id,
                category_name=cat.category_name,
                category_emoji=cat.category_emoji,
                display_order=cat.display_order,
                scale_labels=scale_labels  # NEW - Add this
            )
            db.add(category)
    else:
        # Use default categories with themed scales
        default_categories = [
            {
                "name": "Food",
                "emoji": "🍽️",
                "order": 0,
                "scale": {
                    "1": "Terrible",
                    "2": "Poor",
                    "3": "Good",
                    "4": "Great",
                    "5": "Amazing"
                }
            },
            {
                "name": "Drama",
                "emoji": "🎭",
                "order": 1,
                "scale": {
                    "1": "Peaceful",
                    "2": "Minor Tension",
                    "3": "Awkward",
                    "4": "Arguments",
                    "5": "Jerry Springer"
                }
            },
            {
                "name": "Alcohol",
                "emoji": "🍷",
                "order": 2,
                "scale": {
                    "1": "Dry",
                    "2": "Limited",
                    "3": "Available",
                    "4": "Flowing",
                    "5": "Open Bar"
                }
            },
            {
                "name": "Conversation",
                "emoji": "💬",
                "order": 3,
                "scale": {
                    "1": "Awkward",
                    "2": "Small Talk",
                    "3": "Engaging",
                    "4": "Deep",
                    "5": "Unforgettable"
                }
            }
        ]
        
        for cat in default_categories:
            category = models.EventCategory(
                event_id=new_event.id,
                category_name=cat["name"],
                category_emoji=cat["emoji"],
                display_order=cat["order"],
                scale_labels=cat["scale"]  # NEW - Add this
            )
            db.add(category)
    
    # ... rest of function ...
```

### Step 4: Update Get Event Endpoint

**File: `backend/app/main.py`**

**Find the get_event endpoint and make sure it returns scale_labels:**

```python
@app.get("/events/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # ... existing code ...
    
    # Make sure categories include scale_labels in response:
    "categories": [
        {
            "id": cat.id,
            "category_name": cat.category_name,
            "category_emoji": cat.category_emoji,
            "display_order": cat.display_order,
            "scale_labels": cat.scale_labels  # Make sure this is included
        }
        for cat in categories
    ]
```

## Frontend Changes

### Step 1: Update Event Creation Page

**File: `frontend/app/create-event/page.js`**

**Update category state to include scale_labels:**

```javascript
const [categories, setCategories] = useState([
  { 
    category_name: 'Food', 
    category_emoji: '🍽️', 
    display_order: 0,
    scale_labels: {
      "1": "Terrible",
      "2": "Poor",
      "3": "Good",
      "4": "Great",
      "5": "Amazing"
    }
  },
  { 
    category_name: 'Drama', 
    category_emoji: '🎭', 
    display_order: 1,
    scale_labels: {
      "1": "Peaceful",
      "2": "Minor Tension",
      "3": "Awkward",
      "4": "Arguments",
      "5": "Jerry Springer"
    }
  },
  { 
    category_name: 'Alcohol', 
    category_emoji: '🍷', 
    display_order: 2,
    scale_labels: {
      "1": "Dry",
      "2": "Limited",
      "3": "Available",
      "4": "Flowing",
      "5": "Open Bar"
    }
  },
  { 
    category_name: 'Conversation', 
    category_emoji: '💬', 
    display_order: 3,
    scale_labels: {
      "1": "Awkward",
      "2": "Small Talk",
      "3": "Engaging",
      "4": "Deep",
      "5": "Unforgettable"
    }
  }
])
```

**Add function to update scale labels:**

```javascript
function updateCategoryScale(categoryIndex, ratingLevel, label) {
  const updated = [...categories]
  if (!updated[categoryIndex].scale_labels) {
    updated[categoryIndex].scale_labels = {}
  }
  updated[categoryIndex].scale_labels[ratingLevel] = label
  setCategories(updated)
}
```

**Update the category UI to include optional scale customization:**

```javascript
{categories.map((category, index) => (
  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
    {/* Existing category name and emoji inputs */}
    <div className="flex gap-3 items-center mb-3">
      <input
        type="text"
        value={category.category_emoji || ''}
        onChange={(e) => updateCategory(index, 'category_emoji', e.target.value)}
        placeholder="🎉"
        maxLength="2"
        className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl"
      />
      
      <input
        type="text"
        value={category.category_name}
        onChange={(e) => updateCategory(index, 'category_name', e.target.value)}
        placeholder="Category name"
        required
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
      />
      
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

    {/* NEW: Custom scale labels (collapsible) */}
    <details className="mt-3">
      <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600">
        Customize rating labels (optional)
      </summary>
      <div className="mt-3 space-y-2 pl-4">
        {[1, 2, 3, 4, 5].map(level => (
          <div key={level} className="flex items-center gap-2">
            <span className="text-sm text-gray-600 w-8">{level}★</span>
            <input
              type="text"
              value={category.scale_labels?.[String(level)] || ''}
              onChange={(e) => updateCategoryScale(index, String(level), e.target.value)}
              placeholder={
                level === 1 ? 'Terrible' : 
                level === 2 ? 'Poor' : 
                level === 3 ? 'Good' : 
                level === 4 ? 'Great' : 
                'Amazing'
              }
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}
        <p className="text-xs text-gray-500 mt-2">
          Examples: "Boring → Cutthroat", "Mild → Fire Alarm"
        </p>
      </div>
    </details>
  </div>
))}
```

### Step 2: Update Review Form

**File: `frontend/app/events/[id]/page.js`**

**Update the review form to show custom scale labels:**

```javascript
{/* In the review form section */}
{eventCategories.map(category => (
  <div key={category.id} className="mb-6">
    <label className="block text-sm font-medium text-gray-900 mb-3">
      {category.category_emoji} {category.category_name}
    </label>
    
    {/* Star rating buttons */}
    <div className="flex gap-2 mb-2">
      {[1, 2, 3, 4, 5].map(star => {
        const label = category.scale_labels?.[String(star)] || 
          (star === 1 ? 'Terrible' : star === 2 ? 'Poor' : star === 3 ? 'Good' : star === 4 ? 'Great' : 'Amazing')
        
        return (
          <button
            key={star}
            type="button"
            onClick={() => setRatings({...ratings, [category.category_name]: star})}
            className={`flex flex-col items-center transition-transform hover:scale-110 ${
              ratings[category.category_name] >= star ? 'text-yellow-400' : 'text-gray-300'
            }`}
            title={label}
          >
            <span className="text-3xl">⭐</span>
          </button>
        )
      })}
    </div>
    
    {/* Show label for selected rating */}
    {ratings[category.category_name] > 0 && (
      <div className="mt-2 text-sm font-medium text-blue-600">
        {category.scale_labels?.[String(ratings[category.category_name])] || 
          (ratings[category.category_name] === 1 ? 'Terrible' : 
           ratings[category.category_name] === 2 ? 'Poor' : 
           ratings[category.category_name] === 3 ? 'Good' : 
           ratings[category.category_name] === 4 ? 'Great' : 
           'Amazing')}
      </div>
    )}
  </div>
))}
```

## Database Migration

**IMPORTANT:** This requires database recreation because we're adding a new column.

**On EC2 after deploying backend code:**

```bash
# Recreate database (simplest approach pre-launch)
cd ~/yamily-app/backend
rm yamily.db

# Restart backend (will recreate database with new schema)
kill $(ps aux | grep uvicorn | grep -v grep | awk '{print $2}')
sleep 2
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --limit-max-requests 52428800 > /dev/null 2>&1 &
```

## Testing After Implementation

1. **Create event with default scales:**
   - Create event without customizing scales
   - Verify categories created with default scale_labels
   
2. **Create event with custom scales:**
   - Create event
   - Expand "Customize rating labels"
   - Enter custom labels (e.g., Competition: "Boring" to "Cutthroat")
   - Save event
   - Verify custom scales saved

3. **Submit review with custom scales:**
   - Go to review form
   - Verify custom labels show in review form
   - Rate categories
   - Verify selected rating shows its label
   - Submit review
   - Verify review stored with numeric 1-5 value

4. **Check summary page:**
   - Verify averages calculate correctly
   - Verify custom category names show

**Deliverable:** Hosts can customize 1-5 rating labels per category

---

# TASK 3: EN-008 - PWA Investigation & Fix

**Time:** 1-2 hours
**Priority:** Medium - "Add to Home Screen" should work

## Overview

PWA may have been implemented but "Add to Home Screen" is not appearing on mobile. Need to debug and fix.

## Step 1: Check if PWA Files Exist

**Check for manifest.json:**

```bash
# Should exist at: frontend/public/manifest.json
ls -la frontend/public/manifest.json
```

**If missing, create manifest.json:**

**File: `frontend/public/manifest.json`**

```json
{
  "name": "Yamily",
  "short_name": "Yamily",
  "description": "Rate your gatherings. Because every dinner party deserves a rating.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## Step 2: Check if Manifest is Linked

**File: `frontend/app/layout.js`**

**Make sure manifest and icons are linked in the head:**

```javascript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Existing meta tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* PWA Meta Tags - ADD THESE */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="description" content="Rate your gatherings. Because every dinner party deserves a rating." />
        
        {/* Apple Touch Icon - CRITICAL for iOS */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Yamily" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

## Step 3: Create Icons

**You need these icon files in `frontend/public/`:**

1. **icon-192.png** - 192x192px PNG
2. **icon-512.png** - 512x512px PNG  
3. **apple-touch-icon.png** - 180x180px PNG

**If icons don't exist:**

Option A: Use a placeholder (temporary):
- Create simple colored squares as placeholders
- Replace with real icons later

Option B: Generate from existing logo:
- If there's a logo file, resize it to these dimensions
- Export as PNG files

**Quick placeholder creation (if needed):**

Create a simple SVG icon and convert to PNG at the required sizes. For now, you can use any square image at the right dimensions.

## Step 4: Test PWA Installation

**iOS Safari:**
1. Open site on iPhone
2. Tap Share button
3. Look for "Add to Home Screen"
4. Should appear if manifest + apple-touch-icon are correct

**Android Chrome:**
1. Open site on Android
2. Look for install banner/prompt
3. Or tap menu → "Add to Home Screen"

**Desktop Chrome:**
1. Open site
2. Look for install icon in address bar (right side)
3. Click to install

## Step 5: Debug Console Errors

**If still not working:**

1. Open browser dev tools on mobile
2. Check Console tab for errors
3. Check Application/Manifest tab (Chrome)
4. Look for:
   - Manifest parsing errors
   - Icon loading errors
   - Missing HTTPS (shouldn't be issue on Vercel)

**Common issues:**

**Manifest not found:**
- Check path: `/manifest.json` not `/public/manifest.json`
- Verify file exists in `frontend/public/`

**Icons not loading:**
- Check paths in manifest match actual file names
- Verify files exist in `frontend/public/`

**iOS not working:**
- Must have `apple-touch-icon` link in head
- Must have `apple-mobile-web-app-capable` meta tag
- Icon must be 180x180px minimum

**Android not working:**
- Check manifest theme_color is valid hex
- Check start_url is correct
- Verify HTTPS (should be fine on Vercel)

## Minimal Working PWA Checklist

✅ manifest.json exists in /public
✅ manifest.json is valid JSON
✅ manifest linked in layout.js
✅ Icons exist (192px, 512px, apple 180px)
✅ Icons referenced correctly in manifest
✅ apple-touch-icon linked in layout.js
✅ HTTPS enabled (Vercel handles this)
✅ No console errors

## Testing After Implementation

1. **Desktop Chrome:**
   - Visit https://yamily.app
   - Check address bar for install icon
   - Click to install
   - Verify app opens in standalone window

2. **iOS Safari:**
   - Visit https://yamily.app
   - Tap Share button
   - Verify "Add to Home Screen" appears
   - Add to home screen
   - Verify icon appears on home screen
   - Open from home screen
   - Verify opens without Safari chrome

3. **Android Chrome:**
   - Visit https://yamily.app
   - Check for install banner
   - Or menu → "Add to Home Screen"
   - Verify app installs
   - Open from home screen
   - Verify standalone mode

**Deliverable:** PWA installable on iOS, Android, and Desktop

---

# DEPLOYMENT SEQUENCE

## After Task 1 (Messaging Update)

**Frontend only:**

```bash
cd ~/yamily-app
git add .
git commit -m "Update messaging for all gatherings (not just family)"
git push origin main

# Vercel auto-deploys in 2-3 minutes
# Test: Visit yamily.app and verify homepage says "Rate Your Gatherings"
```

## After Task 2 (Custom Scales)

**Backend + Frontend:**

```bash
# 1. Push code to GitHub
cd ~/yamily-app
git add .
git commit -m "Add custom rating scales per category"
git push origin main

# 2. SSH to EC2 and deploy backend
ssh -i ~/.ssh/yamily-ec2-key.pem ubuntu@32.192.255.113

# 3. Pull, recreate DB, restart
cd ~/yamily-app && \
git pull && \
cd backend && \
rm yamily.db && \
kill $(ps aux | grep uvicorn | grep -v grep | awk '{print $2}') && \
sleep 2 && \
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --limit-max-requests 52428800 > /dev/null 2>&1 &

# 4. Verify backend is running
ps aux | grep uvicorn

# 5. Test: Create event with custom scales
```

## After Task 3 (PWA)

**Frontend only:**

```bash
cd ~/yamily-app
git add .
git commit -m "Add PWA support - manifest, icons, meta tags"
git push origin main

# Vercel auto-deploys
# Test: Try "Add to Home Screen" on mobile
```

---

# TESTING CHECKLIST

After all three tasks are complete:

## Messaging (Task 1)
- [ ] Homepage says "Rate Your Gatherings" not "Family Gatherings"
- [ ] Homepage has tagline "Because every dinner party deserves a rating"
- [ ] Create event page doesn't mention "family"
- [ ] My events page uses generic language
- [ ] Examples mix family and friend contexts

## Custom Scales (Task 2)
- [ ] Create event with default categories → uses themed scales
- [ ] Create event with custom category → can customize scale labels
- [ ] Expand "Customize rating labels" → shows 5 inputs
- [ ] Enter custom labels → saves with event
- [ ] Review form shows custom labels
- [ ] Submit review → stores numeric 1-5 value
- [ ] Summary page calculates averages correctly

## PWA (Task 3)
- [ ] manifest.json exists and is valid
- [ ] Icons exist (192, 512, apple 180)
- [ ] Desktop Chrome shows install icon
- [ ] iOS Safari shows "Add to Home Screen"
- [ ] Android shows install prompt
- [ ] App opens in standalone mode
- [ ] No console errors

## Integration
- [ ] Complete user flow: register → create event → custom categories/scales → invite → join → live feed → review with custom scales → summary
- [ ] Cross-browser (Chrome, Safari, Edge)
- [ ] Mobile (iOS, Android)
- [ ] All deployments successful

---

# SUCCESS CRITERIA

**End of day, you should have:**

1. ✅ **Messaging Updated**
   - App says "gatherings" not "family gatherings"
   - Correct positioning for broader market
   - Homepage tagline: "Because every dinner party deserves a rating"

2. ✅ **Custom Scales Working**
   - Hosts can customize 1-5 labels per category
   - Examples: "Boring → Cutthroat", "Mild → Fire Alarm"
   - Review form shows custom labels
   - Still stores numeric values

3. ✅ **PWA Installable**
   - "Add to Home Screen" works on iOS
   - Install prompt works on Android
   - Desktop install works
   - App opens in standalone mode

4. ✅ **Everything Tested**
   - Complete flows work
   - No critical bugs
   - Ready for user testing tomorrow

---

# TIME ESTIMATES

**Task 1 (Messaging):** 1-2 hours
**Task 2 (Custom Scales):** 2-3 hours
**Task 3 (PWA):** 1-2 hours

**Total:** 4-7 hours

**Then:** 5 days of testing before March 17 launch! 🚀

---

# NOTES FOR CLAUDE CODE

- Implement tasks in order (1 → 2 → 3)
- Test after each task
- Deploy incrementally
- Database recreation required for Task 2
- All reference files are in `/mnt/user-data/outputs/`
- This is pre-launch so losing test data is fine
- Focus on functionality over perfection
- Mark will handle final testing and polish

**Good luck! You've got this!** 💪
