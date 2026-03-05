'use client'
// IMPORTS - Tools and components we need
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

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

  // EFFECT - Load user and their events when page loads
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    
    // If not logged in, redirect to login
    if (!storedUser || !token) {
      router.push('/login')
      return
    }
    
    setUser(JSON.parse(storedUser))
    loadMyEvents(token)
  }, [router])

  // FUNCTION - Fetch user's events from backend
  const loadMyEvents = async (token) => {
    try {
      setLoading(true)
      
      const response = await fetch('http://localhost:8000/users/me/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load events')
      }

      const data = await response.json()
      setHostedEvents(data.hosted)
      setJoinedEvents(data.joined)
      
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

  // RENDER - My Events page
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Events</h1>
          <p className="text-gray-600">
            Events you're hosting and events you've joined
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
          <div className="grid md:grid-cols-2 gap-8">
            {/* HOSTED EVENTS - Events I created */}
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
                <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600">
                  <p className="mb-4">You haven't created any events yet.</p>
                  
                   <a href="/events"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Your First Event
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {hostedEvents.map((event) => (
                    <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-mono">
                          {event.invite_code}
                        </span>
                      </div>
                      
                     <a  href={`/events/${event.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        View Reviews →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600">
                  <p className="mb-4">You haven't joined any events yet.</p>
                  
                <a href="/join"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Join Your First Event
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {joinedEvents.map((event) => (
                    <div key={event.id} className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {event.title}
                      </h3>
                      {event.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-3">
                        
                         <a href={`/events/${event.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          View Reviews →
                        </a>
                        
                         <a href={`/events/${event.id}/review`}
                          className="text-green-600 hover:text-green-800 text-sm underline"
                        >
                          Submit Review →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}