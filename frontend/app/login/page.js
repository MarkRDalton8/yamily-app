'use client'
// IMPORTS - Tools and components we need
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '../components/Navbar'
import { API_URL } from '../lib/api'

// Inner component that uses useSearchParams
function LoginForm() {
  // ROUTING - Navigate between pages and read URL parameters
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // STATE - Track form inputs (email/password)
  const [formData, setFormData] = useState({
    username: '', // API expects 'username' but it's actually email
    password: ''
  })
  
  // STATE - Track error messages to show user
  const [error, setError] = useState('')
  
  // STATE - Track loading state (button disabled while logging in)
  const [loading, setLoading] = useState(false)
  
  // STATE - Track success message (shown after registration)
  const [successMessage, setSuccessMessage] = useState('')
  
  // STATE - Track debug token for display
  const [debugToken, setDebugToken] = useState('')
  
  // STATE - Track localStorage values (prevents hydration errors)
  const [storedToken, setStoredToken] = useState('')
  const [storedUser, setStoredUser] = useState('')

  // EFFECT - Run once when component loads
  useEffect(() => {
    // Check if redirected from registration
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Account created! Please log in.')
    }
    
    // Load from localStorage after component mounts (browser only)
    setStoredToken(localStorage.getItem('token') || '')
    setStoredUser(localStorage.getItem('user') || '')
  }, [searchParams])

  // FUNCTION - Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault() // Prevent page reload
    setError('') // Clear any previous errors
    setLoading(true) // Show loading state

    try {
      // FastAPI OAuth2 expects form data, not JSON
      const formBody = new URLSearchParams()
      formBody.append('username', formData.username)
      formBody.append('password', formData.password)

      // Call backend login API
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody
      })

      // Check if login failed
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Login failed')
      }

      // Login successful - get the data
      const data = await response.json()
      
      // Store token and user info in browser
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify({
        id: data.user_id,
        email: data.email,
        name: data.name,
        user_type: data.user_type || 'attendee'
      }))

      // Update state for debug display
      setDebugToken(data.access_token)
      setStoredToken(data.access_token)
      setStoredUser(JSON.stringify({
        id: data.user_id,
        email: data.email,
        name: data.name,
        user_type: data.user_type || 'attendee'
      }))

      // Redirect to My Events page
      router.push('/my-events')
    } catch (err) {
      // Show error message to user
      setError(err.message)
    } finally {
      // Always stop loading state (success or fail)
      setLoading(false)
    }
  }

  // RENDER - What user sees on screen
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-black text-center mb-2">Welcome Back</h1>
          <p className="text-gray-700 text-center mb-6">
            Log in to review your latest family gathering.
          </p>

          {/* Success message (after registration) */}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}

          {/* Error message (if login fails) */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-900 mb-2">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-900 mb-2">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-center mt-4 text-gray-700">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 hover:underline">
              Sign Up
            </a>
          </p>
        </div>

        {/* DEBUG PANEL - Only shows in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="max-w-md mx-auto mt-8 p-4 bg-gray-800 text-white rounded-lg">
          <h3 className="text-xl font-bold mb-4">🔍 Debug Info</h3>
          
          <div className="mb-4">
            <strong>Form Data:</strong>
            <pre className="bg-gray-900 p-2 rounded mt-2 text-sm overflow-x-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
          
          <div className="mb-4">
            <strong>JWT Token:</strong>
            <pre className="bg-gray-900 p-2 rounded mt-2 text-xs overflow-x-auto break-all">
              {debugToken || storedToken || 'Not logged in yet'}
            </pre>
          </div>
          
          <div>
            <strong>User Info:</strong>
            <pre className="bg-gray-900 p-2 rounded mt-2 text-sm overflow-x-auto">
              {storedUser || 'Not logged in yet'}
            </pre>
          </div>
          
          {(debugToken || storedToken) && (
            <a 
              href={`https://jwt.io/#debugger-io?token=${debugToken || storedToken}`}
              target="_blank"
              className="block mt-4 text-center bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              🔗 Open in JWT.io
            </a>
          )}
          </div>
        )}  {/* End debug panel conditional */}
      </div>
    </div>
  )
}

// Default export wraps LoginForm in Suspense
export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-700">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}