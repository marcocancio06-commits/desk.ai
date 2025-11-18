export default function SocialProof() {
  const businessTypes = [
    'Plumbing',
    'HVAC',
    'Electrical',
    'Cleaning',
    'Contractors',
    'Appliance Repair'
  ];

  return (
    <div className="bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-2">
            Built for trades and local service teams
          </p>
          <p className="text-gray-600 text-sm">
            Examples of businesses Desk.ai is designed for:
          </p>
        </div>
        
        {/* Business Type Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60">
          {businessTypes.map((type, index) => (
            <div key={index} className="text-center">
              <div className="text-gray-600 font-semibold text-sm px-4 py-2 bg-white rounded-lg border border-gray-200">
                {type}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
