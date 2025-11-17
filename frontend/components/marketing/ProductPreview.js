export default function ProductPreview() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            See Desk.ai in action
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From first message to scheduled job — all in one place.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side: Copy + Bullets */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Everything you need to run your front desk
            </h3>
            <p className="text-lg text-gray-600">
              Desk.ai handles every customer interaction from start to finish, 
              so you can focus on doing the work instead of managing messages.
            </p>
            
            <ul className="space-y-4">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-semibold text-gray-900">AI chat that collects issue, ZIP code, and urgency.</span>
                  <p className="text-gray-600 text-sm mt-1">Every conversation is automatically qualified and organized.</p>
                </div>
              </li>
              
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-semibold text-gray-900">Leads pipeline showing where every job stands.</span>
                  <p className="text-gray-600 text-sm mt-1">See new, quoted, scheduled, and completed jobs at a glance.</p>
                </div>
              </li>
              
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <span className="font-semibold text-gray-900">Daily summary so you know exactly what to do next.</span>
                  <p className="text-gray-600 text-sm mt-1">Start every morning with a clear action plan.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Right side: Fake UI Preview */}
          <div className="relative">
            {/* Main container with shadow */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              
              {/* Chat window header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                </div>
                <span className="text-white text-sm font-medium">Live Chat</span>
                <div className="w-16"></div>
              </div>

              {/* Chat messages */}
              <div className="p-6 space-y-4 bg-gray-50 min-h-[300px]">
                {/* Customer message */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-700">JD</span>
                  </div>
                  <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow-sm max-w-[80%]">
                    <p className="text-sm text-gray-800">
                      My water heater is leaking. Can you come today?
                    </p>
                    <span className="text-xs text-gray-500 mt-1 block">2:34 PM</span>
                  </div>
                </div>

                {/* AI response */}
                <div className="flex items-start space-x-3 justify-end">
                  <div className="bg-blue-600 rounded-lg rounded-tr-none px-4 py-3 shadow-sm max-w-[80%]">
                    <p className="text-sm text-white">
                      I can help schedule that. What is your ZIP code?
                    </p>
                    <span className="text-xs text-blue-100 mt-1 block">2:34 PM</span>
                  </div>
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">AI</span>
                  </div>
                </div>

                {/* Customer reply */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-gray-700">JD</span>
                  </div>
                  <div className="bg-white rounded-lg rounded-tl-none px-4 py-3 shadow-sm max-w-[80%]">
                    <p className="text-sm text-gray-800">94103</p>
                    <span className="text-xs text-gray-500 mt-1 block">2:35 PM</span>
                  </div>
                </div>

                {/* AI response */}
                <div className="flex items-start space-x-3 justify-end">
                  <div className="bg-blue-600 rounded-lg rounded-tr-none px-4 py-3 shadow-sm max-w-[80%]">
                    <p className="text-sm text-white">
                      Got it! How urgent is this? (1-5, where 5 is emergency)
                    </p>
                    <span className="text-xs text-blue-100 mt-1 block">2:35 PM</span>
                  </div>
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">AI</span>
                  </div>
                </div>
              </div>

              {/* Mini leads table */}
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recent Leads</h4>
                  <span className="text-xs text-blue-600 font-medium">View all →</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">John D. • Water heater</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">New</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Sarah M. • AC repair</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Scheduled</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Mike R. • Drain clog</span>
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Urgent</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating summary card */}
            <div className="absolute -right-4 -top-4 bg-white rounded-xl shadow-xl border border-gray-200 px-6 py-4 hidden lg:block">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Today</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-900">12 new leads</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-900">8 scheduled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-900">3 urgent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
