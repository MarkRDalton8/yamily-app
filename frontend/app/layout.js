import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InstallPrompt from './components/InstallPrompt';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'Yamily - Event Reviews',
  description: 'Rate your gatherings. Because every dinner party deserves a rating.',
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

        {/* PWA Install Prompt */}
        <InstallPrompt />
      </body>
    </html>
  );
}
