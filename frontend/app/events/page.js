'use client'
// IMPORTS - Tools and components we need
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import { API_URL } from '../lib/api'

export default function Events() {
  // ROUTING - Navigate between pages
  const router = useRouter()
  
  // STATE - Track if user is logged in
  const [user, setUser] = useState(null)
  
  // STATE - Track form inputs for creating event
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    expected_guests: [],
    ai_guests: [],  // AI personas to invite
    categories: [
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
    ]
  })

  // STATE - Track guest input field
  const [guestInput, setGuestInput] = useState('')

  // STATE - Track AI guest inputs
  const [aiPersonaType, setAiPersonaType] = useState('karen')
  const [aiPersonaName, setAiPersonaName] = useState('')

  // STATE - Track new category inputs
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('')
  
  // STATE - Track created event (to show invite code)
  const [createdEvent, setCreatedEvent] = useState(null)
  
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

  // FUNCTION - Handle event creation form submission
  const handleCreateEvent = async (e) => {
    e.preventDefault() // Prevent page reload
    setError('') // Clear previous errors
    setLoading(true) // Show loading state

    try {
      const token = localStorage.getItem('token')
      
      // Call backend to create event
      const response = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send JWT token for auth
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to create event')
      }

      // Success! Get the created event with invite code
      const event = await response.json()
      setCreatedEvent(event)

      // Redirect to event detail page
      router.push(`/events/${event.id}`)

      // Clear the form
      setFormData({
        title: '',
        description: '',
        event_date: '',
        expected_guests: [],
        ai_guests: [],
        categories: [
          { category_name: 'Food', category_emoji: '🍽️', display_order: 0 },
          { category_name: 'Drama', category_emoji: '🎭', display_order: 1 },
          { category_name: 'Alcohol', category_emoji: '🍷', display_order: 2 },
          { category_name: 'Conversation', category_emoji: '💬', display_order: 3 }
        ]
      })
      setGuestInput('')
      setAiPersonaName('')
      setAiPersonaType('karen')
      setNewCategoryName('')
      setNewCategoryEmoji('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // FUNCTION - Add guest to list
  const handleAddGuest = () => {
    if (guestInput.trim()) {
      setFormData({
        ...formData,
        expected_guests: [...formData.expected_guests, guestInput.trim()]
      })
      setGuestInput('')
    }
  }

  // FUNCTION - Remove guest from list
  const handleRemoveGuest = (index) => {
    setFormData({
      ...formData,
      expected_guests: formData.expected_guests.filter((_, i) => i !== index)
    })
  }

  // FUNCTION - Handle Enter key in guest input
  const handleGuestKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddGuest()
    }
  }

  // FUNCTION - Add AI guest to list
  const handleAddAIGuest = () => {
    if (aiPersonaName.trim()) {
      setFormData({
        ...formData,
        ai_guests: [...formData.ai_guests, {
          ai_persona_type: aiPersonaType,
          ai_persona_name: aiPersonaName.trim()
        }]
      })
      setAiPersonaName('')
    }
  }

  // FUNCTION - Remove AI guest from list
  const handleRemoveAIGuest = (index) => {
    setFormData({
      ...formData,
      ai_guests: formData.ai_guests.filter((_, i) => i !== index)
    })
  }

  // FUNCTION - Add custom category
  const handleAddCategory = () => {
    if (newCategoryName.trim() && formData.categories.length < 8) {
      setFormData({
        ...formData,
        categories: [
          ...formData.categories,
          {
            category_name: newCategoryName.trim(),
            category_emoji: newCategoryEmoji.trim() || '⭐',
            display_order: formData.categories.length
          }
        ]
      })
      setNewCategoryName('')
      setNewCategoryEmoji('')
    }
  }

  // FUNCTION - Remove category
  const handleRemoveCategory = (index) => {
    if (formData.categories.length > 2) {
      setFormData({
        ...formData,
        categories: formData.categories
          .filter((_, i) => i !== index)
          .map((cat, i) => ({ ...cat, display_order: i }))
      })
    }
  }

  // FUNCTION - Update category name
  const handleUpdateCategoryName = (index, newName) => {
    const updated = [...formData.categories]
    updated[index] = { ...updated[index], category_name: newName }
    setFormData({ ...formData, categories: updated })
  }

  // FUNCTION - Update category emoji
  const handleUpdateCategoryEmoji = (index, newEmoji) => {
    const updated = [...formData.categories]
    updated[index] = { ...updated[index], category_emoji: newEmoji }
    setFormData({ ...formData, categories: updated })
  }

  // FUNCTION - Update category scale label
  const handleUpdateCategoryScale = (categoryIndex, ratingLevel, label) => {
    const updated = [...formData.categories]
    if (!updated[categoryIndex].scale_labels) {
      updated[categoryIndex].scale_labels = {}
    }
    updated[categoryIndex].scale_labels[ratingLevel] = label
    setFormData({ ...formData, categories: updated })
  }

  // FUNCTION - Reset to default categories
  const handleResetCategories = () => {
    setFormData({
      ...formData,
      categories: [
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
      ]
    })
  }

  // If not logged in yet, show nothing (will redirect)
  if (!user) {
    return null
  }

  // RENDER - What user sees on screen
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-700">
            Welcome back, {user.name}! Create a new event below.
          </p>
        </div>

        {/* Success message - Shows invite link after creating event */}
        {createdEvent && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-6">
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              🎉 Event Created Successfully!
            </h2>
            <p className="text-gray-700 mb-3">
              <strong>Event:</strong> {createdEvent.title}
            </p>
            <p className="text-gray-700 font-semibold mb-3">Share this link with your guests:</p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${createdEvent.invite_code}`}
                readOnly
                className="flex-1 px-3 py-2 bg-white border rounded font-mono text-sm"
              />
              <button
                onClick={() => {
                  const link = `${window.location.origin}/join/${createdEvent.invite_code}`
                  navigator.clipboard.writeText(link)
                  alert('Link copied to clipboard!')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
              >
                Copy Link
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Send this link via text or email to your guests!
            </p>
            <button
              onClick={() => setCreatedEvent(null)}
              className="text-green-700 hover:text-green-900 underline font-medium"
            >
              Create Another Event
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Create Event Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h2>
          
          <form onSubmit={handleCreateEvent}>
            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2">Event Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Dalton Annual Gingerbread House Party"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2">Description</label>
              <textarea
                rows="3"
                placeholder="Tell guests what to expect..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-900 font-semibold mb-2">Event Date & Time</label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-900 font-semibold mb-2">Expected Guests (Optional)</label>
              <p className="text-sm text-gray-700 mb-2">
                Add names of people you're inviting - they'll see who else is expected!
              </p>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g., Sarah Jones"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900"
                  value={guestInput}
                  onChange={(e) => setGuestInput(e.target.value)}
                  onKeyPress={handleGuestKeyPress}
                />
                <button
                  type="button"
                  onClick={handleAddGuest}
                  className="px-4 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
              {formData.expected_guests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.expected_guests.map((guest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {guest}
                      <button
                        type="button"
                        onClick={() => handleRemoveGuest(index)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* AI Persona Invites Section */}
            <div className="mb-6">
              <label className="block text-gray-900 font-semibold mb-2">
                🤖 Invite AI Personas (Optional)
              </label>
              <p className="text-sm text-gray-700 mb-3">
                Invite hilarious AI characters to join your event! They'll post live comments and leave reviews with personality.
              </p>
              <div className="flex gap-2 mb-3">
                <select
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  value={aiPersonaType}
                  onChange={(e) => setAiPersonaType(e.target.value)}
                >
                  <option value="karen">Karen (Passive-Aggressive)</option>
                  <option value="lightweight">Lightweight (Always Drunk)</option>
                  <option value="genz">Gen Z (Chaotic Slang)</option>
                </select>
                <input
                  type="text"
                  placeholder="e.g., Aunt Susan"
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500 text-gray-900"
                  value={aiPersonaName}
                  onChange={(e) => setAiPersonaName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddAIGuest}
                  disabled={!aiPersonaName.trim()}
                  className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Invite
                </button>
              </div>
              {formData.ai_guests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.ai_guests.map((aiGuest, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                    >
                      🤖 {aiGuest.ai_persona_name} ({aiGuest.ai_persona_type})
                      <button
                        type="button"
                        onClick={() => handleRemoveAIGuest(index)}
                        className="text-purple-600 hover:text-purple-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Rating Categories Section */}
            <div className="mb-6 pb-6 border-b">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-900 font-semibold">Rating Categories</label>
                <button
                  type="button"
                  onClick={handleResetCategories}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Reset to Defaults
                </button>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Customize what guests rate (2-8 categories). Perfect for game nights, weddings, sports parties, etc.
              </p>

              {/* Current Categories */}
              <div className="space-y-4 mb-4">
                {formData.categories.map((cat, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex gap-3 items-center mb-3">
                      <input
                        type="text"
                        value={cat.category_emoji}
                        onChange={(e) => handleUpdateCategoryEmoji(index, e.target.value)}
                        placeholder="emoji"
                        className="w-16 px-2 py-2 border rounded text-center text-gray-900"
                        maxLength={2}
                      />
                      <input
                        type="text"
                        value={cat.category_name}
                        onChange={(e) => handleUpdateCategoryName(index, e.target.value)}
                        placeholder="Category name"
                        className="flex-1 px-3 py-2 border rounded text-gray-900"
                        required
                      />
                      {formData.categories.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Custom scale labels (collapsible) */}
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
                              value={cat.scale_labels?.[String(level)] || ''}
                              onChange={(e) => handleUpdateCategoryScale(index, String(level), e.target.value)}
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
              </div>

              {/* Add New Category */}
              {formData.categories.length < 8 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryEmoji}
                    onChange={(e) => setNewCategoryEmoji(e.target.value)}
                    placeholder="emoji"
                    className="w-16 px-2 py-2 border rounded text-center text-gray-900"
                    maxLength={2}
                  />
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Add new category..."
                    className="flex-1 px-3 py-2 border rounded text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                  >
                    Add
                  </button>
                </div>
              )}

              {formData.categories.length >= 8 && (
                <p className="text-sm text-gray-600 italic">Maximum 8 categories reached</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
            >
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}