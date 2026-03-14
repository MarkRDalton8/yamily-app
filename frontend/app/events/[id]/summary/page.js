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
