/**
 * MarketingLayout
 * 
 * Dark, cinematic wrapper for public marketing pages
 * Inspired by n8n.io but with Growzone/Desk.ai branding
 * Features: radial gradients, glass morphism, blue-purple palette
 */

export default function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background gradients - radial circles with brand colors */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Top gradient - indigo blue */}
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-3xl opacity-40" />
        
        {/* Bottom right gradient - purple */}
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/25 rounded-full blur-3xl opacity-50" />
        
        {/* Center accent - fuchsia */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-fuchsia-500/15 rounded-full blur-3xl opacity-30" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
