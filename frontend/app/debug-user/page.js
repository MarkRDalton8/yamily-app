'use client'
import { useState, useEffect } from 'react'

export default function DebugUser() {
  const [userData, setUserData] = useState(null)
  const [tokenExists, setTokenExists] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    setTokenExists(!!token)

    if (user) {
      try {
        setUserData(JSON.parse(user))
      } catch (e) {
        setUserData({ error: 'Invalid JSON' })
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">🔍 User Debug Info</h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Token Status</h2>
          <p className="text-lg">
            {tokenExists ? '✅ Token exists' : '❌ No token found'}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">User Data</h2>
          {userData ? (
            <div className="bg-gray-100 p-4 rounded font-mono text-sm">
              <pre>{JSON.stringify(userData, null, 2)}</pre>
            </div>
          ) : (
            <p className="text-gray-600">No user data in localStorage</p>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">User Type Check</h2>
          {userData && (
            <div className="space-y-2">
              <p><strong>user_type value:</strong> {userData.user_type || 'undefined'}</p>
              <p><strong>Is host?</strong> {userData.user_type === 'host' ? '✅ YES' : '❌ NO'}</p>
              <p><strong>Is attendee?</strong> {userData.user_type === 'attendee' ? '✅ YES' : '❌ NO'}</p>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <a
            href="/my-events"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to My Events
          </a>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.href = '/'
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Clear localStorage & Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
