import Link from 'next/link';

export default function PricingTeaser() {
  const tiers = [
    {
      name: 'Starter',
      price: '$29',
      description: 'For solo operators getting started',
      features: [
        'Lead inbox',
        'AI chat',
        'Daily summaries',
        'Email support'
      ],
      cta: 'Start free',
      ctaLink: '/demo-chat',
      popular: false
    },
    {
      name: 'Pro',
      price: '$79',
      description: 'For growing crews',
      features: [
        'Everything in Starter',
        'Team access',
        'Scheduling features',
        'Priority support',
        'Custom integrations'
      ],
      cta: 'Start free',
      ctaLink: '/demo-chat',
      popular: true
    },
    {
      name: 'Team',
      price: 'Let\'s talk',
      description: 'For multi-location shops',
      features: [
        'Everything in Pro',
        'Custom setup',
        'Priority support',
        'Volume pricing',
        'Dedicated onboarding'
      ],
      cta: 'Contact sales',
      ctaLink: 'mailto:growzone.ai@gmail.com',
      popular: false
    }
  ];

  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Simple monthly pricing. No long-term contracts.
          </h2>
          <p className="text-xl text-gray-600">
            Start free during beta. Cancel anytime.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {tiers.map((tier, index) => (
            <div 
              key={index}
              className={`rounded-2xl p-8 ${
                tier.popular 
                  ? 'bg-blue-600 text-white shadow-xl scale-105 relative' 
                  : 'bg-gray-50 text-gray-900 border border-gray-200'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="inline-block px-4 py-1 bg-yellow-400 text-gray-900 text-sm font-semibold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className={`text-2xl font-bold mb-2 ${tier.popular ? 'text-white' : 'text-gray-900'}`}>
                  {tier.name}
                </h3>
                <p className={`text-sm mb-4 ${tier.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                  {tier.description}
                </p>
                <div className="flex items-baseline justify-center min-h-[4rem]">
                  {tier.price.startsWith('$') ? (
                    <>
                      <span className={`text-5xl font-bold ${tier.popular ? 'text-white' : 'text-gray-900'}`}>
                        {tier.price}
                      </span>
                      <span className={`ml-2 ${tier.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                        /month
                      </span>
                    </>
                  ) : (
                    <span className={`text-3xl font-bold ${tier.popular ? 'text-white' : 'text-gray-900'}`}>
                      {tier.price}
                    </span>
                  )}
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <svg 
                      className={`w-5 h-5 mr-3 flex-shrink-0 ${tier.popular ? 'text-blue-200' : 'text-green-500'}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={tier.popular ? 'text-blue-50' : 'text-gray-700'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              {tier.ctaLink.startsWith('mailto:') ? (
                <a
                  href={tier.ctaLink}
                  className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {tier.cta}
                </a>
              ) : (
                <Link
                  href={tier.ctaLink}
                  className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? 'bg-white text-blue-600 hover:bg-blue-50'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {tier.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Need a custom plan for enterprise or franchises?
          </p>
          <a 
            href="mailto:growzone.ai@gmail.com"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
          >
            Contact us for custom pricing
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
