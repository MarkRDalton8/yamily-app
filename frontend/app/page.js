import Navbar from './components/Navbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
          Welcome to Yamily
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Yelp for Family Gatherings
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
          <p className="text-gray-700 mb-4">
            Rate your family gatherings, parties, and events. 
            Because someone needs to keep track of Uncle Bob's questionable casseroles.
          </p>
          <div className="flex gap-4">
            <a 
              href="/register"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Sign Up
            </a>
            <a 
              href="/login"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}