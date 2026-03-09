'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

export default function JoinPage() {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')

  const handleCodeSubmit = (e) => {
    e.preventDefault()
    if (inviteCode.length === 8) {
      router.push(`/join/${inviteCode}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Join an Event</h1>
        <p className="text-gray-600 mb-4 text-lg">
          To join an event, you need a shareable invite link from the host.
        </p>
        <p className="text-gray-600 mb-6">
          The link looks like: <code className="bg-gray-200 px-2 py-1 rounded">yamily.app/join/X7K9M2A4</code>
        </p>
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
          <p className="text-blue-800 font-semibold mb-2">How it works:</p>
          <ol className="text-left text-gray-700 space-y-2">
            <li>1. Host creates an event and gets a unique invite link</li>
            <li>2. Host shares the link with you via text or email</li>
            <li>3. You click the link and join the event</li>
            <li>4. You're all set to review the event after it happens!</li>
          </ol>
        </div>

        {/* Manual invite code entry section */}
        <div className="mt-8 pt-8 border-t border-gray-300 max-w-xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Already have an invite code?
          </h3>
          <p className="text-gray-600 mb-4">
            Enter your invite code below to join the event directly.
          </p>

          <form onSubmit={handleCodeSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g., X7K9M2A4)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg text-center sm:text-left"
              maxLength={8}
            />
            <button
              type="submit"
              disabled={inviteCode.length !== 8}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors whitespace-nowrap"
            >
              Join Event
            </button>
          </form>
        </div>

        <button
          onClick={() => router.push('/')}
          className="mt-8 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-medium transition-colors"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  )
}