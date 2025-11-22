// MetricCard - Enhanced stat card with animations and better visual hierarchy
export default function MetricCard({ title, value, subtitle, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50 text-blue-600 shadow-blue-100',
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 text-yellow-600 shadow-yellow-100',
    green: 'bg-gradient-to-br from-green-50 to-green-100/50 text-green-600 shadow-green-100',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-600 shadow-purple-100',
    violet: 'bg-gradient-to-br from-violet-50 to-violet-100/50 text-violet-600 shadow-violet-100',
  };

  return (
    <div className="group relative bg-white/95 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 h-full flex flex-col overflow-hidden animate-scaleIn">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-slate-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClasses[color]} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">{title}</p>
          <p className="text-4xl font-bold text-slate-900 mb-2 tabular-nums">{value}</p>
          <p className="text-sm text-slate-500 leading-snug">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
