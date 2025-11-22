import StatusPill from '../../../components/ui/StatusPill';
import UrgencyBadge from '../../../components/ui/UrgencyBadge';

export default function LeadTable({ leads, onLeadClick }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };
  
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-soft overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Issue
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {leads.map((lead, index) => (
              <tr 
                key={lead.id} 
                onClick={() => onLeadClick && onLeadClick(lead.id)}
                className="group hover:bg-blue-50/50 cursor-pointer transition-all duration-200 hover:shadow-sm animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm mr-3 shadow-sm group-hover:shadow-md transition-shadow">
                      {(lead.customerName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {lead.customerName || 'Unknown'}
                      </div>
                      {lead.zipCode && (
                        <div className="text-xs text-slate-500 flex items-center mt-0.5">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {lead.zipCode}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-700">{lead.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900 max-w-xs truncate font-medium">
                    {lead.issueSummary || lead.lastMessage || 'No details'}
                  </div>
                  {lead.preferredTime && (
                    <div className="text-xs text-slate-500 mt-1 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {lead.preferredTime}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <StatusPill status={lead.status} size="sm" />
                    <UrgencyBadge urgency={lead.urgency} size="sm" />
                    {lead.sms_enabled && (
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                        title={`Last SMS: ${lead.last_sms_at ? new Date(lead.last_sms_at).toLocaleString() : 'Unknown'}`}
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3.293 3.293 3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                        SMS
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-500">
                  {formatDate(lead.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {leads.map((lead, index) => (
          <div
            key={lead.id}
            onClick={() => onLeadClick && onLeadClick(lead.id)}
            className="p-5 hover:bg-blue-50/30 cursor-pointer transition-all duration-200 animate-fadeIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm mr-3 shadow-sm flex-shrink-0">
                  {(lead.customerName || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900 truncate">
                    {lead.customerName || 'Unknown'}
                  </div>
                  <div className="text-sm text-slate-500">{lead.phone}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 whitespace-nowrap ml-3 font-medium">
                {formatDate(lead.createdAt)}
              </div>
            </div>
            <div className="text-sm text-slate-700 mb-3 line-clamp-2 leading-relaxed">
              {lead.issueSummary || lead.lastMessage || 'No details'}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusPill status={lead.status} size="sm" />
              <UrgencyBadge urgency={lead.urgency} size="sm" />
              {lead.sms_enabled && (
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                  title={`Last SMS: ${lead.last_sms_at ? new Date(lead.last_sms_at).toLocaleString() : 'Unknown'}`}
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3.293 3.293 3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                  SMS
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
