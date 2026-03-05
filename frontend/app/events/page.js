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
    event_date: ''
  })
  
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
      
      // Clear the form
      setFormData({
        title: '',
        description: '',
        event_date: ''
      })
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

  // RENDER - What user sees on screen
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-12 px-4">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-600">
            Welcome back, {user.name}! Create a new event below.
          </p>
        </div>

        {/* Success message - Shows invite code after creating event */}
        {createdEvent && (
          <div className="bg-green-100 border-2 border-green-500 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-900 mb-4">
              🎉 Event Created Successfully!
            </h2>
            <div className="bg-white rounded p-4 mb-4">
              <p className="text-gray-700 mb-2">
                <strong>Event:</strong> {createdEvent.title}
              </p>
              <p className="text-gray-700 mb-4">
                <strong>Date:</strong> {new Date(createdEvent.event_date).toLocaleDateString()}
              </p>
              <div className="bg-blue-50 border-2 border-blue-300 rounded p-4">
                <p className="text-sm text-gray-600 mb-2">Share this invite code:</p>
                <p className="text-3xl font-bold text-blue-600 text-center">
                  {createdEvent.invite_code}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCreatedEvent(null)}
              className="text-green-700 hover:text-green-900 underline"
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
          <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
          
          <form onSubmit={handleCreateEvent}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Event Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Dalton Annual Gingerbread House Party"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Description</label>
              <textarea
                rows="3"
                placeholder="Tell guests what to expect..."
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Event Date & Time</label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
              />
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