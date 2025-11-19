// QuickActionCard - Clickable card for quick actions with hover effects
export default function QuickActionCard({ href, icon, title, subtitle }) {
  return (
    <a
      href={href}
      className="group flex items-center p-6 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 hover:scale-105"
    >
      <div className="flex-shrink-0 mr-4">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</div>
        <div className="text-sm text-slate-500 mt-1">{subtitle}</div>
      </div>
      <svg 
        className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
