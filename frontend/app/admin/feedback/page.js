'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { API_URL } from '@/app/lib/api'

export default function AdminFeedbackPage() {
  const router = useRouter()
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedback()
  }, [])

  async function fetchFeedback() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`${API_URL}/admin/feedback`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFeedback(data)
      } else {
        alert('Failed to load feedback')
      }
    } catch (err) {
      console.error('Error loading feedback:', err)
      alert('Error loading feedback')
    } finally {
      setLoading(false)
    }
  }

  const typeEmojis = {
    feature: '💡',
    bug: '🐛',
    improvement: '✨',
    other: '💬'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading feedback...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          User Feedback
        </h1>

        {feedback.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">No feedback yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map(item => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{typeEmojis[item.feedback_type] || '💬'}</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {item.feedback_type}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                  {item.message}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-3">
                  <span>From: {item.name || 'Anonymous'}</span>
                  {item.email && (
                    <span>Email: {item.email}</span>
                  )}
                  <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
