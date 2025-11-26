export default function CalendarPlaceholder() {
  const upcomingAppointments = [
    { id: 1, time: '9:00 AM', customer: 'Michael Chen', service: 'Clogged drain repair' },
    { id: 2, time: '11:30 AM', customer: 'Sarah Johnson', service: 'Water heater inspection' },
    { id: 3, time: '2:00 PM', customer: 'Robert Williams', service: 'Faucet repair' },
  ];
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Calendar Integration Coming Soon
        </h3>
        <p className="text-gray-600 mb-6">
          Full calendar view with scheduling and appointment management
        </p>
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Today's Schedule (Preview)
        </h4>
        <div className="space-y-3">
          {upcomingAppointments.map((appt) => (
            <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-16 text-sm font-semibold text-gray-700">
                  {appt.time}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">{appt.customer}</div>
                  <div className="text-xs text-gray-500">{appt.service}</div>
                </div>
              </div>
              <div className="text-green-600 text-sm font-medium">Confirmed</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
