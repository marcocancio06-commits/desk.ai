import StatusBadge from '../../../components/dashboard/StatusBadge';
import UrgencyBadge from '../../../components/dashboard/UrgencyBadge';

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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Issue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr 
                key={lead.id} 
                onClick={() => onLeadClick && onLeadClick(lead.id)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{lead.customerName || 'Unknown'}</div>
                  {lead.zipCode && (
                    <div className="text-sm text-gray-500">{lead.zipCode}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{lead.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {lead.issueSummary || lead.lastMessage || 'No details'}
                  </div>
                  {lead.preferredTime && (
                    <div className="text-xs text-gray-500 mt-1">
                      Preferred: {lead.preferredTime}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={lead.status} size="sm" />
                    {lead.urgency && <UrgencyBadge urgency={lead.urgency} size="sm" />}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(lead.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => onLeadClick && onLeadClick(lead.id)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-gray-900">{lead.customerName || 'Unknown'}</div>
                <div className="text-sm text-gray-500">{lead.phone}</div>
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {formatDate(lead.createdAt)}
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2 line-clamp-2">
              {lead.issueSummary || lead.lastMessage || 'No details'}
            </div>
            <div className="flex items-center space-x-2">
              <StatusBadge status={lead.status} size="sm" />
              {lead.urgency && <UrgencyBadge urgency={lead.urgency} size="sm" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
