export default function UrgencyBadge({ urgency, size = 'md' }) {
  if (!urgency || urgency === 'none') return null;
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };
  
  const urgencyConfig = {
    emergency: { bg: 'bg-red-100', text: 'text-red-800', label: 'Emergency', icon: '🚨' },
    high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High', icon: '⚡' },
    normal: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Normal', icon: '' },
  };
  
  const config = urgencyConfig[urgency] || urgencyConfig.normal;
  
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses[size]}`}>
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );
}
