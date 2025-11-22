// QuickActionCard - Polished clickable card with smooth animations
export default function QuickActionCard({ href, icon, title, subtitle }) {
  return (
    <a
      href={href}
      className="group relative flex items-center p-6 bg-white/90 backdrop-blur-sm border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-lifted transition-all duration-300 hover:scale-[1.02] overflow-hidden animate-fadeIn"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-50/50 to-blue-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative z-10 flex items-center w-full">
        <div className="flex-shrink-0 mr-4 transform transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
            {title}
          </div>
          <div className="text-sm text-slate-500 mt-1 leading-snug">
            {subtitle}
          </div>
        </div>
        <svg 
          className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </a>
  );
}
