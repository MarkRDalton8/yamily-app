'use client'
// IMPORTS - Tools we need
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  // ROUTING - Navigate between pages and get current path
  const router = useRouter()
  const pathname = usePathname()
  
  // STATE - Track logged-in user and user type
  const [user, setUser] = useState(null)
  const [userType, setUserType] = useState('attendee')

  // EFFECT - Check if user is logged in when navbar loads or route changes
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      setUserType(userData.user_type || 'attendee')
    }
  }, [pathname]) // Re-check when route changes

  // FUNCTION - Handle logout
  const handleLogout = () => {
    // Clear stored user data
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Update state
    setUser(null)
    
    // Redirect to home page
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo - links to My Events if logged in, otherwise homepage */}
          <a href={user ? "/my-events" : "/"} className="text-2xl font-bold text-gray-900">
            🎉 Yamily
          </a>
          
          {/* Navigation Links - Changes based on login state */}
          <div className="flex items-center gap-4">
            {/* Show these links when NOT logged in */}
            {!user && (
              <>
                <a href="/login" className="text-gray-600 hover:text-gray-900">
                  Login
                </a>
                <a 
                  href="/register" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Sign Up
                </a>
              </>
            )}
            
            {/* Show these links when logged in */}
            {user && (
              <>
                <a href="/my-events" className="text-gray-600 hover:text-gray-900">
                  My Events
                </a>
                {/* Only show Create Event for hosts */}
                {userType === 'host' && (
                  <a href="/events" className="text-gray-600 hover:text-gray-900">
                    Create Event
                  </a>
                )}
                <a href="/join" className="text-gray-600 hover:text-gray-900">
                  Join Event
                </a>
                
                {/* User info and logout */}
                <div className="flex items-center gap-3 pl-4 border-l">
                  <span className="text-gray-700">
                    👋 {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 underline"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}