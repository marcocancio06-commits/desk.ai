// EmptyState - Warm, friendly, and helpful empty state component
export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-2 border-dashed border-slate-200 rounded-2xl p-12 md:p-16 text-center overflow-hidden animate-fadeIn">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10"></div>
      
      <div className="relative">
        {/* Icon container with pulse effect */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-white to-slate-50 border-2 border-slate-200 rounded-2xl mb-6 shadow-soft animate-scaleIn">
          <div className="text-slate-400">
            {icon}
          </div>
        </div>
        
        {/* Content */}
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 tracking-tight">
          {title}
        </h3>
        <p className="text-sm md:text-base text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
          {subtitle}
        </p>
        
        {/* Action button */}
        {action && (
          <div className="animate-slideUp animate-delay-200">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
