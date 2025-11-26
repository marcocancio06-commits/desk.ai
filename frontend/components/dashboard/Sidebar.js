import Link from 'next/link';
import { useRouter } from 'next/router';
import Logo from '../Logo';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthorizedLinks, PERMISSIONS } from '../../lib/permissions';

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter();
  const { user, currentBusiness, businesses, businessLoading, switchBusiness, signOut, userRole } = useAuth();
  
  // Determine what to display for business name
  const getBusinessDisplayName = () => {
    if (businessLoading) return 'Loading...';
    if (!currentBusiness) return 'No Business';
    return currentBusiness.name;
  };
  
  const getRoleBadge = () => {
    if (!userRole) return null;
    const colors = {
      owner: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      staff: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors[userRole] || colors.staff}`}>
        {userRole}
      </span>
    );
  };
  
  const allNavigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      permission: PERMISSIONS.VIEW_DASHBOARD,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: 'Leads', 
      href: '/dashboard/leads', 
      permission: PERMISSIONS.VIEW_LEADS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      name: 'Calendar', 
      href: '/dashboard/calendar', 
      permission: PERMISSIONS.VIEW_CALENDAR,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      name: 'Team', 
      href: '/dashboard/team', 
      permission: PERMISSIONS.VIEW_TEAM,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      name: 'Settings', 
      href: '/dashboard/settings', 
      permission: PERMISSIONS.VIEW_SETTINGS,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];
  
  // Filter navigation based on user role
  const navigation = getAuthorizedLinks(userRole, allNavigation);
  
  const isActive = (href) => {
    if (href === '/dashboard') {
      return router.pathname === '/dashboard';
    }
    return router.pathname.startsWith(href);
  };
  
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 bg-gradient-to-b from-slate-900 to-slate-950 lg:min-h-screen lg:fixed shadow-2xl">
        {/* Brand Header with Gradient Strip */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 rounded-br-3xl shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-br-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <Logo variant="minimal" showText={false} size={40} linkTo="/dashboard" />
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-lg tracking-tight">Desk.ai</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-blue-100 text-xs font-medium truncate">
                    {getBusinessDisplayName()}
                  </p>
                  {getRoleBadge()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-lg shadow-blue-500/10'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {isActive(item.href) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full shadow-lg shadow-blue-500/50" />
              )}
              <span className={`mr-3 ${isActive(item.href) ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'} transition-colors duration-200`}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* Divider */}
        <div className="px-4">
          <div className="border-t border-slate-800"></div>
        </div>
        
        {/* Business Selector (if multiple businesses) */}
        {businesses && businesses.length > 1 && (
          <div className="px-4 py-3">
            <label className="block text-xs font-medium text-slate-400 mb-2">Switch Business</label>
            <select
              value={currentBusiness?.id || ''}
              onChange={(e) => switchBusiness(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {businesses.map((biz) => (
                <option key={biz.id} value={biz.id}>
                  {biz.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Bottom section */}
        <div className="p-4 space-y-2">
          <Link
            href="/demo-chat"
            className="flex items-center justify-center px-4 py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Demo Chat
          </Link>
          
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>
      
      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header with Gradient Strip */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 rounded-br-3xl shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-br-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo variant="minimal" showText={false} size={40} linkTo="/dashboard" onClick={onClose} />
              <div>
                <h2 className="text-white font-bold text-lg tracking-tight">Desk.ai</h2>
                <p className="text-blue-100 text-xs font-medium">
                  {getBusinessDisplayName()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="px-3 py-6 space-y-1.5">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-lg shadow-blue-500/10'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              {isActive(item.href) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full shadow-lg shadow-blue-500/50" />
              )}
              <span className={`mr-3 ${isActive(item.href) ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'} transition-colors duration-200`}>
                {item.icon}
              </span>
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* Divider */}
        <div className="px-4">
          <div className="border-t border-slate-800"></div>
        </div>
        
        {/* Business Selector (if multiple businesses) */}
        {businesses && businesses.length > 1 && (
          <div className="px-4 py-3">
            <label className="block text-xs font-medium text-slate-400 mb-2">Switch Business</label>
            <select
              value={currentBusiness?.id || ''}
              onChange={(e) => switchBusiness(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {businesses.map((biz) => (
                <option key={biz.id} value={biz.id}>
                  {biz.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <Link
            href="/demo-chat"
            onClick={onClose}
            className="flex items-center justify-center px-4 py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Demo Chat
          </Link>
          
          <button
            onClick={() => {
              onClose();
              signOut();
            }}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>
      
      {/* Spacer for desktop layout */}
      <div className="hidden lg:block lg:w-64 flex-shrink-0" />
    </>
  );
}
