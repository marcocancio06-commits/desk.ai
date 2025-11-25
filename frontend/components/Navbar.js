import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getNavbarLinks } from '../lib/redirectAfterLogin';

export default function Navbar() {
  const router = useRouter();
  const { user, businesses, currentBusiness, signOut } = useAuth();
  const { profile } = useCurrentUser();

  // Determine auth state
  const isAuthenticated = !!user;
  const role = profile?.role || null;
  const hasBusiness = businesses && businesses.length > 0;

  // Get navigation links based on state
  const navLinks = getNavbarLinks({ isAuthenticated, role, hasBusiness });

  // Handle logout
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent cursor-pointer">
                Desk.ai
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {navLinks.map((link) => {
              if (link.type === 'button' && link.label === 'Log Out') {
                return (
                  <button
                    key={link.label}
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    {link.label}
                  </button>
                );
              }

              // Special styling for CTAs
              if (link.isCTA) {
                return (
                  <Link key={link.label} href={link.href}>
                    <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                );
              }

              // Regular links
              const isActive = router.pathname === link.href;
              return (
                <Link key={link.label} href={link.href}>
                  <span className={`font-medium transition-colors cursor-pointer ${
                    isActive 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
