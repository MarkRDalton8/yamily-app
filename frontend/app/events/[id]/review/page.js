'use client'
// IMPORTS - Tools and components we need
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '../../../components/Navbar'
import { API_URL } from '../../../lib/api'

export default function SubmitReview() {
  // ROUTING - Get event ID from URL and navigate
  const router = useRouter()
  const params = useParams()
  const eventId = params.id
  
  // STATE - Track if user is logged in
  const [user, setUser] = useState(null)
  
  // STATE - Track form inputs (all the ratings and review text)
  const [formData, setFormData] = useState({
    food_quality: 3,
    drama_level: 3,
    alcohol_availability: 3,
    conversation_topics: 3,
    review_text: '',
    memorable_moments: '',
    tags: []
  })
  
  // STATE - Track tag input (what user is typing)
  const [tagInput, setTagInput] = useState('')
  
  // STATE - Track if review was submitted successfully
  const [submitted, setSubmitted] = useState(false)
  
  // STATE - Track errors
  const [error, setError] = useState('')
  
  // STATE - Track loading state
  const [loading, setLoading] = useState(false)

  // EFFECT - Check if user is logged in when page loads
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    // If not logged in, redirect to login page
    if (!storedUser || !token) {
      router.push('/login')
      return
    }
    
    // Parse and store user info
    setUser(JSON.parse(storedUser))
  }, [router])

  // FUNCTION - Add a tag to the list
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('') // Clear input
    }
  }

  // FUNCTION - Remove a tag from the list
  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  // FUNCTION - Handle review submission
  const handleSubmit = async (e) => {
    e.preventDefault() // Prevent page reload
    setError('') // Clear previous errors
    setLoading(true) // Show loading state

    try {
      const token = localStorage.getItem('token')
      
      // Call backend to submit review
      const response = await fetch(`${API_URL}/events/${eventId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send JWT token for auth
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to submit review')
      }

      // Success!
      setSubmitted(true)
      
      // Redirect to event page after 2 seconds
      setTimeout(() => {
        router.push(`/events/${eventId}`)
      }, 2000)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // If not logged in yet, show nothing (will redirect)
  if (!user) {
    return null
  }

  // If review submitted, show success message
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto py-12 px-4 text-center">
          <div className="bg-green-100 border-2 border-green-500 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-green-900 mb-4">
              🎉 Review Submitted!
            </h1>
            <p className="text-gray-700">
              Thanks for sharing your thoughts! Redirecting to event page...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // RENDER - Review submission form
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Submit Review</h1>
          <p className="text-gray-600">
            Rate the event and share your experience!
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          
          {/* RATINGS SECTION */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Ratings</h2>
            <p className="text-sm text-gray-600 mb-6">Rate each category from 1 (terrible) to 5 (amazing)</p>
            
            {/* Food Quality */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Food Quality: {formData.food_quality} ⭐
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.food_quality}
                onChange={(e) => setFormData({...formData, food_quality: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 - Terrible</span>
                <span>5 - Amazing</span>
              </div>
            </div>

            {/* Drama Level */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Drama Level: {formData.drama_level} 🎭
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.drama_level}
                onChange={(e) => setFormData({...formData, drama_level: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 - Peaceful</span>
                <span>5 - Explosive</span>
              </div>
            </div>

            {/* Alcohol Availability */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Alcohol Availability: {formData.alcohol_availability} 🍷
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.alcohol_availability}
                onChange={(e) => setFormData({...formData, alcohol_availability: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 - Dry Event</span>
                <span>5 - Open Bar</span>
              </div>
            </div>

            {/* Conversation Topics */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Conversation Topics: {formData.conversation_topics} 💬
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.conversation_topics}
                onChange={(e) => setFormData({...formData, conversation_topics: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 - Awkward Silence</span>
                <span>5 - Engaging</span>
              </div>
            </div>
          </div>

          {/* REVIEW TEXT */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Review</label>
            <textarea
              required
              rows="6"
              placeholder="Share your experience... What stood out? Any highlights or lowlights?"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-900"
              value={formData.review_text}
              onChange={(e) => setFormData({...formData, review_text: e.target.value})}
            />
          </div>

          {/* MEMORABLE MOMENTS */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Memorable Moments (Optional)</label>
            <textarea
              rows="3"
              placeholder="Any specific moments that stood out? Uncle Bob's toast? The dog that crashed the party?"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-900"
              value={formData.memorable_moments}
              onChange={(e) => setFormData({...formData, memorable_moments: e.target.value})}
            />
          </div>

          {/* TAGS */}
          <div className="mb-6">
            <label className="block text-gray-700 mb-2">
                Tags (Optional)
                <span className="text-sm text-gray-500"> - Press Enter or click Add Tag after each one</span>
            </label>
            <div className="flex gap-2 mb-2">
            
              <input
                type="text"
                placeholder="e.g., Fondue Fail, Great Music"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-900"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Add Tag
              </button>
            </div>
            
            {/* Display added tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-lg"
          >
            {loading ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  )
}