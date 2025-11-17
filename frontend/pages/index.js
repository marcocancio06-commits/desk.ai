import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          FrontDesk AI
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your intelligent front desk for local service businesses
        </p>
        <Link 
          href="/demo-chat"
          className="inline-block px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Demo Chat
        </Link>
      </div>
    </div>
  )
}
