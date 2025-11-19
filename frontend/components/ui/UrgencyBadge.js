export default function UrgencyBadge({ urgency, size = 'md' }) {
  if (!urgency || urgency === 'none') return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const urgencyConfig = {
    emergency: { 
      bg: 'bg-red-100', 
      text: 'text-red-700', 
      icon: '🚨',
      label: 'Emergency' 
    },
    high: { 
      bg: 'bg-orange-100', 
      text: 'text-orange-700', 
      icon: '⚡',
      label: 'High' 
    },
    normal: { 
      bg: 'bg-slate-100', 
      text: 'text-slate-600', 
      icon: '',
      label: 'Normal' 
    }
  };

  const config = urgencyConfig[urgency] || urgencyConfig.normal;

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${config.bg} ${config.text}`}>
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );
}
