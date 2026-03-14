# EN-001: User Feedback Form (Database Storage)

**Priority:** P1 - High
**Estimated Time:** 2-3 hours
**Status:** Ready for Implementation
**Approach:** Database storage for all feedback

---

## Overview

Add a user feedback form where users can submit enhancement requests, bug reports, and general feedback directly from the app. All feedback will be stored in the database for easy review and management.

**Goal:** Make it easy for users to share feedback during and after St. Patrick's Day testing, with all feedback stored in one central location.

---

## User Stories

- As a user, I want to report bugs I encounter
- As a user, I want to suggest new features
- As a user, I want to share general feedback about the app
- As the app owner, I want all feedback stored in the database
- As the app owner, I want to easily view all submitted feedback

---

## PART 1: Backend - Database Model & Endpoint

### Step 1: Add Feedback Model

**File: `backend/app/models.py`**

**ADD this model (after User model):**

```python
class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null if anonymous
    feedback_type = Column(String)  # feature, bug, improvement, other
    message = Column(Text)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="new")  # new, reviewed, resolved
    
    # Relationship to User
    user = relationship("User", back_populates="feedback")
```

**ALSO UPDATE the User model to add the relationship:**

```python
class User(Base):
    __tablename__ = "users"
    
    # ... existing fields ...
    
    # ADD this relationship at the end:
    feedback = relationship("Feedback", back_populates="user")
```

---

### Step 2: Add Feedback Schema

**File: `backend/app/schemas.py`**

**ADD these schemas:**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Request schema
class FeedbackCreate(BaseModel):
    feedback_type: str  # feature, bug, improvement, other
    message: str
    name: Optional[str] = "Anonymous"
    email: Optional[str] = None

# Response schema
class FeedbackResponse(BaseModel):
    id: int
    user_id: Optional[int]
    feedback_type: str
    message: str
    name: Optional[str]
    email: Optional[str]
    created_at: datetime
    status: str
    
    class Config:
        from_attributes = True
```

---

### Step 3: Add Feedback Endpoint

**File: `backend/app/main.py`**

**ADD this helper function (after get_current_user):**

```python
def get_current_user_optional(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> Optional[models.User]:
    """
    Get current user if logged in, otherwise return None.
    Allows anonymous users to submit feedback.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        user = db.query(models.User).filter(models.User.email == email).first()
        return user
    except:
        return None
```

**ADD the feedback endpoint:**

```python
@app.post("/feedback", response_model=schemas.FeedbackResponse)
def submit_feedback(
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    """
    Submit user feedback.
    Can be called by logged-in users or anonymous users.
    """
    
    # Create feedback entry
    new_feedback = models.Feedback(
        user_id=current_user.id if current_user else None,
        feedback_type=feedback.feedback_type,
        message=feedback.message,
        name=feedback.name if feedback.name else (current_user.name if current_user else "Anonymous"),
        email=feedback.email if feedback.email else (current_user.email if current_user else None),
        status="new"
    )
    
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    return new_feedback


@app.get("/admin/feedback")
def get_all_feedback(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get all feedback submissions.
    For now, any logged-in user can view. Add admin check later if needed.
    """
    feedback_list = db.query(models.Feedback).order_by(
        models.Feedback.created_at.desc()
    ).all()
    
    return feedback_list
```

---

## PART 2: Frontend - Feedback Form Component

### Step 1: Create Feedback Modal Component

**File: `frontend/app/components/FeedbackModal.js`**

**CREATE this new file:**

```javascript
'use client'

import { useState } from 'react'
import { API_URL } from '@/app/lib/api'

export default function FeedbackModal({ isOpen, onClose }) {
  const [feedbackType, setFeedbackType] = useState('feature')
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!message.trim()) {
      alert('Please enter your feedback')
      return
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          feedback_type: feedbackType,
          message: message,
          name: name || 'Anonymous',
          email: email || null
        })
      })

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          onClose()
          // Reset form
          setFeedbackType('feature')
          setMessage('')
          setName('')
          setEmail('')
          setSubmitted(false)
        }, 2000)
      } else {
        const error = await response.json()
        alert(`Failed to submit feedback: ${error.detail || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Feedback error:', err)
      alert('Error submitting feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {submitted ? (
          // Success state
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Thanks for your feedback!
            </h3>
            <p className="text-gray-700">
              We'll review it soon and get back to you if needed.
            </p>
          </div>
        ) : (
          // Form state
          <>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Share Your Feedback
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Feedback Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  What would you like to share?
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="feature">💡 Feature Request</option>
                  <option value="bug">🐛 Bug Report</option>
                  <option value="improvement">✨ Improvement Idea</option>
                  <option value="other">💬 General Feedback</option>
                </select>
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Your feedback *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
                  rows="5"
                  required
                />
              </div>

              {/* Optional: Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* Optional: Email */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email (optional - if you want a reply)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
```

---

### Step 2: Add Feedback Button to App

**Option A: Add to existing navbar (if you have one)**

**File: `frontend/app/components/Navbar.js` or wherever navbar exists**

**ADD:**

```javascript
import { useState } from 'react'
import FeedbackModal from './FeedbackModal'

// In component:
const [showFeedback, setShowFeedback] = useState(false)

// In navbar (near Logout or in user menu):
<button
  onClick={() => setShowFeedback(true)}
  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
>
  💬 Feedback
</button>

// At end of navbar component:
<FeedbackModal 
  isOpen={showFeedback} 
  onClose={() => setShowFeedback(false)} 
/>
```

---

**Option B: Add to My Events page as a prominent button**

**File: `frontend/app/my-events/page.js`**

**ADD at top of file:**

```javascript
import { useState } from 'react'
import FeedbackModal from '../components/FeedbackModal'

// In component:
const [showFeedback, setShowFeedback] = useState(false)

// Add this button somewhere prominent (maybe in the header):
<button
  onClick={() => setShowFeedback(true)}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
>
  💬 Share Feedback
</button>

// At end of component (before closing div):
<FeedbackModal 
  isOpen={showFeedback} 
  onClose={() => setShowFeedback(false)} 
/>
```

---

## PART 3: View Feedback (Simple Admin Page)

**File: `frontend/app/admin/feedback/page.js`**

**CREATE this new page:**

```javascript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_URL } from '@/app/lib/api'

export default function AdminFeedbackPage() {
  const router = useRouter()
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedback()
  }, [])

  async function fetchFeedback() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${API_URL}/admin/feedback`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFeedback(data)
      } else {
        alert('Failed to load feedback')
      }
    } catch (err) {
      console.error('Error loading feedback:', err)
      alert('Error loading feedback')
    } finally {
      setLoading(false)
    }
  }

  const typeEmojis = {
    feature: '💡',
    bug: '🐛',
    improvement: '✨',
    other: '💬'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading feedback...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          User Feedback
        </h1>

        {feedback.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No feedback yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{typeEmojis[item.feedback_type] || '💬'}</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {item.feedback_type}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                  {item.message}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-3">
                  <span>From: {item.name || 'Anonymous'}</span>
                  {item.email && (
                    <span>Email: {item.email}</span>
                  )}
                  <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Database Migration

**IMPORTANT: This adds a new table, so database must be recreated!**

**On deployment, the database will need to be recreated to add the `feedback` table.**

---

## Testing

### Test 1: Submit Feedback (Logged In)

1. Login to Yamily
2. Click "Feedback" button
3. **Verify:** Modal opens
4. Select "Feature Request"
5. Enter message: "Test feature request"
6. Leave name/email blank (should use logged-in user's info)
7. Click "Send Feedback"
8. **Verify:** Success message appears
9. **Verify:** Modal closes after 2 seconds

### Test 2: View Feedback in Database

1. SSH to EC2:
   ```bash
   ssh -i ~/.ssh/yamily-ec2-key.pem ubuntu@32.192.255.113
   ```

2. Check database:
   ```bash
   cd ~/yamily-app/backend
   sqlite3 yamily.db
   
   SELECT * FROM feedback;
   
   .quit
   ```

3. **Verify:** Feedback stored with all fields

### Test 3: View Feedback in Admin Page

1. Go to https://yamily.app/admin/feedback
2. **Verify:** All feedback entries display
3. **Verify:** Shows type, message, name, email, date
4. **Verify:** Status shows "new"

### Test 4: Anonymous Feedback (Logged Out)

1. Logout
2. If feedback button accessible, click it
3. Submit feedback with custom name/email
4. **Verify:** Works without login
5. **Verify:** Stored with user_id = null

---

## Deployment Steps

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Add user feedback form with database storage"
git push origin main
```

**Vercel auto-deploys frontend in 2-3 minutes**

### Step 2: Deploy Backend with Database Recreation

**SSH to EC2:**

```bash
ssh -i ~/.ssh/yamily-ec2-key.pem ubuntu@32.192.255.113
```

**Pull code and recreate database:**

```bash
cd ~/yamily-app
git pull origin main

cd backend

# Backup old database
cp yamily.db yamily.db.backup_$(date +%Y%m%d_%H%M%S)

# Delete old database (will recreate with new schema)
rm yamily.db

# Restart backend
kill $(ps aux | grep uvicorn | grep -v grep | awk '{print $2}')
sleep 2
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --limit-max-requests 52428800 > /dev/null 2>&1 &

# Verify running
ps aux | grep uvicorn
```

**⚠️ Note: This will delete all existing data (test events, users, etc.). That's expected since we're adding a new table.**

---

## Expected Outcome

**After implementation:**

**Users can:**
- ✅ Click "Feedback" button from anywhere
- ✅ Submit bug reports, feature requests, improvements, general feedback
- ✅ Provide optional name/email for follow-up
- ✅ Get immediate confirmation after submission

**You can:**
- ✅ View all feedback at /admin/feedback
- ✅ See feedback type, message, who submitted, when
- ✅ Query database directly on EC2 if needed
- ✅ Export feedback for analysis

---

## Files Created/Modified

**New files:**
- `frontend/app/components/FeedbackModal.js` - Feedback form component
- `frontend/app/admin/feedback/page.js` - Admin feedback viewer
- Database: `feedback` table (auto-created)

**Modified files:**
- `backend/app/models.py` - Added Feedback model
- `backend/app/schemas.py` - Added feedback schemas
- `backend/app/main.py` - Added feedback endpoints
- Navbar or my-events page - Added feedback button

---

## Time Estimate

**Total: 2-3 hours**

- Backend model/endpoint: 1 hour
- Frontend modal component: 45 min
- Admin viewer page: 30 min
- Testing: 30 min
- Deployment: 15 min

---

## Future Enhancements

**Post-MVP:**
- Mark feedback as "reviewed" or "resolved"
- Reply to feedback via email
- Categorize and tag feedback
- Upvoting system for feature requests
- Public roadmap based on feedback
- Email notifications when new feedback submitted

---

## Priority: P1 - High

**Why this matters:**
- Captures user feedback during St. Patrick's Day testing
- Stores all feedback in one central location
- Easy to review and prioritize
- Shows users you care about their input

**Deploy this before St. Patrick's Day so you can capture feedback during the party!** 🎯

---

**All feedback will be stored in the database and viewable at /admin/feedback!** 📊
