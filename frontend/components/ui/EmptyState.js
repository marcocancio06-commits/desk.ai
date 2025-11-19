export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-md mx-auto">
        {subtitle}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
