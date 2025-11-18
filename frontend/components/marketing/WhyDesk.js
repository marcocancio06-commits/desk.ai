export default function WhyDesk() {
  const reasons = [
    {
      title: 'Handles emergencies and after-hours messages',
      description: 'Your AI front desk never sleeps. Capture urgent jobs at 2 AM and wake up to qualified leads ready to schedule.',
      icon: '🚨'
    },
    {
      title: 'Works on mobile for owners on the move',
      description: 'Built mobile-first. Check leads, update job status, and schedule work from your phone between job sites.',
      icon: '📱'
    },
    {
      title: 'Designed for jobs and crews, not corporate CRMs',
      description: 'No complex pipelines or enterprise nonsense. Simple stages: collecting info, qualified, scheduled, closed. That is it.',
      icon: '🔧'
    },
    {
      title: 'AI that writes notes the way an owner would',
      description: 'No jargon. Just clear summaries like "Water heater leak in 77005, needs same-day, customer available after 2pm."',
      icon: '✍️'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Built for trades, not for tech bros
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We get it. You're running a business, not a software company.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {reasons.map((reason, index) => (
            <div 
              key={index}
              className="bg-gray-800 rounded-xl p-8 border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start">
                <div className="text-4xl mr-4 flex-shrink-0">
                  {reason.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {reason.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional Trust Signal */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 text-lg mb-4">
            No long-term contracts. No setup fees. Cancel anytime.
          </p>
          <div className="flex items-center justify-center space-x-8 text-gray-500">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Free while in beta
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Setup in 10 minutes
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Cancel anytime
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
