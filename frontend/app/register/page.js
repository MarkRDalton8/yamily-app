'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import WelcomeScreen from '../components/WelcomeScreen'
import { API_URL } from '../lib/api'

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [registeredPassword, setRegisteredPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.detail || 'Registration failed')
      }

      // Registration successful - store credentials and show welcome screen
      setRegisteredEmail(formData.email)
      setRegisteredPassword(formData.password)
      setShowWelcome(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleWelcomeChoice(userType) {
    try {
      // Login first
      const loginForm = new URLSearchParams()
      loginForm.append('username', registeredEmail)
      loginForm.append('password', registeredPassword)

      const loginResponse = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: loginForm
      })

      if (!loginResponse.ok) {
        throw new Error('Login failed')
      }

      const loginData = await loginResponse.json()
      localStorage.setItem('token', loginData.access_token)

      // If they chose host, upgrade them
      if (userType === 'host') {
        await fetch(`${API_URL}/users/become-host`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${loginData.access_token}`
          }
        })

        // Update stored user object
        const updatedUser = {
          id: loginData.user_id,
          email: loginData.email,
          name: loginData.name,
          user_type: 'host'
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        router.push('/my-events')
      } else {
        // Just store user and redirect
        const user = {
          id: loginData.user_id,
          email: loginData.email,
          name: loginData.name,
          user_type: 'attendee'
        }
        localStorage.setItem('user', JSON.stringify(user))
        router.push('/my-events')
      }
    } catch (err) {
      setError('Failed to complete setup')
      setShowWelcome(false)
    }
  }

  // Show welcome screen if registration succeeded
  if (showWelcome) {
    return <WelcomeScreen onSelect={handleWelcomeChoice} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-black text-center mb-2">Join Yamily</h1>
          <p className="text-gray-700 text-center mb-6">
            Create your account and start rating your gatherings.
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-900 mb-2">Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-900 mb-2">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center mt-4 text-gray-700">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}