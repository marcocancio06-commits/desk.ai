// Step 5: Setup Complete - Final success screen after business creation
import Link from 'next/link';

export default function Step5Complete({ businessSlug, businessName }) {
  return (
    <div className="text-center py-8">
      {/* Success Icon */}
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl shadow-green-500/30 mb-6 animate-bounce-in">
        <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Heading */}
      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Setup Complete! 🎉
      </h2>
      
      <p className="text-lg text-gray-700 mb-2 font-medium">
        {businessName || 'Your business'} is now live on Desk.ai
      </p>
      
      <p className="text-gray-600 mb-8 max-w-lg mx-auto">
        Your AI front desk is ready to handle customer conversations 24/7. Start managing leads and appointments from your dashboard.
      </p>

      {/* Checklist of what's been set up */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 max-w-md mx-auto border border-blue-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 text-left">What's ready:</h3>
        <div className="space-y-3 text-left">
          <div className="flex items-center text-sm text-gray-700">
            <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>AI-powered chat interface</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Lead tracking dashboard</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Appointment scheduling</span>
          </div>
          <div className="flex items-center text-sm text-gray-700">
            <svg className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Public business page</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-base font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 transform"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Go to Dashboard
        </Link>

        {businessSlug && (
          <Link
            href={`/b/${businessSlug}`}
            className="inline-flex items-center px-8 py-4 bg-white text-gray-700 text-base font-semibold rounded-xl border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Your Public Page
          </Link>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-10 pt-8 border-t border-gray-200">
        <p className="text-sm text-gray-500 mb-2">
          Need help getting started?
        </p>
        <a 
          href="mailto:support@desk.ai" 
          className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contact support@desk.ai
        </a>
      </div>
    </div>
  );
}
