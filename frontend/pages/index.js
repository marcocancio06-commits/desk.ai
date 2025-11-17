import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          FrontDesk AI
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your intelligent front desk for local service businesses
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            Owner Dashboard
          </Link>
          <Link 
            href="/demo-chat"
            className="inline-block px-6 py-3 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-500 hover:bg-blue-50 transition-colors"
          >
            Try Demo Chat
          </Link>
        </div>
      </div>
    </div>
  )
}
