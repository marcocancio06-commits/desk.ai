import Link from 'next/link';

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm font-medium mb-6">
              <span className="mr-2">🚀</span>
              AI-Powered Tools for Local Services
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Grow Your Local Service Business with AI
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              <span className="font-semibold text-gray-900">Growzone</span> helps local service businesses connect with customers through AI-powered tools and a trusted marketplace.
            </p>
            
            {/* Product Highlight - Desk.ai */}
            <div className="bg-white rounded-xl p-6 mb-8 border-2 border-blue-200 shadow-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Desk.ai — Your AI Front Desk</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Never miss a lead. Qualify customers, schedule jobs, and get daily summaries — all automated 24/7.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Dual CTAs */}
            <div className="space-y-4 mb-6">
              <Link 
                href="/auth/signup?role=owner"
                className="block w-full sm:inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                For Business Owners
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <div className="text-center">
                <span className="text-gray-500 text-sm">or</span>
              </div>
              
              <Link 
                href="/marketplace"
                className="block w-full sm:inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-all border-2 border-gray-300 hover:border-gray-400 shadow-md"
              >
                <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                For Customers — Find a Provider
              </Link>
            </div>
            
            {/* Trust Badge */}
            <p className="text-sm text-gray-500 text-center lg:text-left">
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Early access • Join local service businesses growing with AI
              </span>
            </p>
          </div>
          
          {/* Right Column - Visual Mockup */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Dashboard Preview Card */}
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200">
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between text-white">
                    <span className="font-bold text-lg">Desk.ai Dashboard</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-sm">Live</span>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4 bg-gradient-to-br from-gray-50 to-blue-50 h-80">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4 shadow-md border border-blue-100">
                      <div className="text-xs text-gray-600 mb-1">Today's Leads</div>
                      <div className="text-2xl font-bold text-blue-600">12</div>
                      <div className="text-xs text-green-600">+3 from yesterday</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-md border border-green-100">
                      <div className="text-xs text-gray-600 mb-1">Scheduled</div>
                      <div className="text-2xl font-bold text-green-600">8</div>
                      <div className="text-xs text-green-600">67% conversion</div>
                    </div>
                  </div>
                  
                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-900">New lead: Water heater repair</div>
                          <div className="text-xs text-gray-500">ZIP 77005 • 2 min ago</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-900">Scheduled: HVAC inspection</div>
                          <div className="text-xs text-gray-500">Tomorrow 2PM</div>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-900">Quote sent: Kitchen remodel</div>
                          <div className="text-xs text-gray-500">$12,500 • Pending</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Badge - AI Powered */}
              <div className="absolute -top-4 -left-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full px-4 py-2 shadow-xl font-semibold text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Powered
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
