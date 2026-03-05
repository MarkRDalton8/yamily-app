'use client'
// IMPORTS - Tools and components we need
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '../../components/Navbar'

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
      
      // Fetch reviews (we don't have a "get single event" endpoint yet, so we just get reviews)
      const response = await fetch(`http://localhost:8000/events/${eventId}/reviews`)
      
      if (!response.ok) {
        throw new Error('Failed to load event')
      }
      
      const reviewsData = await response.json()
      setReviews(reviewsData)
      
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
      const response = await fetch(`http://localhost:8000/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      })

      if (!response.ok) {
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

  // RENDER - Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 text-center">
          <p className="text-gray-600">Loading event...</p>
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
      
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Event Reviews
          </h1>
          
          {/* Submit Review Button */}
          {user && (
            
              <a href={`/events/${eventId}/review`}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Submit Your Review
            </a>
          )}
          
          {!user && (
            <p className="text-gray-600">
              <a href="/login" className="text-blue-600 hover:underline">Login</a> to submit a review
            </p>
          )}
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Reviews ({reviews.length})
          </h2>
          
          {reviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
              No reviews yet. Be the first to review this event!
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
                {/* Review Header - Pseudonym and Date */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {review.display_name || 'Anonymous'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {/* Overall Rating */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {review.overall_rating.toFixed(1)} ⭐
                    </div>
                    <p className="text-xs text-gray-500">Overall</p>
                  </div>
                </div>

                {/* Category Ratings */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Food Quality</p>
                    <p className="text-sm">{renderStars(review.food_quality)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Drama Level</p>
                    <p className="text-sm">{renderStars(review.drama_level)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Alcohol</p>
                    <p className="text-sm">{renderStars(review.alcohol_availability)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Conversation</p>
                    <p className="text-sm">{renderStars(review.conversation_topics)}</p>
                  </div>
                </div>

                {/* Review Text */}
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed">
                    {review.review_text}
                  </p>
                </div>

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

                {/* Voting Buttons */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <button
                    onClick={() => handleVote(review.id, 1)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <span className="text-xl">👍</span>
                    <span className="font-semibold">{review.upvotes}</span>
                  </button>
                  
                  <button
                    onClick={() => handleVote(review.id, -1)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <span className="text-xl">👎</span>
                    <span className="font-semibold">{review.downvotes}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}