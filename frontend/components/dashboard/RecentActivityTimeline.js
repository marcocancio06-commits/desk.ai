// Recent Activity Timeline Component
// Shows last events with visual timeline and status indicators

import { formatDistanceToNow } from 'date-fns';

export default function RecentActivityTimeline({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-slate-500">No recent activity</p>
        <p className="text-xs text-slate-400 mt-1">Events will appear here as they happen</p>
      </div>
    );
  }

  const getEventIcon = (type) => {
    switch (type) {
      case 'lead_created':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        );
      case 'status_changed':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        );
      case 'appointment_scheduled':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'lead_created':
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'status_changed':
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'appointment_scheduled':
        return 'bg-green-100 text-green-600 border-green-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <div key={event.id || idx} className="relative pl-8">
          {/* Timeline line */}
          {idx !== events.length - 1 && (
            <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-200" />
          )}
          
          {/* Event icon */}
          <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getEventColor(event.type)}`}>
            {getEventIcon(event.type)}
          </div>
          
          {/* Event content */}
          <div className="pb-4">
            <div className="flex items-start justify-between mb-1">
              <h4 className="text-sm font-semibold text-slate-900">
                {event.title}
              </h4>
              <span className="text-xs text-slate-500 ml-2 whitespace-nowrap">
                {event.timestamp ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) : 'Just now'}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-slate-600">{event.description}</p>
            )}
            {event.metadata && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(event.metadata).map(([key, value]) => (
                  <span key={key} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
