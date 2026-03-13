# PWA Basics - Make Yamily Installable

**Estimated Time:** 2-3 hours
**Goal:** Make Yamily feel like a native app with "Add to Home Screen" capability

---

## Overview

Transform Yamily into a Progressive Web App (PWA) with basic features:
- Installable on mobile devices
- App icon on home screen
- Splash screen when launching
- Standalone mode (no browser UI)

**What we're building:**
- ✅ manifest.json (app metadata)
- ✅ App icons (192px, 512px, 512px maskable)
- ✅ Install prompt
- ✅ Native app appearance

**What we're NOT building (save for post-launch):**
- ❌ Service worker
- ❌ Offline support
- ❌ Push notifications
- ❌ Background sync

---

## PART 1: Create App Icons (30 min)

### Option A: Simple Text-Based Icons (Fastest)

**Create these icon files in `frontend/public/`:**

**File: `frontend/public/icon-192.png`**
- Size: 192x192 pixels
- Background: Gradient from blue (#2563eb) to purple (#9333ea)
- Text: "🎉" emoji centered
- Or: "Y" in white, bold font

**File: `frontend/public/icon-512.png`**
- Size: 512x512 pixels
- Same design as 192px version, just larger

**File: `frontend/public/icon-512-maskable.png`**
- Size: 512x512 pixels
- Same design but with safe zone (icons might be cropped to circles/rounded squares)
- Keep important content within center 80%

### Option B: Use Icon Generator Tool

**Quick method:**
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload any 512x512 image (can use emoji screenshot)
3. Download generated icons
4. Place in `frontend/public/`

### Option C: Create Custom Icons

**If you want custom icons later, create:**
- 192x192 PNG (required)
- 512x512 PNG (required)
- 512x512 PNG maskable (recommended)

**For now, simple is fine!** Even an emoji works.

---

## PART 2: Create Web App Manifest (30 min)

### File: `frontend/public/manifest.json`

**CREATE this new file:**

```json
{
  "name": "Yamily - Family Event Reviews",
  "short_name": "Yamily",
  "description": "Rate your family gatherings. Because someone needs to keep track of Uncle Bob's questionable casseroles.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

**Key fields explained:**
- `name`: Full app name (shown during install)
- `short_name`: Short name (shown on home screen under icon)
- `description`: App description
- `start_url`: Where app opens when launched
- `display: "standalone"`: Hides browser UI, feels like native app
- `background_color`: Splash screen background
- `theme_color`: Status bar color (blue matches Yamily brand)
- `icons`: Array of icon sizes for different devices

---

## PART 3: Link Manifest in App (15 min)

### File: `frontend/app/layout.js`

**FIND the `<head>` section (or metadata export) and ADD:**

```javascript
export const metadata = {
  title: 'Yamily - Family Event Reviews',
  description: 'Rate your family gatherings. Because someone needs to keep track of Uncle Bob\'s questionable casseroles.',
  // ADD THESE:
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Yamily'
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png'
  }
}
```

**OR if using traditional <head> tags:**

```javascript
<head>
  {/* Existing tags */}
  
  {/* PWA Manifest */}
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#2563eb" />
  
  {/* iOS specific */}
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Yamily" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  
  {/* Icons */}
  <link rel="icon" href="/icon-192.png" />
</head>
```

---

## PART 4: Add Install Prompt (Optional but Nice - 45 min)

### Create Install Button Component

**File: `frontend/app/components/InstallPrompt.js`**

**CREATE this new component:**

```javascript
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
```

---

### Add Install Prompt to Layout

**File: `frontend/app/layout.js`**

**IMPORT the component:**

```javascript
import InstallPrompt from './components/InstallPrompt'
```

**ADD to the layout (before closing </body>):**

```javascript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Existing content */}
        {children}
        
        {/* PWA Install Prompt */}
        <InstallPrompt />
      </body>
    </html>
  )
}
```

---

## PART 5: Testing (30 min)

### Test PWA Manifest

**Chrome DevTools:**
1. Open https://yamily.app (or localhost)
2. Open DevTools (F12)
3. Go to "Application" tab
4. Click "Manifest" in sidebar
5. **Verify:**
   - Name shows: "Yamily - Family Event Reviews"
   - Short name shows: "Yamily"
   - Icons load properly
   - Start URL is "/"
   - Display is "standalone"

### Test Installation (Desktop Chrome)

1. Visit https://yamily.app in Chrome
2. Look for install icon in address bar (⊕ or download icon)
3. Click it
4. **Verify:** Install dialog appears
5. Click "Install"
6. **Verify:** App opens in standalone window
7. **Verify:** App icon appears in Applications/Programs

### Test Installation (Mobile)

**iOS Safari:**
1. Visit https://yamily.app
2. Tap Share button
3. Tap "Add to Home Screen"
4. **Verify:** Icon preview shows
5. Tap "Add"
6. **Verify:** Icon appears on home screen
7. Tap icon to launch
8. **Verify:** Opens without Safari UI

**Android Chrome:**
1. Visit https://yamily.app
2. Look for install banner (or tap menu → "Install app")
3. Tap "Install"
4. **Verify:** Icon appears on home screen
5. Tap icon to launch
6. **Verify:** Opens in standalone mode (no browser UI)

### Test Splash Screen

1. Install app (desktop or mobile)
2. Close app
3. Launch from icon
4. **Verify:** Brief splash screen appears (white background, blue theme)
5. **Verify:** App loads

### Test Install Prompt Component

1. Visit site in Chrome (not installed)
2. **Verify:** Install prompt appears at bottom
3. Click "Not Now"
4. **Verify:** Prompt disappears
5. Refresh page
6. **Verify:** Prompt appears again
7. Click "Install"
8. **Verify:** Native install dialog appears

---

## Expected Outcome

**After implementation:**

**Desktop:**
- ✅ Install button appears in Chrome address bar
- ✅ Install prompt shows (if component added)
- ✅ Can install via address bar or prompt
- ✅ Installed app opens in standalone window (no browser UI)
- ✅ Icon appears in Applications

**Mobile:**
- ✅ iOS: "Add to Home Screen" works
- ✅ Android: Install banner appears
- ✅ Icon on home screen
- ✅ Launches in standalone mode (full screen, no browser chrome)
- ✅ Splash screen shows briefly on launch
- ✅ Feels like native app

**Overall:**
- ✅ Yamily installable on all devices
- ✅ Native app appearance
- ✅ Quick access from home screen
- ✅ Professional feel
- ✅ Better user retention (installed apps = higher engagement)

---

## Files Created/Modified

**New files:**
- `frontend/public/manifest.json` - PWA manifest
- `frontend/public/icon-192.png` - Small icon
- `frontend/public/icon-512.png` - Large icon
- `frontend/public/icon-512-maskable.png` - Maskable icon
- `frontend/app/components/InstallPrompt.js` - Install prompt component (optional)

**Modified files:**
- `frontend/app/layout.js` - Added manifest link and meta tags

---

## Troubleshooting

### Install button doesn't appear

**Check:**
- Manifest.json is valid (use Chrome DevTools)
- Icons exist and load
- Using HTTPS (required for PWA)
- Not already installed

### Icons don't show

**Check:**
- Files exist in `/public/` folder
- Filenames match manifest.json exactly
- Images are valid PNG files
- Try hard refresh (Cmd+Shift+R)

### Standalone mode not working

**Check:**
- `display: "standalone"` in manifest.json
- Manifest linked in layout.js
- Using HTTPS
- Try reinstalling

### iOS "Add to Home Screen" not working

**Check:**
- Apple touch icon meta tag exists
- Icon is at least 180x180px
- Using Safari (not Chrome)
- Icon is PNG format

---

## What We're NOT Doing (Post-Launch)

### Service Worker
- Offline support
- Cache strategies
- Background sync
- More complex, can add later

### Push Notifications
- Requires Firebase setup
- Needs service worker
- More complex, save for Week 2

### Advanced PWA Features
- Update prompts
- Periodic background sync
- Share target API

**These can all be added iteratively after launch!**

---

## Time Estimate

**Total: 2-3 hours**

- Part 1 (Icons): 30 min
- Part 2 (Manifest): 30 min
- Part 3 (Link manifest): 15 min
- Part 4 (Install prompt): 45 min
- Part 5 (Testing): 30 min

**Much simpler than full PWA with service worker!**

---

## When Done, Report:

1. ✅ Manifest.json created and valid
2. ✅ Icons created (192px, 512px)
3. ✅ Manifest linked in layout
4. ✅ Install works on desktop Chrome
5. ✅ Install works on iOS Safari
6. ✅ Install works on Android Chrome
7. ✅ App launches in standalone mode
8. ✅ Splash screen appears
9. ✅ Install prompt component working (if added)
10. ✅ Screenshots of installed app

---

## Success Criteria

**Must have:**
- ✅ Users can install Yamily on their device
- ✅ App icon appears on home screen
- ✅ Launches in standalone mode (no browser UI)
- ✅ Feels like a native app

**Nice to have:**
- ✅ Install prompt guides users
- ✅ Splash screen branded
- ✅ Theme color matches brand

**Can wait:**
- ❌ Service worker (offline support)
- ❌ Push notifications
- ❌ Advanced PWA features

---

## Priority: MEDIUM-HIGH

**Why this matters:**
- Installed apps = higher engagement
- Native feel = better user experience
- Home screen icon = constant reminder
- Easier access = more usage

**Why it's not critical:**
- App works fine in browser
- Can add advanced features later
- Basic PWA is quick to implement
- Service worker adds complexity

**This is the final development task before launch!** 🚀

---

## After This

**Development complete!**
- ✅ Core features done
- ✅ Event lifecycle working
- ✅ UI polished
- ✅ Personality infused
- ✅ PWA installable

**Next:**
- Testing (2 days)
- Bug fixes
- Final polish
- **Launch on March 17!** 🍀
