// EmptyState - Enhanced with softer background and better spacing
export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-16 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-white border-2 border-slate-200 rounded-2xl mb-5 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
      <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
        {subtitle}
      </p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
