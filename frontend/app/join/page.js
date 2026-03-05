'use client'
// IMPORTS - Tools and components we need
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import { API_URL } from '../lib/api'

export default function JoinEvent() {
  // ROUTING - Navigate between pages
  const router = useRouter()
  
  // STATE - Track if user is logged in
  const [user, setUser] = useState(null)
  
  // STATE - Track form inputs (invite code and pseudonym)
  const [formData, setFormData] = useState({
    invite_code: '',
    display_name: ''
  })
  
  // STATE - Track joined event (to show success message)
  const [joinedEvent, setJoinedEvent] = useState(null)
  
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

  // FUNCTION - Handle join event form submission
  const handleJoinEvent = async (e) => {
    e.preventDefault() // Prevent page reload
    setError('') // Clear previous errors
    setLoading(true) // Show loading state

    try {
      const token = localStorage.getItem('token')
      
      // Call backend to join event
      const response = await fetch(`${API_URL}/events/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send JWT token for auth
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Failed to join event')
      }

      // Success! Get the joined event info
      const eventGuest = await response.json()
      setJoinedEvent(eventGuest)
      
      // Clear the form
      setFormData({
        invite_code: '',
        display_name: ''
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
      
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Event</h1>
          <p className="text-gray-600">
            Enter an invite code and choose your party persona!
          </p>
        </div>

        {joinedEvent && (
          <div className="bg-green-100 border-2 border-green-500 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-green-900 mb-4">
              Successfully Joined Event!
            </h2>
            <div className="bg-white rounded p-4 mb-4">
              <p className="text-gray-700 mb-2">
                <strong>Your Party Name:</strong> {joinedEvent.display_name}
              </p>
              <p className="text-gray-700 text-sm">
                You will show up as {joinedEvent.display_name} when you review this event!
              </p>
            </div>
            <button
              onClick={() => setJoinedEvent(null)}
              className="text-green-700 hover:text-green-900 underline"
            >
              Join Another Event
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-6">Enter Event Details</h2>
          
          <form onSubmit={handleJoinEvent}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Invite Code</label>
              <input
                type="text"
                required
                placeholder="e.g., ABC123XYZ"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                value={formData.invite_code}
                onChange={(e) => setFormData({...formData, invite_code: e.target.value.toUpperCase()})}
              />
              <p className="text-sm text-gray-500 mt-1">
                Get this from the event host
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Your Party Name</label>
              <input
                type="text"
                required
                placeholder="e.g., FondueFiend, The Critic, Drama Llama"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.display_name}
                onChange={(e) => setFormData({...formData, display_name: e.target.value})}
              />
              <p className="text-sm text-gray-500 mt-1">
                This is how you will appear in reviews (not your real name!)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
            >
              {loading ? 'Joining Event...' : 'Join Event'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Party Name Ideas:
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-white px-3 py-1 rounded-full text-gray-600">
                FondueFiend
              </span>
              <span className="text-xs bg-white px-3 py-1 rounded-full text-gray-600">
                The Critic
              </span>
              <span className="text-xs bg-white px-3 py-1 rounded-full text-gray-600">
                Drama Llama
              </span>
              <span className="text-xs bg-white px-3 py-1 rounded-full text-gray-600">
                Anonymous Aunt
              </span>
              <span className="text-xs bg-white px-3 py-1 rounded-full text-gray-600">
                Uncle Anonymous
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}