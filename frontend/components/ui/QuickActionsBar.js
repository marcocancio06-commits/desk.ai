// Quick Actions Bar - Reusable component for action buttons at top of pages

export default function QuickActionsBar({ actions }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center gap-3">
        {actions.map((action, idx) => (
          <a
            key={idx}
            href={action.href}
            onClick={action.onClick}
            className={`inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md ${
              action.primary
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </a>
        ))}
      </div>
    </div>
  );
}
