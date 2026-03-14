# EN-002: Event Summary/Recap View + Admin Dashboard

**Priority:** P1 - High
**Estimated Time:** 4-5 hours
**Status:** Ready for Implementation

---

## Overview

Create two related features:
1. **Event Summary Page:** Beautiful recap of completed events (shareable, FOMO generator)
2. **Admin Dashboard:** View all events in summary form

**Goal:** Generate FOMO for people who didn't attend, plus give admins easy visibility into all events.

---

## PART 1: Event Summary Page

### Route: `/events/[id]/summary`

**What it shows:**
- Event header (name, date, status)
- Key stats (total attendees, total comments, total reviews, avg ratings)
- Photo gallery (all photos from Live Feed)
- All reviews with ratings
- All comments chronologically
- "You missed out!" energy

**Who can access:**
- Anyone with the link (including non-attendees)
- Works even if not logged in
- Perfect for sharing

---

### Step 1: Create Summary Page Component

**File: `frontend/app/events/[id]/summary/page.js`**

**CREATE this new file:**

```javascript
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { API_URL } from '@/app/lib/api'
import Link from 'next/link'

export default function EventSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id

  const [event, setEvent] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEventSummary()
  }, [eventId])

  async function fetchEventSummary() {
    try {
      // This endpoint works without authentication
      const response = await fetch(`${API_URL}/events/${eventId}/summary`)

      if (!response.ok) {
        throw new Error('Failed to fetch event summary')
      }

      const data = await response.json()
      setEvent(data.event)
      setSummary(data.summary)
    } catch (err) {
      console.error('Error:', err)
      setError('Unable to load event summary')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading event recap...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-700 text-lg mb-4">{error || 'Event not found'}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  // Calculate average ratings
  const avgFood = summary.avg_ratings.food || 0
  const avgDrama = summary.avg_ratings.drama || 0
  const avgAlcohol = summary.avg_ratings.alcohol || 0
  const avgConversation = summary.avg_ratings.conversation || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Back to Yamily
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {event.event_name}
          </h1>
          <p className="text-gray-600">
            Event Recap • {new Date(event.event_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        {/* FOMO Message */}
        {event.status === 'ended' && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 mb-8 text-center shadow-lg">
            <p className="text-xl font-bold mb-2">
              You missed out! 🎉
            </p>
            <p className="text-purple-100">
              Here's what happened at {event.event_name}
            </p>
          </div>
        )}

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {summary.total_attendees}
            </div>
            <div className="text-sm text-gray-600">
              {summary.total_attendees === 1 ? 'Guest' : 'Guests'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {summary.total_reviews}
            </div>
            <div className="text-sm text-gray-600">
              {summary.total_reviews === 1 ? 'Review' : 'Reviews'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {summary.total_comments}
            </div>
            <div className="text-sm text-gray-600">
              {summary.total_comments === 1 ? 'Comment' : 'Comments'}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {summary.total_photos}
            </div>
            <div className="text-sm text-gray-600">
              {summary.total_photos === 1 ? 'Photo' : 'Photos'}
            </div>
          </div>
        </div>

        {/* Average Ratings */}
        {summary.total_reviews > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Overall Ratings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">🍽️ Food</span>
                  <span className="text-gray-900 font-bold">
                    {avgFood.toFixed(1)} / 5
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${(avgFood / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">🎭 Drama</span>
                  <span className="text-gray-900 font-bold">
                    {avgDrama.toFixed(1)} / 5
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-purple-600 h-3 rounded-full"
                    style={{ width: `${(avgDrama / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">🍷 Alcohol</span>
                  <span className="text-gray-900 font-bold">
                    {avgAlcohol.toFixed(1)} / 5
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full"
                    style={{ width: `${(avgAlcohol / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700 font-medium">💬 Conversation</span>
                  <span className="text-gray-900 font-bold">
                    {avgConversation.toFixed(1)} / 5
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-orange-600 h-3 rounded-full"
                    style={{ width: `${(avgConversation / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {summary.photos.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Photo Highlights ({summary.photos.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {summary.photos.map((photo, index) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden shadow-md">
                  <img
                    src={photo.photo_url}
                    alt={`Event photo ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {summary.reviews.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Reviews ({summary.reviews.length})
            </h2>
            <div className="space-y-6">
              {summary.reviews.map(review => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {review.display_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {review.display_name || 'Anonymous'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="text-center py-2 bg-blue-50 rounded">
                      <div className="text-xs text-gray-600 mb-1">Food</div>
                      <div className="font-bold text-blue-600">
                        {'⭐'.repeat(review.food_rating)}
                      </div>
                    </div>
                    <div className="text-center py-2 bg-purple-50 rounded">
                      <div className="text-xs text-gray-600 mb-1">Drama</div>
                      <div className="font-bold text-purple-600">
                        {'⭐'.repeat(review.drama_rating)}
                      </div>
                    </div>
                    <div className="text-center py-2 bg-green-50 rounded">
                      <div className="text-xs text-gray-600 mb-1">Alcohol</div>
                      <div className="font-bold text-green-600">
                        {'⭐'.repeat(review.alcohol_rating)}
                      </div>
                    </div>
                    <div className="text-center py-2 bg-orange-50 rounded">
                      <div className="text-xs text-gray-600 mb-1">Conversation</div>
                      <div className="font-bold text-orange-600">
                        {'⭐'.repeat(review.conversation_rating)}
                      </div>
                    </div>
                  </div>

                  {review.memorable_moment && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
                      <div className="text-xs font-semibold text-gray-600 mb-1">
                        💭 Memorable Moment
                      </div>
                      <p className="text-gray-800">{review.memorable_moment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {summary.comments.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Live Feed Highlights ({summary.comments.length})
            </h2>
            <div className="space-y-4">
              {summary.comments.map(comment => (
                <div key={comment.id} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {comment.display_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {comment.display_name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {comment.comment_text && (
                        <p className="text-gray-700 mb-2">{comment.comment_text}</p>
                      )}
                      {comment.photo_url && (
                        <img
                          src={comment.photo_url}
                          alt="Comment photo"
                          className="rounded-lg max-w-sm shadow-md"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-3">
            Don't miss the next one!
          </h3>
          <p className="text-blue-100 mb-6">
            Join Yamily to rate and review your own gatherings
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

### Step 2: Backend - Summary Endpoint

**File: `backend/app/main.py`**

**ADD this endpoint:**

```python
from sqlalchemy import func

@app.get("/events/{event_id}/summary")
def get_event_summary(event_id: int, db: Session = Depends(get_db)):
    """
    Get event summary - accessible without authentication.
    Perfect for sharing with people who didn't attend.
    """
    
    # Get event
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get all guests
    guests = db.query(models.EventGuest).filter(
        models.EventGuest.event_id == event_id,
        models.EventGuest.joined == True
    ).all()
    
    # Get all reviews
    reviews = db.query(models.EventReview).filter(
        models.EventReview.event_id == event_id
    ).all()
    
    # Get all comments
    comments = db.query(models.EventComment).filter(
        models.EventComment.event_id == event_id
    ).order_by(models.EventComment.created_at.desc()).all()
    
    # Calculate average ratings
    avg_food = db.query(func.avg(models.EventReview.food_rating)).filter(
        models.EventReview.event_id == event_id
    ).scalar() or 0
    
    avg_drama = db.query(func.avg(models.EventReview.drama_rating)).filter(
        models.EventReview.event_id == event_id
    ).scalar() or 0
    
    avg_alcohol = db.query(func.avg(models.EventReview.alcohol_rating)).filter(
        models.EventReview.event_id == event_id
    ).scalar() or 0
    
    avg_conversation = db.query(func.avg(models.EventReview.conversation_rating)).filter(
        models.EventReview.event_id == event_id
    ).scalar() or 0
    
    # Count photos
    photos = [c for c in comments if c.photo_url]
    
    # Build summary
    summary = {
        "event": {
            "id": event.id,
            "event_name": event.event_name,
            "event_date": event.event_date,
            "status": event.status,
            "description": event.description
        },
        "summary": {
            "total_attendees": len(guests),
            "total_reviews": len(reviews),
            "total_comments": len(comments),
            "total_photos": len(photos),
            "avg_ratings": {
                "food": float(avg_food),
                "drama": float(avg_drama),
                "alcohol": float(avg_alcohol),
                "conversation": float(avg_conversation)
            },
            "reviews": [
                {
                    "id": r.id,
                    "display_name": r.guest.display_name if r.guest else "Anonymous",
                    "food_rating": r.food_rating,
                    "drama_rating": r.drama_rating,
                    "alcohol_rating": r.alcohol_rating,
                    "conversation_rating": r.conversation_rating,
                    "memorable_moment": r.memorable_moment,
                    "created_at": r.created_at
                }
                for r in reviews
            ],
            "comments": [
                {
                    "id": c.id,
                    "display_name": c.guest.display_name if c.guest else "Anonymous",
                    "comment_text": c.comment_text,
                    "photo_url": c.photo_url,
                    "created_at": c.created_at
                }
                for c in comments
            ],
            "photos": [
                {
                    "photo_url": c.photo_url,
                    "created_at": c.created_at
                }
                for c in photos
            ]
        }
    }
    
    return summary
```

---

## PART 2: Admin Dashboard

### Route: `/admin/events`

**What it shows:**
- All events in the system
- Event summary cards for each
- Key stats at a glance
- Filter by status (upcoming/live/ended)
- Search by name

---

### Step 1: Create Admin Events Page

**File: `frontend/app/admin/events/page.js`**

**CREATE this new file:**

```javascript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_URL } from '@/app/lib/api'
import Link from 'next/link'

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, live, ended
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAllEvents()
  }, [])

  async function fetchAllEvents() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${API_URL}/admin/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        alert('Failed to load events')
      }
    } catch (err) {
      console.error('Error loading events:', err)
      alert('Error loading events')
    } finally {
      setLoading(false)
    }
  }

  // Filter events
  const filteredEvents = events.filter(event => {
    // Filter by status
    if (filter !== 'all' && event.event.status !== filter) {
      return false
    }
    
    // Filter by search term
    if (searchTerm && !event.event.event_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    return true
  })

  // Get status counts
  const upcomingCount = events.filter(e => e.event.status === 'upcoming').length
  const liveCount = events.filter(e => e.event.status === 'live').length
  const endedCount = events.filter(e => e.event.status === 'ended').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading events...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin - All Events
          </h1>
          <p className="text-gray-600">
            View and manage all events in the system
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {events.length}
            </div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {upcomingCount}
            </div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {liveCount}
            </div>
            <div className="text-sm text-gray-600">Live</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {endedCount}
            </div>
            <div className="text-sm text-gray-600">Ended</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'live'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setFilter('ended')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ended'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ended
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(({ event, summary }) => (
              <div key={event.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                {/* Event Header */}
                <div className={`px-6 py-4 rounded-t-lg ${
                  event.status === 'upcoming' ? 'bg-blue-600' :
                  event.status === 'live' ? 'bg-green-600' :
                  'bg-gray-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white uppercase">
                      {event.status}
                    </span>
                    <span className="text-xs text-white">
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {event.event_name}
                  </h3>
                </div>

                {/* Stats */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {summary.total_attendees}
                      </div>
                      <div className="text-xs text-gray-600">Guests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">
                        {summary.total_reviews}
                      </div>
                      <div className="text-xs text-gray-600">Reviews</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        {summary.total_comments}
                      </div>
                      <div className="text-xs text-gray-600">Comments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">
                        {summary.total_photos}
                      </div>
                      <div className="text-xs text-gray-600">Photos</div>
                    </div>
                  </div>

                  {/* Average Ratings */}
                  {summary.total_reviews > 0 && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="text-xs font-semibold text-gray-600 mb-2">
                        Average Ratings
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          Food: <span className="font-bold">{summary.avg_ratings.food.toFixed(1)}</span>
                        </div>
                        <div>
                          Drama: <span className="font-bold">{summary.avg_ratings.drama.toFixed(1)}</span>
                        </div>
                        <div>
                          Alcohol: <span className="font-bold">{summary.avg_ratings.alcohol.toFixed(1)}</span>
                        </div>
                        <div>
                          Conv: <span className="font-bold">{summary.avg_ratings.conversation.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/events/${event.id}`}
                      className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                    >
                      View Event
                    </Link>
                    <Link
                      href={`/events/${event.id}/summary`}
                      className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                    >
                      Summary
                    </Link>
                  </div>
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

### Step 2: Backend - Admin Events Endpoint

**File: `backend/app/main.py`**

**ADD this endpoint:**

```python
@app.get("/admin/events")
def get_all_events_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Admin endpoint: Get all events with summary data.
    For now, any logged-in user can access. Add admin check later if needed.
    """
    
    # Get all events
    events = db.query(models.Event).order_by(models.Event.event_date.desc()).all()
    
    result = []
    for event in events:
        # Get summary data for each event
        guests = db.query(models.EventGuest).filter(
            models.EventGuest.event_id == event.id,
            models.EventGuest.joined == True
        ).all()
        
        reviews = db.query(models.EventReview).filter(
            models.EventReview.event_id == event.id
        ).all()
        
        comments = db.query(models.EventComment).filter(
            models.EventComment.event_id == event.id
        ).all()
        
        # Calculate averages
        avg_food = db.query(func.avg(models.EventReview.food_rating)).filter(
            models.EventReview.event_id == event.id
        ).scalar() or 0
        
        avg_drama = db.query(func.avg(models.EventReview.drama_rating)).filter(
            models.EventReview.event_id == event.id
        ).scalar() or 0
        
        avg_alcohol = db.query(func.avg(models.EventReview.alcohol_rating)).filter(
            models.EventReview.event_id == event.id
        ).scalar() or 0
        
        avg_conversation = db.query(func.avg(models.EventReview.conversation_rating)).filter(
            models.EventReview.event_id == event.id
        ).scalar() or 0
        
        photos = [c for c in comments if c.photo_url]
        
        result.append({
            "event": {
                "id": event.id,
                "event_name": event.event_name,
                "event_date": event.event_date,
                "status": event.status,
                "host_id": event.host_id
            },
            "summary": {
                "total_attendees": len(guests),
                "total_reviews": len(reviews),
                "total_comments": len(comments),
                "total_photos": len(photos),
                "avg_ratings": {
                    "food": float(avg_food),
                    "drama": float(avg_drama),
                    "alcohol": float(avg_alcohol),
                    "conversation": float(avg_conversation)
                }
            }
        })
    
    return result
```

---

## PART 3: Add "View Summary" Button to Event Detail Page

**File: `frontend/app/events/[id]/page.js`**

**ADD this button to the event header (near the status banner):**

```javascript
{/* Add this after the status banner */}
{event.status === 'ended' && (
  <Link
    href={`/events/${eventId}/summary`}
    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold transition-colors shadow-md"
  >
    📊 View Event Summary
  </Link>
)}
```

---

## Testing

### Test Event Summary Page

1. Create test event, add reviews/comments/photos
2. End the event
3. Go to `/events/{id}/summary`
4. **Verify:**
   - Stats show correct numbers
   - Average ratings calculate correctly
   - Photos display in gallery
   - Reviews show with all ratings
   - Comments show chronologically
   - Page works WITHOUT being logged in (shareable!)

### Test Admin Dashboard

1. Login as any user
2. Go to `/admin/events`
3. **Verify:**
   - All events display
   - Stats show correctly for each event
   - Filter buttons work (all/upcoming/live/ended)
   - Search works
   - "View Event" and "Summary" buttons work
   - Event cards color-coded by status

---

## Deployment

**Frontend only (no database changes):**

```bash
# Push to GitHub
git add .
git commit -m "Add event summary page and admin dashboard"
git push origin main

# Vercel auto-deploys in 2-3 minutes
```

**Backend changes needed:**

```bash
# SSH to EC2
ssh -i ~/.ssh/yamily-ec2-key.pem ubuntu@32.192.255.113

# Pull and restart
cd ~/yamily-app && git pull && cd backend && kill $(ps aux | grep uvicorn | grep -v grep | awk '{print $2}') && sleep 2 && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --limit-max-requests 52428800 > /dev/null 2>&1 &
```

---

## Expected Outcome

**Event Summary Page (`/events/[id]/summary`):**
- ✅ Beautiful, shareable recap of ended events
- ✅ Works without login (anyone with link can view)
- ✅ Shows all photos, reviews, comments
- ✅ "You missed out!" FOMO energy
- ✅ CTA to join Yamily
- ✅ Perfect for sharing with non-attendees

**Admin Dashboard (`/admin/events`):**
- ✅ See all events at a glance
- ✅ Key stats for each event
- ✅ Filter by status
- ✅ Search by name
- ✅ Quick access to event detail and summary
- ✅ Color-coded status indicators

---

## Files Created/Modified

**New files:**
- `frontend/app/events/[id]/summary/page.js` - Event summary page
- `frontend/app/admin/events/page.js` - Admin dashboard

**Modified files:**
- `backend/app/main.py` - Added `/events/{id}/summary` and `/admin/events` endpoints
- `frontend/app/events/[id]/page.js` - Added "View Summary" button (optional)

---

## Time Estimate

**Total: 4-5 hours**

- Event summary page: 2 hours
- Backend summary endpoint: 45 min
- Admin dashboard: 1.5 hours
- Backend admin endpoint: 30 min
- Testing: 45 min

---

## Why This Is Awesome

**Event Summary:**
- ✅ Generate FOMO for people who didn't attend
- ✅ Shareable link (works without login)
- ✅ Beautiful presentation of event data
- ✅ Drives future attendance
- ✅ Great for social sharing

**Admin Dashboard:**
- ✅ See everything at a glance
- ✅ Monitor event activity
- ✅ Quick access to any event
- ✅ Professional admin experience

**Together:**
- ✅ Summary page drives signups (FOMO effect)
- ✅ Admin dashboard helps you manage growth
- ✅ Both features are highly polished

---

## When Done, Report:

1. ✅ Event summary page working
2. ✅ Summary accessible without login
3. ✅ All stats calculate correctly
4. ✅ Photos display properly
5. ✅ Admin dashboard shows all events
6. ✅ Filtering and search work
7. ✅ Both deployed to production
8. ✅ Screenshots of both pages

---

**This gives you both user-facing FOMO generation AND admin visibility!** 🎯
