import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Logo from '../Logo';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { getNavbarLinks } from '../../lib/redirectAfterLogin';

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, businesses, currentBusiness, signOut } = useAuth();
  const { profile } = useCurrentUser();

  // Determine auth state
  const isAuthenticated = !!user;
  const role = profile?.role || null;
  const hasBusiness = businesses && businesses.length > 0;

  // Get navigation links based on state
  const navLinks = getNavbarLinks({ 
    isAuthenticated, 
    role, 
    hasBusiness,
    currentBusiness 
  });

  // Handle logout
  const handleLogout = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  // Render a single nav link
  const renderNavLink = (link, isMobile = false) => {
    // Safety check - skip if no href and not a button
    if (!link.href && link.type !== 'button') {
      console.warn('Link missing href:', link);
      return null;
    }

    const baseClasses = isMobile
      ? "block px-3 py-2 rounded-lg text-base font-medium transition-colors"
      : "text-gray-600 hover:text-gray-900 transition-colors font-medium";

    const activeClasses = isMobile
      ? "text-gray-900 bg-gray-50"
      : "text-blue-600";

    const inactiveClasses = isMobile
      ? "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
      : "text-gray-600 hover:text-gray-900";

    const isActive = link.href && router.pathname === link.href;
    const className = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;

    if (link.type === 'button' && link.label === 'Log Out') {
      return (
        <button
          key={link.label}
          onClick={handleLogout}
          className={className}
        >
          {link.label}
        </button>
      );
    }

    if (link.isCTA && !isMobile) {
      return (
        <Link 
          key={link.label}
          href={link.href}
          className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
        >
          {link.label}
          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      );
    }

    if (link.isCTA && isMobile) {
      return (
        <Link
          key={link.label}
          href={link.href}
          onClick={() => setMobileMenuOpen(false)}
          className="block mx-3 mt-4 px-5 py-2.5 text-center text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all"
        >
          {link.label} →
        </Link>
      );
    }

    return (
      <Link
        key={link.label}
        href={link.href}
        className={className}
        onClick={isMobile ? () => setMobileMenuOpen(false) : undefined}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo variant="header" showText={true} />
          </div>

          {/* Desktop Navigation - Dynamic based on auth state */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Logged-out navigation */}
            {!isAuthenticated && (
              <>
                {navLinks.map((link) => renderNavLink(link))}
              </>
            )}
            
            {/* Logged-in as owner - Avatar dropdown */}
            {isAuthenticated && role === 'owner' && (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {currentBusiness?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {currentBusiness?.name || 'Account'}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                      {/* Business Info */}
                      {currentBusiness && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-xs text-gray-500 mb-1">Signed in as</p>
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {currentBusiness.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>
                      )}
                      
                      {/* Menu Items */}
                      {navLinks.map((link, index) => (
                        <div key={index}>
                          {link.type === 'button' && link.label === 'Logout' ? (
                            <button
                              onClick={() => {
                                handleLogout();
                                setUserDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              {link.label}
                            </button>
                          ) : link.icon === 'external' ? (
                            <Link href={link.href}>
                              <a
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                onClick={() => setUserDropdownOpen(false)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                {link.label}
                              </a>
                            </Link>
                          ) : (
                            <Link href={link.href}>
                              <a
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                onClick={() => setUserDropdownOpen(false)}
                              >
                                {link.label === 'Dashboard' && (
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                                  </svg>
                                )}
                                {link.label === 'Settings' && (
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                )}
                                {link.label}
                              </a>
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Logged-in as client - Regular links */}
            {isAuthenticated && role === 'client' && (
              <>
                {navLinks.map((link) => renderNavLink(link))}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - Dynamic based on auth state */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Always show Features and Pricing on landing page */}
            {!isAuthenticated && (
              <>
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Pricing
                </a>
              </>
            )}
            
            {/* Dynamic auth-aware links */}
            {navLinks.map((link) => renderNavLink(link, true))}
          </div>
        </div>
      )}
    </nav>
  );
}
