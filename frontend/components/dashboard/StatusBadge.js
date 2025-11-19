export default function StatusBadge({ status, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };
  
  const statusConfig = {
    new: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'New' },
    collecting_info: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Collecting Info' },
    qualified: { bg: 'bg-green-100', text: 'text-green-800', label: 'Qualified' },
    ready_to_book: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready to Book' },
    scheduled: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Scheduled' },
    booked: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Booked' },
    closed_won: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Closed Won' },
    closed_lost: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed Lost' },
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Completed' },
    cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
  };
  
  const config = statusConfig[status] || { 
    bg: 'bg-gray-100', 
    text: 'text-gray-800', 
    label: status 
  };
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  );
}
