export default function DeskAIShowcaseSection() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      title: "Lead Capture",
      description: "AI chat automatically qualifies every customer inquiry and captures all details"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Smart Scheduling",
      description: "Move leads to scheduled in one click. Set appointments and send confirmations automatically"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Owner Dashboard",
      description: "See all leads, track pipeline, and manage your business from one simple dashboard"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      title: "Public Chat Widget",
      description: "Customers can chat with your AI assistant directly from your public business page"
    }
  ];

  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Screenshot mock */}
          <div className="order-2 lg:order-1">
            <div className="relative">
              {/* Main dashboard screenshot */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <span className="font-bold">D</span>
                      </div>
                      <span className="font-bold">Desk.ai</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-sm">Active</span>
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-[400px]">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                      <div className="text-xs text-gray-600 mb-1">New</div>
                      <div className="text-2xl font-bold text-blue-600">18</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                      <div className="text-xs text-gray-600 mb-1">Scheduled</div>
                      <div className="text-2xl font-bold text-green-600">12</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                      <div className="text-xs text-gray-600 mb-1">Closed</div>
                      <div className="text-2xl font-bold text-purple-600">31</div>
                    </div>
                  </div>
                  
                  {/* Leads list */}
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <div className="text-sm font-semibold text-gray-700 mb-3">Today's Leads</div>
                    <div className="space-y-3">
                      {[
                        { name: 'Sarah M.', issue: 'Water heater repair', status: 'new', color: 'yellow' },
                        { name: 'Mike R.', issue: 'HVAC maintenance', status: 'scheduled', color: 'green' },
                        { name: 'John D.', issue: 'Electrical panel', status: 'quoted', color: 'blue' }
                      ].map((lead, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">
                              {lead.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                              <div className="text-xs text-gray-500">{lead.issue}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${lead.color}-100 text-${lead.color}-700`}>
                            {lead.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl px-6 py-3 shadow-2xl font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                24/7 Automated
              </div>
            </div>
          </div>
          
          {/* Right: Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm font-semibold mb-6">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI-Powered Front Desk
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Desk.ai — Your AI Front Desk
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Never miss a lead again. Desk.ai handles customer conversations 24/7, captures every detail, and keeps your pipeline organized.
            </p>
            
            <div className="space-y-4 mb-8">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <a
              href="/auth/signup?role=owner"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Start with Desk.ai
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
