'use client'
// IMPORTS - Tools and components we need
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import { API_URL } from '../lib/api'

export default function MyEvents() {
  // ROUTING - Navigate between pages
  const router = useRouter()
  
  // STATE - Track user
  const [user, setUser] = useState(null)
  
  // STATE - Track events I'm hosting
  const [hostedEvents, setHostedEvents] = useState([])
  
  // STATE - Track events I've joined
  const [joinedEvents, setJoinedEvents] = useState([])
  
  // STATE - Track loading and errors
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // STATE - Track user type
  const [userType, setUserType] = useState('attendee')

  // EFFECT - Load user and their events when page loads
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    // If not logged in, redirect to login
    if (!storedUser || !token) {
      router.push('/login')
      return
    }

    const userData = JSON.parse(storedUser)
    setUser(userData)
    setUserType(userData.user_type || 'attendee')
    loadMyEvents(token)
  }, [router])

  // FUNCTION - Fetch user's events from backend
  const loadMyEvents = async (token) => {
    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/users/me/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load events')
      }

      const data = await response.json()
      setHostedEvents(data.hosted)

      // Filter out events that the user is hosting from the joined events
      // to prevent duplicates (hosts are auto-joined as guests)
      const hostedEventIds = data.hosted.map(event => event.id)
      const attendingOnly = data.joined.filter(event => !hostedEventIds.includes(event.id))
      setJoinedEvents(attendingOnly)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // FUNCTION - Upgrade user to host
  const handleBecomeHost = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/users/become-host`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to upgrade account')
      }

      // Update stored user object
      const updatedUser = { ...user, user_type: 'host' }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUserType('host')
      setUser(updatedUser)
      alert("You're now a host! Time to create some events. 🎊")

    } catch (err) {
      setError(err.message)
    }
  }

  // FUNCTION - Copy invite link to clipboard
  const copyInviteLink = (inviteCode) => {
    const inviteUrl = `${window.location.origin}/join/${inviteCode}`
    navigator.clipboard.writeText(inviteUrl).then(() => {
      // Could add a toast notification here later
      alert('Invite link copied to clipboard!')
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  // FUNCTION - Copy just the invite code to clipboard
  const copyInviteCode = (inviteCode) => {
    navigator.clipboard.writeText(inviteCode).then(() => {
      alert('Invite code copied to clipboard!')
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  // If not logged in yet, show nothing (will redirect)
  if (!user) {
    return null
  }

  // RENDER - My Events page
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Events</h1>
          <p className="text-gray-600">
            {userType === 'host'
              ? "Events you're hosting and events you've joined"
              : "Events you've joined"}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your events...</p>
          </div>
        ) : (
          <>
            <div className={userType === 'host' ? 'grid md:grid-cols-2 gap-8' : 'max-w-2xl'}>
            {/* HOSTED EVENTS - Events I created - ONLY SHOW FOR HOSTS */}
            {userType === 'host' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Hosting ({hostedEvents.length})
                </h2>
                
                <a href="/events"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  + Create New Event
                </a>
              </div>

              {hostedEvents.length === 0 ? (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-8 text-center">
                  <p className="text-gray-700 text-lg mb-2">No events hosted yet</p>
                  <p className="text-gray-600 text-sm mb-4">
                    Ready to subject your family to honest reviews? Create your first event.
                  </p>
                  <a href="/events"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    Create Your First Event
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {hostedEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer border-2 border-transparent hover:border-blue-200"
                    >
                      {/* Header with title and badge */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
                          {event.title}
                        </h3>
                        <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                          Hosting
                        </span>
                      </div>

                      {/* Event date */}
                      <p className="text-gray-600 mb-2 flex items-center gap-2">
                        <span>📅</span>
                        <span>{new Date(event.event_date).toLocaleString()}</span>
                      </p>

                      {/* Description */}
                      {event.description && (
                        <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>
                      )}

                      {/* Shareable link section */}
                      <div className="mb-4 bg-gray-50 rounded-lg p-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                        {/* Invite Code */}
                        <div>
                          <p className="text-xs text-gray-600 mb-2 font-medium">Invite Code:</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={event.invite_code}
                              readOnly
                              className="flex-1 px-3 py-2 bg-white border rounded text-sm font-mono font-bold text-center tracking-wider"
                              onClick={(e) => e.target.select()}
                            />
                            <button
                              onClick={() => copyInviteCode(event.invite_code)}
                              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-medium text-sm whitespace-nowrap"
                            >
                              Copy Code
                            </button>
                          </div>
                        </div>

                        {/* Shareable Link */}
                        <div>
                          <p className="text-xs text-gray-600 mb-2 font-medium">Shareable Link:</p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${event.invite_code}`}
                              readOnly
                              className="flex-1 px-3 py-2 bg-white border rounded text-sm font-mono"
                              onClick={(e) => e.target.select()}
                            />
                            <button
                              onClick={() => copyInviteLink(event.invite_code)}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
                            >
                              Copy Link
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action button */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`/events/${event.id}`)}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-md hover:shadow-lg"
                        >
                          View Event Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* JOINED EVENTS - Events I'm a guest at */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Joined ({joinedEvents.length})
                </h2>
                
                  <a href="/join"
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  + Join Event
                </a>
              </div>

              {joinedEvents.length === 0 ? (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-8 text-center">
                  <p className="text-gray-700 text-lg mb-2">No events joined yet</p>
                  <p className="text-gray-600 text-sm">
                    Waiting for an invite link? Check your messages, or maybe it got lost in the family group chat.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {joinedEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer border-2 border-transparent hover:border-purple-200"
                    >
                      {/* Header with title and badge */}
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-gray-800 hover:text-purple-600 transition-colors">
                          {event.title}
                        </h3>
                        <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                          Attending
                        </span>
                      </div>

                      {/* Event date */}
                      <p className="text-gray-600 mb-2 flex items-center gap-2">
                        <span>📅</span>
                        <span>{new Date(event.event_date).toLocaleString()}</span>
                      </p>

                      {/* Description */}
                      {event.description && (
                        <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>
                      )}

                      {/* Stats */}
                      <div className="flex gap-4 text-sm text-gray-500 mb-4 pb-4 border-b">
                        <span className="flex items-center gap-1">
                          <span>💬</span>
                          <span>Check live feed</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <span>⭐</span>
                          <span>Leave a review</span>
                        </span>
                      </div>

                      {/* Action button */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => router.push(`/events/${event.id}`)}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 font-semibold transition-all shadow-md hover:shadow-lg"
                        >
                          View Event Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* UPGRADE CARD - Only show for attendees */}
          {userType === 'attendee' && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6 mt-8">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🎉</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Ready to Host?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Create your own events and invite family members.
                    Someone's got to organize the chaos.
                  </p>
                  <button
                    onClick={handleBecomeHost}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
                  >
                    Become a Host (Free)
                  </button>
                </div>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  )
}