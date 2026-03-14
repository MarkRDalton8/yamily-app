'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { API_URL } from '../../lib/api'
import Navbar from '../../components/Navbar'

export default function JoinEvent() {
  const router = useRouter()
  const params = useParams()
  const inviteCode = params.inviteCode

  // State for event preview
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // State for login detection
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [joining, setJoining] = useState(false)
  const [displayName, setDisplayName] = useState('')

  // State for form (when not logged in)
  const [isRegistering, setIsRegistering] = useState(true) // Toggle between register/login
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    displayName: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Fetch event preview and check login status on page load
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      setIsLoggedIn(true)
      try {
        const user = JSON.parse(userStr)
        setCurrentUser(user)
        // Check if already joined after setting user
        checkIfAlreadyJoined(token, user)
      } catch (err) {
        console.error('Failed to parse user:', err)
      }
    }

    // Fetch event preview
    fetchEventPreview()
  }, [inviteCode])

  async function fetchEventPreview() {
    try {
      const response = await fetch(`${API_URL}/events/preview/${inviteCode}`)
      if (!response.ok) {
        throw new Error('Event not found')
      }
      const data = await response.json()
      setEvent(data)
      setLoading(false)
    } catch (err) {
      setError('Invalid invite link')
      setLoading(false)
    }
  }

  async function checkIfAlreadyJoined(token, user) {
    try {
      const response = await fetch(`${API_URL}/events/preview/${inviteCode}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()

        // Check if current user is in the joined guests list
        if (user && data.joined_guests) {
          const alreadyJoined = data.joined_guests.some(
            g => g.email === user.email || g.name === user.name
          )

          if (alreadyJoined) {
            // Redirect to event page
            router.push(`/events/${data.id}`)
          }
        }
      }
    } catch (err) {
      console.error('Failed to check join status:', err)
    }
  }

  async function handleJoinEvent() {
    if (!displayName.trim()) {
      setError('Please enter a display name')
      return
    }

    try {
      setJoining(true)
      setError('')
      const token = localStorage.getItem('token')

      const joinResponse = await fetch(`${API_URL}/events/join-after-login?invite_code=${inviteCode}&display_name=${encodeURIComponent(displayName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!joinResponse.ok) {
        const joinData = await joinResponse.json()
        throw new Error(joinData.detail || 'Failed to join event')
      }

      // Redirect to event page
      router.push(`/events/${event.id}`)
    } catch (err) {
      setError(err.message)
      setJoining(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (isRegistering) {
        // Register new user with invite code (always as attendee)
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            password: formData.password,
            invite_code: inviteCode,
            display_name: formData.displayName,
            user_type: 'attendee'
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.detail || 'Registration failed')
        }

        // Auto-login after registration
        const loginForm = new URLSearchParams()
        loginForm.append('username', formData.email)
        loginForm.append('password', formData.password)

        const loginResponse = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: loginForm
        })

        if (!loginResponse.ok) {
          throw new Error('Login failed after registration')
        }

        const loginData = await loginResponse.json()
        localStorage.setItem('token', loginData.access_token)
        localStorage.setItem('user', JSON.stringify({
          id: loginData.user_id,
          email: loginData.email,
          name: loginData.name,
          user_type: 'attendee'
        }))

        // Redirect to event
        router.push(`/events/${event.id}`)

      } else {
        // Login existing user
        const loginForm = new URLSearchParams()
        loginForm.append('username', formData.email)
        loginForm.append('password', formData.password)

        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: loginForm
        })

        if (!response.ok) {
          throw new Error('Login failed')
        }

        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        localStorage.setItem('user', JSON.stringify({
          id: data.user_id,
          email: data.email,
          name: data.name,
          user_type: data.user_type || 'attendee'
        }))

        // Join event after login
        const joinResponse = await fetch(`${API_URL}/events/join-after-login?invite_code=${inviteCode}&display_name=${encodeURIComponent(formData.displayName)}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        })

        if (!joinResponse.ok) {
          const joinData = await joinResponse.json()
          throw new Error(joinData.detail || 'Failed to join event')
        }

        // Redirect to event
        router.push(`/events/${event.id}`)
      }
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-700">Loading event...</p>
        </div>
      </div>
    )
  }

  // Error state (event not found)
  if (error && !event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:underline"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Event Preview Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">🎉 You're Invited!</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{event.title}</h2>
          <p className="text-gray-700 mb-4">{event.description}</p>
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">When:</span> {new Date(event.event_date).toLocaleString()}
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Host:</span> {event.host_name}
          </p>

          {/* Guest List */}
          {(event.expected_guests.length > 0 || event.joined_guests.length > 0) && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">Guest List:</h3>
              <div className="space-y-1">
                {/* Show joined guests */}
                {event.joined_guests.map((guest, idx) => (
                  <p key={`joined-${idx}`} className="text-green-600 flex items-center">
                    <span className="mr-2">✅</span>
                    <span>{guest.name} <span className="text-gray-700 text-sm">(joined as "{guest.display_name}")</span></span>
                  </p>
                ))}

                {/* Show expected guests who haven't joined */}
                {event.expected_guests.map((name, idx) => {
                  const hasJoined = event.joined_guests.some(g => g.name === name)
                  if (!hasJoined) {
                    return (
                      <p key={`expected-${idx}`} className="text-gray-700 flex items-center">
                        <span className="mr-2">⏳</span>
                        <span>{name} <span className="text-sm">(not joined yet)</span></span>
                      </p>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          )}
        </div>

        {/* Conditional Join Section */}
        {isLoggedIn ? (
          // USER IS LOGGED IN - Show simple join form
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Join This Event
            </h3>

            <p className="text-gray-700 mb-4">
              You're logged in as <span className="font-semibold">{currentUser?.name || 'User'}</span>
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Pseudonym input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose your display name for this event:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Wine Aunt, Uncle Chaos"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <p className="text-sm text-gray-700 mt-2">
                This is how you'll appear in reviews and comments (anonymous)
              </p>
            </div>

            {/* Join button */}
            <button
              onClick={handleJoinEvent}
              disabled={joining || !displayName.trim()}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              {joining ? 'Joining...' : 'Join Event'}
            </button>
          </div>
        ) : (
          // USER NOT LOGGED IN - Show existing login/register forms
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-center mb-6">
              <button
                onClick={() => setIsRegistering(true)}
                className={`px-6 py-2 rounded-l-lg font-medium transition-colors ${
                  isRegistering
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setIsRegistering(false)}
                className={`px-6 py-2 rounded-r-lg font-medium transition-colors ${
                  !isRegistering
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Log In
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Your Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="e.g., Bob Smith"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Party Pseudonym 🎭
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="e.g., Uncle Chaos, Wine Aunt, The Critic"
                />
                <p className="text-sm text-gray-700 mt-1">
                  This is how you'll appear in reviews - get creative!
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {submitting ? 'Joining...' : (isRegistering ? 'Sign Up & Join Event' : 'Log In & Join Event')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
