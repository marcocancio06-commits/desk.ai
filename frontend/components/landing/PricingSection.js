import { MARKETPLACE_ENABLED } from '../../lib/featureFlags';

export default function PricingSection() {
  return (
    <section className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-400/30 text-sm font-semibold mb-4">
            <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-300">Early Access Pricing</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Everything you need to grow your business. No hidden fees, no surprises.
          </p>
        </div>
        
        <div className="max-w-lg mx-auto">
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden">
            {/* Popular badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-400 text-slate-950 px-6 py-2 rounded-bl-2xl font-bold text-sm shadow-lg">
              🚀 Early Access
            </div>
            
            <div className="p-8 sm:p-10">
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold mb-2 text-slate-50">Growzone Pro</h3>
                <p className="text-slate-400">Everything you need to succeed</p>
              </div>
              
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-6xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">$39</span>
                  <span className="text-2xl ml-2 text-slate-400">/month</span>
                </div>
                <p className="text-slate-400 text-sm">
                  <span className="line-through opacity-60">$79/mo</span> • Limited time offer
                </p>
              </div>
              
              <div className="space-y-4 mb-8">
                {[
                  'Unlimited leads & conversations',
                  'AI-powered chat assistant (Desk.ai)',
                  'Owner dashboard & pipeline',
                  ...(MARKETPLACE_ENABLED ? ['Marketplace listing & profile'] : []),
                  'Smart scheduling & notifications',
                  'Daily summary emails',
                  'Mobile-friendly dashboard',
                  'Priority support'
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-start">
                    <svg className="w-6 h-6 text-green-400 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-200">{feature}</span>
                  </div>
                ))}
              </div>
              
              <a
                href="/auth/signup?role=owner"
                className="block w-full text-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 hover:from-indigo-600 hover:via-purple-600 hover:to-fuchsia-600 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Start for Free
              </a>
              
              <p className="text-center text-slate-400 text-sm mt-4">
                ✓ No credit card required • ✓ Free during beta • ✓ Cancel anytime
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-slate-400 mb-4">
              Need a custom plan for multiple locations or enterprise?
            </p>
            <a
              href="mailto:support@growzone.ai"
              className="inline-flex items-center text-purple-400 hover:text-purple-300 font-semibold"
            >
              Contact us for custom pricing
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
