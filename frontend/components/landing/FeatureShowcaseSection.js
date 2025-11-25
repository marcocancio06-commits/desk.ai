export default function FeatureShowcaseSection() {
  const features = [
    {
      badge: "Lead capture",
      title: "AI front desk that actually books jobs",
      description: "Your customers text, chat, or call. Desk.ai captures every detail, asks qualifying questions, and books appointments—no human needed until the job starts.",
      mockup: (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
          <div className="space-y-3">
            {/* Pipeline stages */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
              <span>Lead pipeline</span>
              <div className="h-px flex-1 bg-gradient-to-r from-slate-700 to-transparent" />
            </div>
            
            {[
              { status: 'New lead', name: 'Sarah M.', time: 'Just now', color: 'blue' },
              { status: 'Qualified', name: 'Mike R.', time: '2 min ago', color: 'purple' },
              { status: 'Scheduled', name: 'Tom K.', time: '10:30 AM', color: 'green' }
            ].map((lead, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-white/5">
                <div className={`w-2 h-2 rounded-full bg-${lead.color}-400 animate-pulse`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-200">{lead.name}</div>
                  <div className="text-xs text-slate-500">{lead.status}</div>
                </div>
                <div className="text-xs text-slate-400">{lead.time}</div>
              </div>
            ))}
            
            {/* Arrow showing flow */}
            <div className="flex items-center justify-center py-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            
            {/* Appointment card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-400/30">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-green-300">Booked automatically</span>
              </div>
              <div className="text-xs text-slate-300">Tomorrow at 10:30 AM · Emergency plumbing</div>
            </div>
          </div>
        </div>
      ),
      align: 'left' // text on left, mockup on right
    },
    {
      badge: "Owner dashboard",
      title: "Simple dashboard, no training needed",
      description: "See all your leads, conversations, and appointments in one place. Filter by status, export reports, and manage your pipeline—all designed for mobile use between jobs.",
      mockup: (
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
          {/* Mini dashboard preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h4 className="text-sm font-semibold text-slate-200">Today's leads</h4>
              <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">8 new</span>
            </div>
            
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'New', value: '12', color: 'blue' },
                { label: 'Qualified', value: '8', color: 'purple' },
                { label: 'Booked', value: '5', color: 'green' }
              ].map((stat, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-white/5">
                  <div className={`text-2xl font-bold text-${stat.color}-400 mb-1`}>{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              ))}
            </div>
            
            {/* Sample lead */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-white/5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-medium text-slate-200">John Smith</div>
                  <div className="text-xs text-slate-500">Water heater repair · 77005</div>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30">
                  Qualified
                </div>
              </div>
              <div className="text-xs text-slate-400">
                💬 Last message: "Can you come tomorrow?"
              </div>
            </div>
          </div>
        </div>
      ),
      align: 'right' // text on right, mockup on left
    },
    {
      badge: "Integrations",
      title: "Plays nicely with your tools",
      description: "Desk.ai syncs with the tools you already use. Google Calendar for scheduling, SMS for texting customers, and automation tools for custom workflows.",
      mockup: (
        <div className="space-y-4">
          {/* Integration cards */}
          {[
            { 
              name: 'Google Calendar', 
              status: 'Live', 
              icon: '📅',
              description: 'Automatic appointment sync',
              statusColor: 'green'
            },
            { 
              name: 'Twilio SMS', 
              status: 'Live', 
              icon: '📱',
              description: 'Two-way text messaging',
              statusColor: 'green'
            },
            { 
              name: 'Automations', 
              status: 'Coming soon', 
              icon: '⚡',
              description: 'Zapier, n8n, Make',
              statusColor: 'yellow'
            }
          ].map((integration, idx) => (
            <div
              key={idx}
              className="group rounded-xl border border-white/10 bg-slate-900/60 p-5 hover:bg-slate-900/80 transition-all backdrop-blur-md"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{integration.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-semibold text-slate-200">{integration.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      integration.statusColor === 'green' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {integration.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{integration.description}</p>
                </div>
                <svg className="w-5 h-5 text-slate-600 group-hover:text-slate-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      ),
      align: 'left'
    }
  ];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-32">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                feature.align === 'right' ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Text content */}
              <div className={feature.align === 'right' ? 'lg:order-2' : ''}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-sm mb-4">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{feature.badge}</span>
                </div>
                
                <h3 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50 mb-6 leading-tight">
                  {feature.title}
                </h3>
                
                <p className="text-lg text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Mockup */}
              <div className={feature.align === 'right' ? 'lg:order-1' : ''}>
                {feature.mockup}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
