import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Custom500() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="mb-8 sm:mb-12">
          <Link href="/">
            <div className="inline-flex items-center gap-3 cursor-pointer group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <span className="text-2xl sm:text-3xl font-bold text-white">G</span>
              </div>
              <div className="text-left">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Growzone
                </div>
                <div className="text-xs sm:text-sm text-gray-500 font-medium">
                  Powered by Desk.ai
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* 500 Illustration */}
        <div className="mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-red-100 to-orange-100 mb-6 sm:mb-8">
            <svg 
              className="w-20 h-20 sm:w-24 sm:h-24 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold text-gray-900 mb-4 sm:mb-6">
            500
          </h1>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
            Something Went Wrong
          </h2>
          
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-12 max-w-lg mx-auto leading-relaxed">
            We're experiencing technical difficulties. Our team has been notified 
            and we're working to fix the issue. Please try again in a few moments.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
          <button
            onClick={() => router.reload()}
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base touch-manipulation"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          
          <Link href="/" className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all shadow-md hover:shadow-lg text-sm sm:text-base touch-manipulation">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Help Information */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-lg mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Need Help?</h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start text-sm sm:text-base text-gray-700">
              <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Contact Support</p>
                <a href="mailto:support@growzone.ai" className="text-blue-600 hover:text-blue-700 hover:underline">
                  support@growzone.ai
                </a>
              </div>
            </div>
            
            <div className="flex items-start text-sm sm:text-base text-gray-700">
              <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Check Status</p>
                <p className="text-gray-600">
                  Visit our <a href="https://status.growzone.ai" className="text-blue-600 hover:text-blue-700 hover:underline">status page</a> for updates
                </p>
              </div>
            </div>
            
            <div className="flex items-start text-sm sm:text-base text-gray-700">
              <svg className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <div>
                <p className="font-semibold text-gray-900 mb-1">Documentation</p>
                <p className="text-gray-600">
                  Browse our <Link href="/docs"><a className="text-blue-600 hover:text-blue-700 hover:underline">help center</a></Link> for guides
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Beta Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-left">
              <p className="text-sm font-semibold text-yellow-900 mb-1">Early Access Notice</p>
              <p className="text-xs sm:text-sm text-yellow-800">
                We're in early access and continuously improving. Thanks for your patience 
                as we work to provide the best experience possible.
              </p>
            </div>
          </div>
        </div>

        {/* Beta Badge */}
        <div className="mt-8">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs font-semibold border border-purple-200">
            <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
            Early Access
          </span>
        </div>
      </div>
    </div>
  );
}
