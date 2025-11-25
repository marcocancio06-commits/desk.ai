import Link from 'next/link';

export default function DarkHeroSection() {
  return (
    <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-sm mb-6">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-400 via-purple-500 to-fuchsia-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">Gz</span>
              </div>
              <span className="text-slate-300 text-sm font-medium">Growzone</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400 text-sm">Flagship product</span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-50 mb-6 leading-tight">
              AI front desk for
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
                local service businesses
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
              Capture leads 24/7, qualify instantly, and schedule appointments automatically—all while you focus on the work.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/auth/signup?role=owner"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 hover:from-indigo-600 hover:via-purple-600 hover:to-fuchsia-600 transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
              >
                For business owners
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <button
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-slate-200 rounded-full border border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-600 transition-all backdrop-blur-sm"
                onClick={() => window.location.href = 'mailto:marco@growzone.com?subject=Interested in Desk.ai'}
              >
                Talk to founders
              </button>
            </div>
          </div>

          {/* Right: Chat UI mockup */}
          <div className="relative">
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-fuchsia-500/20 blur-3xl opacity-60" />
            
            {/* Chat mockup card */}
            <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">Desk.ai Assistant</div>
                  <div className="text-xs text-slate-500">Always online</div>
                </div>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3 py-2">
                {/* Customer message */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-slate-800 px-4 py-3 border border-white/5">
                    <p className="text-sm text-slate-100">
                      Hi, my sink is leaking. Can someone come tomorrow morning?
                    </p>
                  </div>
                </div>

                {/* AI response */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-900/90 px-4 py-3 border border-indigo-400/30 shadow-lg shadow-indigo-500/10">
                    <p className="text-sm text-slate-100 mb-2">
                      I'd be happy to help! I have availability tomorrow at 9 AM or 11 AM. Which works better for you?
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>AI-powered · Instant response</span>
                    </div>
                  </div>
                </div>

                {/* Customer reply */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-slate-800 px-4 py-3 border border-white/5">
                    <p className="text-sm text-slate-100">
                      9 AM works great, thanks!
                    </p>
                  </div>
                </div>

                {/* AI confirmation */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-slate-900/90 px-4 py-3 border border-purple-400/30 shadow-lg shadow-purple-500/10">
                    <p className="text-sm text-slate-100 mb-3">
                      Perfect! I've booked you for 9 AM tomorrow with Houston Premier Plumbing.
                    </p>
                    
                    {/* Status chip */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-xs font-medium text-green-300">Lead qualified · Appointment booked</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamp */}
              <div className="pt-3 border-t border-white/5">
                <p className="text-xs text-slate-500 text-center">
                  Conversation started 2 minutes ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
