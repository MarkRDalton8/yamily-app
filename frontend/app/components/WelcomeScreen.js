'use client'
import { useRouter } from 'next/navigation'

export default function WelcomeScreen({ onSelect }) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-2">🎉 Welcome to Yamily!</h1>
        <p className="text-center text-gray-600 mb-12">What brings you here?</p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Host Option */}
          <button
            onClick={() => onSelect('host')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105 text-left border-2 border-transparent hover:border-blue-500"
          >
            <div className="text-5xl mb-4">🎈</div>
            <h2 className="text-2xl font-bold mb-3">I'm Hosting Events</h2>
            <p className="text-gray-600 mb-4">
              Create and manage gatherings, get guest feedback, and track event success.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ Create unlimited events</li>
              <li>✓ Manage guest lists</li>
              <li>✓ Customize rating categories</li>
              <li>✓ See event analytics</li>
            </ul>
            <div className="mt-6 text-blue-600 font-semibold">
              Get Started as Host →
            </div>
          </button>

          {/* Attendee Option */}
          <button
            onClick={() => onSelect('attendee')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105 text-left border-2 border-transparent hover:border-purple-500"
          >
            <div className="text-5xl mb-4">🎊</div>
            <h2 className="text-2xl font-bold mb-3">I'm Attending Events</h2>
            <p className="text-gray-600 mb-4">
              Join parties, leave reviews, and share memorable moments from gatherings.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✓ Join unlimited events</li>
              <li>✓ Anonymous reviews</li>
              <li>✓ Live event commentary</li>
              <li>✓ Vote on reviews</li>
            </ul>
            <div className="mt-6 text-purple-600 font-semibold">
              Browse Events →
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          You can always change this later in your account settings
        </p>
      </div>
    </div>
  )
}
