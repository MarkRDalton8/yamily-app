'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_URL } from '@/app/lib/api'
import Link from 'next/link'

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, upcoming, live, ended
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchAllEvents()
  }, [])

  async function fetchAllEvents() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${API_URL}/admin/events`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        alert('Failed to load events')
      }
    } catch (err) {
      console.error('Error loading events:', err)
      alert('Error loading events')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteEvent(eventId) {
    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Remove from local state
        setEvents(events.filter(e => e.event.id !== eventId))
        setDeleteModalOpen(false)
        setEventToDelete(null)
      } else {
        const error = await response.json()
        alert(`Failed to delete event: ${error.detail || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Error deleting event:', err)
      alert('Error deleting event')
    } finally {
      setDeleting(false)
    }
  }

  function formatDuration(minutes) {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Filter events
  const filteredEvents = events.filter(event => {
    // Filter by status
    if (filter !== 'all' && event.event.status !== filter) {
      return false
    }

    // Filter by search term
    if (searchTerm && !event.event.event_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    return true
  })

  // Get status counts
  const upcomingCount = events.filter(e => e.event.status === 'upcoming').length
  const liveCount = events.filter(e => e.event.status === 'live').length
  const endedCount = events.filter(e => e.event.status === 'ended').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading events...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin - All Events
          </h1>
          <p className="text-gray-600">
            View and manage all events in the system
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {events.length}
            </div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {upcomingCount}
            </div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {liveCount}
            </div>
            <div className="text-sm text-gray-600">Live</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-gray-600 mb-1">
              {endedCount}
            </div>
            <div className="text-sm text-gray-600">Ended</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex flex-col md:flex-row gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('live')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'live'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => setFilter('ended')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ended'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ended
            </button>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(({ event, summary }) => (
              <div key={event.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                {/* Event Header */}
                <div className={`px-6 py-4 rounded-t-lg ${
                  event.status === 'upcoming' ? 'bg-blue-600' :
                  event.status === 'live' ? 'bg-green-600' :
                  'bg-gray-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white uppercase">
                      {event.status}
                    </span>
                    <span className="text-xs text-white">
                      {new Date(event.event_date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {event.event_name}
                  </h3>
                </div>

                {/* Host Info */}
                <div className="px-6 pt-4">
                  <div className="text-xs text-gray-600 mb-1">Host</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {event.host_name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {event.host_email}
                  </div>
                </div>

                {/* Stats */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">
                        {summary.total_attendees}
                      </div>
                      <div className="text-xs text-gray-600">Guests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">
                        {summary.total_reviews}
                      </div>
                      <div className="text-xs text-gray-600">Reviews</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">
                        {summary.total_comments}
                      </div>
                      <div className="text-xs text-gray-600">Comments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">
                        {summary.total_photos}
                      </div>
                      <div className="text-xs text-gray-600">Photos</div>
                    </div>
                  </div>

                  {/* AI Guests & Duration */}
                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                    <div className="text-center">
                      <div className="text-lg font-bold text-pink-600">
                        {summary.total_ai_guests || 0}
                      </div>
                      <div className="text-xs text-gray-600">AI Guests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-indigo-600">
                        {formatDuration(event.duration_minutes)}
                      </div>
                      <div className="text-xs text-gray-600">Duration</div>
                    </div>
                  </div>

                  {/* Average Ratings - Dynamic */}
                  {summary.total_reviews > 0 && summary.avg_ratings && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="text-xs font-semibold text-gray-600 mb-2">
                        Average Ratings
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                        {Object.entries(summary.avg_ratings).map(([categoryName, avgValue]) => (
                          <div key={categoryName}>
                            {categoryName}: <span className="font-bold">{avgValue.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/events/${event.id}`}
                        className="flex-1 text-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        View Event
                      </Link>
                      <Link
                        href={`/events/${event.id}/summary`}
                        className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                      >
                        Summary
                      </Link>
                    </div>
                    <button
                      onClick={() => {
                        setEventToDelete({ id: event.id, name: event.event_name })
                        setDeleteModalOpen(true)
                      }}
                      className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                    >
                      Delete Event
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && eventToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Delete Event?
              </h2>
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete <span className="font-semibold">{eventToDelete.name}</span>?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                This will permanently delete the event and all associated data including:
              </p>
              <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
                <li>All comments and photos</li>
                <li>All reviews and ratings</li>
                <li>Guest list and AI guests</li>
                <li>Event categories</li>
              </ul>
              <p className="text-sm font-semibold text-red-600 mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false)
                    setEventToDelete(null)
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteEvent(eventToDelete.id)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
