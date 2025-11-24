import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
              <span className="mr-2">🤖</span>
              AI-Powered Customer Engagement
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Your AI Front Desk for Local Service Businesses
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Turn every inbound message into a qualified lead, scheduled job, and daily summary — automatically.
            </p>
            
            {/* Supporting Points */}
            <div className="space-y-3 mb-10">
              <div className="flex items-center justify-center lg:justify-start text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">Never miss a customer again</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">Qualify and schedule jobs 24/7</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start text-gray-700">
                <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-lg">Daily summaries and lead insights</span>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="/get-started"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get started
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                href="/demo-chat"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-all border-2 border-gray-300 hover:border-gray-400"
              >
                <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                View demo
              </Link>
            </div>
          </div>
          
          {/* Right Column - Visual Mockup */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Chat Window Mockup */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="ml-4 text-white font-medium">Customer Chat</div>
                </div>
                <div className="p-6 space-y-4 bg-gray-50 h-80">
                  {/* Customer Message */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg p-4 max-w-xs shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Customer</div>
                      <p className="text-gray-800">My water heater is leaking. Can you come today?</p>
                    </div>
                  </div>
                  {/* AI Response */}
                  <div className="flex justify-end">
                    <div className="bg-blue-600 rounded-lg p-4 max-w-xs shadow-sm">
                      <div className="text-xs text-blue-200 mb-1">Desk.ai</div>
                      <p className="text-white">I can help you schedule that repair. What's your ZIP code?</p>
                    </div>
                  </div>
                  {/* Customer Response */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg p-4 max-w-xs shadow-sm border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Customer</div>
                      <p className="text-gray-800">77005. It's an emergency!</p>
                    </div>
                  </div>
                  {/* AI Processing */}
                  <div className="flex justify-end">
                    <div className="bg-blue-600 rounded-lg p-4 max-w-xs shadow-sm">
                      <div className="text-xs text-blue-200 mb-1">Desk.ai</div>
                      <p className="text-white">Got it. I've marked this as high priority...</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats Card - Overlapping */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-6 border border-gray-200">
                <div className="text-sm text-gray-600 mb-3">Today's Activity</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">New Leads</span>
                    <span className="font-bold text-blue-600 text-xl">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Scheduled</span>
                    <span className="font-bold text-green-600 text-xl">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Urgent</span>
                    <span className="font-bold text-red-600 text-xl">3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
