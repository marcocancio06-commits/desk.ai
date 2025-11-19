export default function StatusPill({ status, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const statusConfig = {
    new: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'New' },
    collecting_info: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Collecting Info' },
    qualified: { bg: 'bg-green-100', text: 'text-green-700', label: 'Qualified' },
    ready_to_book: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ready to Book' },
    scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled' },
    booked: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Booked' },
    completed: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Completed' },
    closed_won: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Closed Won' },
    closed_lost: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Closed Lost' },
    cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Cancelled' }
  };

  const config = statusConfig[status] || statusConfig.new;

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
