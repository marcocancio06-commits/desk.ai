// MetricCard - Enhanced stat card with stronger shadows and hover lift
export default function MetricCard({ title, value, subtitle, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    violet: 'bg-violet-50 text-violet-600',
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClasses[color]} shadow-sm`}>
          {icon}
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{title}</p>
        <p className="text-4xl font-bold text-slate-900 mb-2">{value}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
