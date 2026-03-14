'use client'
// IMPORTS - Tools and components we need
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '../../components/Navbar'
import { API_URL } from '../../lib/api'

export default function EventDetail() {
  // ROUTING - Get event ID from URL and navigate
  const router = useRouter()
  const params = useParams()
  const eventId = params.id
  
  // STATE - Track event details
  const [event, setEvent] = useState(null)

  // STATE - Track all reviews for this event
  const [reviews, setReviews] = useState([])

  // STATE - Track if user is logged in
  const [user, setUser] = useState(null)

  // STATE - Track loading state
  const [loading, setLoading] = useState(true)

  // STATE - Track errors
  const [error, setError] = useState('')

  // STATE - Track active tab (reviews or feed)
  const [activeTab, setActiveTab] = useState('reviews')

  // STATE - Track comments for feed
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [postingComment, setPostingComment] = useState(false)

  // STATE - Track photo uploads
  const [selectedPhoto, setSelectedPhoto] = useState(null) // base64 data URL
  const [photoPreview, setPhotoPreview] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null) // For lightbox

  // STATE - Track guests
  const [guests, setGuests] = useState([])

  // STATE - Track event status and lifecycle
  const [eventStatus, setEventStatus] = useState('upcoming') // upcoming, live, ended
  const [changingStatus, setChangingStatus] = useState(false)
  const [isHost, setIsHost] = useState(false)

  // FUNCTION - Handle API errors (especially 401 token expiration)
  const handleApiError = (response) => {
    if (response.status === 401) {
      // Token expired - clear and redirect to login
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      alert('Your session expired. Please log in again.')
      router.push('/login')
      return true
    }
    return false
  }

  // EFFECT - Load event and reviews when page loads
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    
    loadEventAndReviews()
  }, [eventId])

  // FUNCTION - Fetch event details and reviews from backend
  const loadEventAndReviews = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')

      // Fetch event details
      const eventResponse = await fetch(`${API_URL}/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!eventResponse.ok) {
        if (handleApiError(eventResponse)) return
        if (eventResponse.status === 404) {
          throw new Error('Event not found')
        }
        throw new Error('Failed to load event')
      }

      const eventData = await eventResponse.json()
      setEvent(eventData)
      setGuests(eventData.guests || [])
      setEventStatus(eventData.status || 'upcoming')

      // Check if current user is the host
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      setIsHost(eventData.host?.id === storedUser.id)

      // Fetch reviews
      const reviewsResponse = await fetch(`${API_URL}/events/${eventId}/reviews`)

      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json()
        setReviews(reviewsData)
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // FUNCTION - Handle upvote
  const handleVote = async (reviewId, voteType) => {
    const token = localStorage.getItem('token')
    
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`${API_URL}/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      })

      if (!response.ok) {
        if (handleApiError(response)) return
        throw new Error('Failed to vote')
      }

      // Reload reviews to show updated vote counts
      loadEventAndReviews()

    } catch (err) {
      console.error('Vote error:', err)
    }
  }

  // FUNCTION - Render star rating display
  const renderStars = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  // FUNCTION - Handle photo selection with compression
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate size (5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB')
      return
    }

    // Compress and convert to base64
    compressAndConvertImage(file)
  }

  // FUNCTION - Compress image before upload
  const compressAndConvertImage = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Calculate new dimensions (max 1200px width/height)
        let width = img.width
        let height = img.height
        const maxSize = 1200

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to base64 (0.7 quality = good compression)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)

        console.log('Original size:', file.size, 'bytes')
        console.log('Compressed size:', compressedDataUrl.length, 'chars')

        setSelectedPhoto(compressedDataUrl)
        setPhotoPreview(compressedDataUrl)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }

  // FUNCTION - Clear photo selection
  const clearPhoto = () => {
    setSelectedPhoto(null)
    setPhotoPreview(null)
  }

  // FUNCTION - Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  // FUNCTION - Fetch comments for feed
  const fetchComments = async () => {
    try {
      setLoadingComments(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/events/${eventId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (handleApiError(response)) return
      }

      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  // FUNCTION - Post a new comment
  const handlePostComment = async (e) => {
    e.preventDefault()

    // Updated validation - allow comment OR photo
    if (!newComment.trim() && !selectedPhoto) {
      alert('Please add a comment or photo')
      return
    }

    try {
      setPostingComment(true)
      const token = localStorage.getItem('token')

      console.log('Posting comment with photo:', selectedPhoto ? 'YES' : 'NO')
      if (selectedPhoto) {
        console.log('Photo size (chars):', selectedPhoto.length)
        console.log('Photo preview (first 100 chars):', selectedPhoto.substring(0, 100))
      }

      const response = await fetch(`${API_URL}/events/${eventId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comment_text: newComment || '',  // Allow empty text if photo present
          photo_url: selectedPhoto  // Include base64 image
        })
      })

      // Better error handling
      if (!response.ok) {
        if (handleApiError(response)) return
        const error = await response.json()
        console.error('Server error:', error)
        alert(`Failed to post: ${error.detail || 'Unknown error'}`)
        return
      }

      const newCommentData = await response.json()
      setComments([newCommentData, ...comments]) // Add to top
      setNewComment('') // Clear input
      setSelectedPhoto(null)  // Clear photo
      setPhotoPreview(null)   // Clear preview
    } catch (err) {
      console.error('Upload error:', err)
      alert(`Error posting comment: ${err.message}`)
    } finally {
      setPostingComment(false)
    }
  }

  // FUNCTION - Vote on a comment
  const handleCommentVote = async (commentId, voteType) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vote_type: voteType
        })
      })

      if (!response.ok) {
        if (handleApiError(response)) return
      }

      if (response.ok) {
        const data = await response.json()

        // Update comment in state
        setComments(comments.map(c =>
          c.id === commentId
            ? { ...c, upvotes: data.upvotes, downvotes: data.downvotes, user_vote: data.user_vote }
            : c
        ))
      }
    } catch (err) {
      console.error('Vote failed:', err)
    }
  }

  // FUNCTION - Start event (host only)
  const handleStartEvent = async () => {
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

      if (!response.ok) {
        if (handleApiError(response)) return
        const error = await response.json()
        alert(error.detail || 'Failed to start event')
        return
      }

      setEventStatus('live')
      alert('Event started! The Live Feed is now active. Let the chaos begin. 🎊')
    } catch (err) {
      alert('Error starting event')
    } finally {
      setChangingStatus(false)
    }
  }

  // FUNCTION - End event (host only)
  const handleEndEvent = async () => {
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

      if (!response.ok) {
        if (handleApiError(response)) return
        const error = await response.json()
        alert(error.detail || 'Failed to end event')
        return
      }

      setEventStatus('ended')
      alert('Event ended! Reviews are now open. Time for the truth. ✅')
    } catch (err) {
      alert('Error ending event')
    } finally {
      setChangingStatus(false)
    }
  }

  // EFFECT - Load comments when Feed tab is active
  useEffect(() => {
    if (activeTab === 'feed') {
      fetchComments()
    }
  }, [activeTab])

  // RENDER - Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <p className="text-gray-700">Loading event...</p>
        </div>
      </div>
    )
  }

  // RENDER - Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    )
  }

  // RENDER - Event detail page
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Event Status Banner */}
        {event && (
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
                  <div className="text-sm text-gray-700">
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
                    <div className="text-sm text-gray-700 italic">
                      Event has ended
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Event Header Section */}
        {event && (
          <div className="bg-gradient-to-r from-blue-800 to-purple-800 text-white rounded-lg shadow-xl p-8 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2 text-white drop-shadow-lg">{event.title}</h1>

                {/* Event Date */}
                <div className="flex items-center gap-2 text-white mb-2">
                  <span className="text-xl">📅</span>
                  <span className="text-lg font-medium">
                    {new Date(event.event_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Host Info */}
                <div className="flex items-center gap-2 text-white">
                  <span className="text-xl">👤</span>
                  <span className="text-lg font-medium">
                    Hosted by <span className="font-bold">{event.host?.name || 'Host'}</span>
                  </span>
                </div>
              </div>

              {/* Stats Badge */}
              <div className="bg-white rounded-lg p-4 text-center min-w-[120px] shadow-lg">
                <div className="text-3xl font-bold text-gray-800">{guests.length}</div>
                <div className="text-sm text-gray-700 font-medium">
                  {guests.length === 1 ? 'Guest' : 'Guests'}
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 mt-4">
                <p className="text-gray-900 leading-relaxed font-medium">{event.description}</p>
              </div>
            )}

            {/* Quick Stats Row - Clickable */}
            <div className="flex gap-6 mt-6 pt-6 border-t border-white border-opacity-20 text-white">
              <button
                onClick={() => setActiveTab('reviews')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="text-2xl">⭐</span>
                <span className="text-lg font-medium">
                  <span className="font-bold">{event.review_count || 0}</span> {(event.review_count || 0) === 1 ? 'Review' : 'Reviews'}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('feed')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <span className="text-2xl">💬</span>
                <span className="text-lg font-medium">
                  <span className="font-bold">{event.comment_count || 0}</span> {(event.comment_count || 0) === 1 ? 'Comment' : 'Comments'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Who's Coming */}
<div className="mb-6">
  <h3 className="text-xl font-bold text-gray-900 mb-4">👥 Who's Coming ({guests.length})</h3>
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
    {guests.map(guest => {
      const isHost = guest.user_id === event?.host_id

      return (
        <div key={guest.id} className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-2 ${
            isHost
              ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
              : 'bg-gradient-to-br from-blue-500 to-purple-500'
          }`}>
            {guest.display_name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="text-sm font-medium text-gray-800">
            {guest.display_name}
          </div>
          {isHost ? (
            <div className="text-xs text-yellow-600 font-semibold mt-1">
              👑 Host
            </div>
          ) : (
            <div className="text-xs text-blue-600 font-semibold mt-1">
              👤 Attendee
            </div>
          )}
        </div>
      )
    })}
  </div>
</div>
        {/* Enhanced Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 px-6 py-4 font-semibold text-lg transition-all ${
                activeTab === 'reviews'
                  ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">⭐</span>
                <span>Reviews</span>
                <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                  {reviews.length}
                </span>
              </div>
            </button>

            {/* Live Feed - show when live or ended */}
            {(eventStatus === 'live' || eventStatus === 'ended') && (
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 px-6 py-4 font-semibold text-lg transition-all ${
                  activeTab === 'feed'
                    ? 'border-b-4 border-purple-600 text-purple-600 bg-purple-50'
                    : 'text-gray-700 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl">💬</span>
                  <span>Live Feed</span>
                  <span className="text-sm bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                    {comments.length}
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content - Reviews */}
        {activeTab === 'reviews' && (
        <div>
          {/* Review Submission CTA - only show if event has ended */}
          {eventStatus === 'ended' && user && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 mb-6 border-2 border-green-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Share Your Experience
                  </h3>
                  <p className="text-gray-700">
                    The event has ended! How was it? Leave your honest review.
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/events/${eventId}/review`)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors shadow-md hover:shadow-lg"
                >
                  Write Review
                </button>
              </div>
            </div>
          )}

          {/* Message when reviews aren't available yet */}
          {eventStatus === 'upcoming' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center mb-6">
              <p className="text-gray-700 text-lg mb-2">
                📅 Reviews open when the event ends
              </p>
              <p className="text-gray-700 text-sm">
                Hang tight. The honest opinions come later.
              </p>
            </div>
          )}

          {eventStatus === 'live' && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center mb-6">
              <p className="text-gray-700 text-lg mb-2">
                🎉 Event is live!
              </p>
              <p className="text-gray-700 text-sm">
                Reviews unlock when the host ends the event. For now, head to the Live Feed.
              </p>
            </div>
          )}

          {eventStatus === 'ended' && reviews.length === 0 && (
            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg mb-6">
              <div className="text-6xl mb-4">⭐</div>
              <p className="text-gray-700 text-lg mb-2">No reviews yet</p>
              <p className="text-gray-700 text-sm">
                Be the first to share the truth. We promise it's anonymous.
              </p>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
                {/* Reviewer Header with Avatar */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(review.display_name || 'A').charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-baseline justify-between flex-wrap gap-2">
                      <div>
                        <span className="font-bold text-gray-900 text-lg">
                          {review.display_name || 'Anonymous'}
                        </span>
                        <span className="text-gray-700 text-sm ml-3">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Overall Rating */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {review.overall_rating.toFixed(1)} ⭐
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Ratings with Colors */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-3">
                    <div className="text-sm text-gray-700 mb-1">Food Quality</div>
                    <div className="text-2xl">
                      {renderStars(review.food_quality)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-3">
                    <div className="text-sm text-gray-700 mb-1">Drama Level</div>
                    <div className="text-2xl">
                      {renderStars(review.drama_level)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-3">
                    <div className="text-sm text-gray-700 mb-1">Alcohol</div>
                    <div className="text-2xl">
                      {renderStars(review.alcohol_availability)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-3">
                    <div className="text-sm text-gray-700 mb-1">Conversation</div>
                    <div className="text-2xl">
                      {renderStars(review.conversation_topics)}
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">
                    {review.review_text}
                  </p>
                </div>

                {/* Memorable Moments */}
                {review.memorable_moments && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      💭 Memorable Moments
                    </div>
                    <p className="text-gray-800 leading-relaxed">
                      {review.memorable_moments}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {review.tags && review.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {review.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vote Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleVote(review.id, 1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all font-medium bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-600"
                  >
                    <span>👍</span>
                    <span>{review.upvotes || 0}</span>
                  </button>
                  <button
                    onClick={() => handleVote(review.id, -1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all font-medium bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600"
                  >
                    <span>👎</span>
                    <span>{review.downvotes || 0}</span>
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Tab Content - Live Feed */}
        {activeTab === 'feed' && (
          <div>
            {/* Message when event is upcoming */}
            {eventStatus === 'upcoming' ? (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-700 text-lg mb-2">
                  🔒 Live Feed opens when the event starts
                </p>
                <p className="text-gray-700 text-sm">
                  The host will start the event when everyone arrives!
                </p>
              </div>
            ) : (
              <>
            {/* Refresh button */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Live Feed</h3>
              <button
                onClick={fetchComments}
                disabled={loadingComments}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                <span className={loadingComments ? 'animate-spin' : ''}>🔄</span>
                <span className="text-sm font-medium">{loadingComments ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>

            {/* Enhanced Comment composer with photo support */}
            {user ? (
              <form onSubmit={handlePostComment} className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="What's happening? Spill the tea... 🍵"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base placeholder:text-gray-500 text-gray-900"
                  rows="3"
                />

                {/* Photo preview */}
                {photoPreview && (
                  <div className="mt-3 relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="max-h-48 sm:max-h-64 w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-red-600 text-xl font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-3">
                  {/* Photo picker - mobile friendly with camera access */}
                  <label className="cursor-pointer text-blue-600 hover:text-blue-700 flex items-center justify-center sm:justify-start gap-2 py-2 sm:py-0">
                    <span className="text-2xl">📷</span>
                    <span className="font-medium">Add Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                      capture="environment"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={(!newComment.trim() && !selectedPhoto) || postingComment}
                    className="bg-blue-600 text-white px-6 py-3 sm:py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium w-full sm:w-auto"
                  >
                    {postingComment ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
                <p className="text-gray-700">
                  <a href="/login" className="text-blue-600 hover:underline">Login</a> to join the conversation
                </p>
              </div>
            )}

            {/* Enhanced comments feed */}
            {loadingComments ? (
              <div className="text-center py-8 text-gray-700">Loading feed...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                <p className="text-gray-700 text-lg mb-2">No comments yet</p>
                <p className="text-gray-700 text-sm">
                  Be the first to document the madness. Share a photo, drop a comment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <div key={comment.id} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-md p-4 sm:p-5 hover:shadow-lg transition-shadow">
                    {/* Comment header with avatar */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Avatar circle with initial */}
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {comment.commenter_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-bold text-gray-900">{comment.commenter_name}</span>
                          <span className="text-gray-700 text-xs">
                            {formatTimestamp(comment.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Comment text */}
                    {comment.comment_text && (
                      <p className="text-gray-800 mb-3 leading-relaxed whitespace-pre-wrap">
                        {comment.comment_text}
                      </p>
                    )}

                    {/* Photo if present */}
                    {comment.photo_url && (
                      <div className="mb-4">
                        <img
                          src={comment.photo_url}
                          alt="Comment photo"
                          className="max-h-96 w-full object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity shadow-md"
                          onClick={() => setSelectedImage(comment.photo_url)}
                        />
                      </div>
                    )}

                    {/* Vote buttons with improved styling */}
                    <div className="flex items-center gap-2 sm:gap-3 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleCommentVote(comment.id, 1)}
                        className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full transition-all font-medium text-sm sm:text-base ${
                          comment.user_vote === 1
                            ? 'bg-green-500 text-white shadow-md scale-105'
                            : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-600'
                        }`}
                      >
                        <span className="text-lg">👍</span>
                        <span>{comment.upvotes}</span>
                      </button>
                      <button
                        onClick={() => handleCommentVote(comment.id, -1)}
                        className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full transition-all font-medium text-sm sm:text-base ${
                          comment.user_vote === -1
                            ? 'bg-red-500 text-white shadow-md scale-105'
                            : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        <span className="text-lg">👎</span>
                        <span>{comment.downvotes}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Image lightbox modal */}
            {selectedImage && (
              <div
                className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedImage(null)}
              >
                <button
                  className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
                  onClick={() => setSelectedImage(null)}
                >
                  ×
                </button>
                <img
                  src={selectedImage}
                  alt="Full size"
                  className="max-h-full max-w-full rounded"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}