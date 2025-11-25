import Link from 'next/link';

export default function CTAStrip() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 opacity-90" />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
      
      <div className="relative max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-6">
          Ready to try Desk.ai with your business?
        </h2>
        
        <p className="text-lg sm:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
          Join service businesses using AI to capture more leads and book more jobs—without hiring a receptionist.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/signup?role=owner"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-indigo-600 bg-white rounded-full hover:bg-slate-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            Get early access
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          <a
            href="mailto:marco@growzone.com?subject=Interested in Desk.ai"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white rounded-full border-2 border-white/30 hover:border-white/50 hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            Talk to founders
          </a>
        </div>
        
        <p className="mt-8 text-sm text-indigo-200">
          ✓ Free during beta  •  ✓ No credit card required  •  ✓ Setup in 5 minutes
        </p>
      </div>
    </section>
  );
}
