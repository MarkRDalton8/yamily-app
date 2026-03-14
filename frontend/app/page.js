'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <span className="text-xl font-bold text-gray-900">Yamily</span>
            </div>

            {/* Auth Buttons */}
            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-12 sm:pb-16">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6">
            Rate Your Family Gatherings
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-gray-700 mb-3 sm:mb-4 max-w-3xl mx-auto leading-relaxed">
            Because someone needs to keep track of Uncle Bob's questionable casseroles.
          </p>
          <p className="text-base sm:text-lg text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto">
            The honest, anonymous review platform for family parties, gatherings, and events.
            Share what really happened with those who were there.
          </p>
          <Link
            href="/register"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-base sm:text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-16 sm:mb-20">
          {/* Feature 1: Rate the Chaos */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🍽️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Rate the Chaos</h3>
            <p className="text-gray-700">
              Food quality, drama levels, alcohol availability, and conversation topics.
              The categories that actually matter.
            </p>
          </div>

          {/* Feature 2: Live Event Feed */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Live Event Feed</h3>
            <p className="text-gray-700">
              Share photos and comments while the party's happening.
              Real-time commentary on the unfolding madness.
            </p>
          </div>

          {/* Feature 3: Stay Anonymous */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🎭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Stay Anonymous</h3>
            <p className="text-gray-700">
              Choose your pseudonym. Review honestly.
              What happens at Thanksgiving stays at Thanksgiving... sort of.
            </p>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 mb-16 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Create Event</h3>
              <p className="text-gray-700">
                Set up your gathering and invite family members via shareable link
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Share & Comment</h3>
              <p className="text-gray-700">
                Post photos and reactions in the Live Feed during the event
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Review Honestly</h3>
              <p className="text-gray-700">
                Rate and review after it's over. The truth shall set you free.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 sm:p-12 text-white text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Document the Madness?
          </h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-blue-100">
            Join families everywhere who are finally being honest about their gatherings.
          </p>
          <Link
            href="/register"
            className="inline-block px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 text-base sm:text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Your First Event
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-16 sm:mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-700">
          <p className="mb-2">🎉 Yamily - Honest reviews for family gatherings</p>
          <p className="text-sm">
            Because every family dinner deserves a rating.
          </p>
        </div>
      </footer>
    </div>
  )
}
