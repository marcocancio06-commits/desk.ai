import Layout from './components/Layout';

export default function Settings() {
  const businessInfo = {
    name: 'Your Service Business',
    phone: '+1-555-123-4567',
    email: 'owner@business.com',
    serviceAreas: ['77005', '77030', '77098'],
  };
  
  const businessHours = {
    weekdays: '8:00 AM - 6:00 PM',
    saturday: '9:00 AM - 4:00 PM',
    sunday: 'Closed',
  };
  
  return (
    <Layout title="Settings" subtitle="Configure your business preferences">
      <div className="space-y-6">
        {/* Business Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                defaultValue={businessInfo.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Settings are read-only in this demo</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  defaultValue={businessInfo.phone}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue={businessInfo.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Business Hours */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Business Hours</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekdays
                </label>
                <input
                  type="text"
                  defaultValue={businessHours.weekdays}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saturday
                </label>
                <input
                  type="text"
                  defaultValue={businessHours.saturday}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sunday
                </label>
                <input
                  type="text"
                  defaultValue={businessHours.sunday}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Service Areas */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Service Areas</h2>
          </div>
          <div className="px-6 py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Codes
            </label>
            <div className="flex flex-wrap gap-2">
              {businessInfo.serviceAreas.map((zip) => (
                <span
                  key={zip}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {zip}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Service area configuration will be available in the full version
            </p>
          </div>
        </div>
        
        {/* Notifications */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">New Lead Alerts</div>
                <div className="text-sm text-gray-500">Get notified when new leads come in</div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                disabled
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Booking Confirmations</div>
                <div className="text-sm text-gray-500">Receive confirmation when appointments are booked</div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                disabled
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Daily Summary</div>
                <div className="text-sm text-gray-500">Daily email with lead and booking summary</div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                disabled
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
        
        {/* Coming Soon Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">ℹ️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Settings Coming Soon</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Full settings management will be available in the next version. This includes:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Editable business information</li>
                  <li>Custom service offerings and pricing</li>
                  <li>Advanced notification preferences</li>
                  <li>Team member management</li>
                  <li>Subscription and billing settings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
