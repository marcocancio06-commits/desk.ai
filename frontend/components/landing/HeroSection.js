import { MARKETPLACE_ENABLED } from '../../lib/featureFlags';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Grow smarter <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                with AI.
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {MARKETPLACE_ENABLED ? (
                'Tools and a marketplace built for local service businesses.'
              ) : (
                'AI-powered tools built for local service businesses.'
              )}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="/auth/signup?role=owner"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                For Business Owners
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              
              {MARKETPLACE_ENABLED && (
                <a
                  href="/marketplace"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition-all border-2 border-gray-300 hover:border-blue-500 shadow-md"
                >
                  Find a Local Provider
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </a>
              )}
            </div>
            
            <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-gray-500">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free during beta
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
            </div>
          </div>
          
          {/* Right: Dashboard illustration */}
          <div className="relative">
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Dashboard header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <span className="text-xl font-bold">G</span>
                    </div>
                    <span className="font-bold text-lg">Growzone Dashboard</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm">Live</span>
                  </div>
                </div>
              </div>
              
              {/* Dashboard content */}
              <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
                    <div className="text-xs text-gray-600 mb-1">New Leads</div>
                    <div className="text-3xl font-bold text-blue-600">24</div>
                    <div className="text-xs text-green-600">↑ 12% this week</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md border border-green-100">
                    <div className="text-xs text-gray-600 mb-1">Scheduled</div>
                    <div className="text-3xl font-bold text-green-600">16</div>
                    <div className="text-xs text-green-600">67% conversion</div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</div>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">New: HVAC repair request</div>
                        <div className="text-xs text-gray-500">ZIP 94103 • 5 min ago</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">Scheduled: Plumbing inspection</div>
                        <div className="text-xs text-gray-500">Tomorrow 2PM</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">Quote: Electrical upgrade</div>
                        <div className="text-xs text-gray-500">$3,200 • Pending</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Badge */}
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full px-4 py-2 shadow-xl font-semibold text-sm flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Powered
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
