'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Save the event so it can be triggered later
      setDeferredPrompt(e)
      // Show the install button
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  // Don't show if already installed or prompt not available
  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-xl p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🎉</div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">Install Yamily</h3>
          <p className="text-sm text-blue-100 mb-3">
            Add to your home screen for quick access!
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg font-medium text-sm hover:bg-blue-800 transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white hover:text-gray-200 text-xl"
        >
          ×
        </button>
      </div>
    </div>
  )
}
