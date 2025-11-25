export default function ProblemSolutionSection() {
  const problems = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: "Missed calls = lost revenue",
      description: "You're busy doing the work. By the time you call back, they've already booked someone else."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Slow response times",
      description: "Customers expect instant answers. Responding hours later means they've moved on to your competitor."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: "Manual lead tracking",
      description: "Sticky notes, spreadsheets, text threads—it's chaos. You're spending admin time instead of earning."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Burned out juggling",
      description: "Between jobs, you're answering texts, checking voicemails, updating schedules. There's no time to breathe."
    }
  ];

  const solutions = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      title: "24/7 AI intake",
      description: "Chat + SMS. Your AI assistant captures every lead instantly, day or night, and starts qualifying them.",
      gradient: "from-indigo-500 to-purple-500"
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Smart qualification",
      description: "Desk.ai asks the right questions, filters out tire-kickers, and hands you appointment-ready leads.",
      gradient: "from-purple-500 to-fuchsia-500"
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      title: "Auto-scheduling",
      description: "Appointments sync straight to your Google Calendar. No back-and-forth. No double-bookings.",
      gradient: "from-fuchsia-500 to-pink-500"
    }
  ];

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Problems */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50 mb-4">
              Sound familiar?
            </h2>
            <p className="text-lg text-slate-400">
              You're not alone. Most service businesses bleed leads every single day.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {problems.map((problem, idx) => (
              <div
                key={idx}
                className="group rounded-xl border border-red-900/30 bg-slate-900/40 p-6 hover:bg-slate-900/60 hover:border-red-800/50 transition-all backdrop-blur-sm"
              >
                <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4 group-hover:bg-red-500/20 transition-colors">
                  {problem.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-200 mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {problem.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Solutions */}
        <div>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-fuchsia-500/10 border border-purple-500/20 mb-4">
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-purple-300">The Desk.ai solution</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50 mb-4">
              Let AI handle the front desk
            </h2>
            <p className="text-lg text-slate-400">
              Your virtual receptionist that never sleeps, never takes a break, and never misses a lead.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {solutions.map((solution, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-white/10 bg-slate-900/60 p-8 hover:bg-slate-900/80 transition-all backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${solution.gradient} bg-opacity-10 flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  {solution.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">
                  {solution.title}
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  {solution.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
