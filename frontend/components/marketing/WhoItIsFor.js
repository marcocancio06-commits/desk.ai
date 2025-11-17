export default function WhoItIsFor() {
  const audiences = [
    {
      icon: '🔧',
      category: 'Plumbers',
      description: 'Emergency calls, leaks, and replacements — without missing a single inquiry.'
    },
    {
      icon: '❄️',
      category: 'HVAC',
      description: 'Seasonal rushes, after-hours no-cool calls, and maintenance plans.'
    },
    {
      icon: '⚡',
      category: 'Electricians',
      description: 'Panel upgrades, troubleshoot calls, and urgent outages.'
    },
    {
      icon: '🧹',
      category: 'Cleaning Services',
      description: 'Recurring jobs, move-out cleans, and last-minute requests.'
    },
    {
      icon: '🔨',
      category: 'Appliance Repair',
      description: 'Broken fridges, washers, and ovens lined up and organized.'
    },
    {
      icon: '🛠️',
      category: 'Handyman & Contractors',
      description: 'Mixed jobs, quotes, and follow-ups without the chaos.'
    }
  ];

  return (
    <div className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Who Desk.ai is for
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built for local service businesses that live and die by the phone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {audiences.map((audience, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-4">{audience.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {audience.category}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {audience.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            If you run a service business where every missed call is lost revenue, Desk.ai is for you.
          </p>
        </div>
      </div>
    </div>
  );
}
