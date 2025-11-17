import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Sidebar() {
  const router = useRouter();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Leads', href: '/dashboard/leads', icon: '👥' },
    { name: 'Calendar', href: '/dashboard/calendar', icon: '📅' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ];
  
  const isActive = (href) => {
    if (href === '/dashboard') {
      return router.pathname === '/dashboard';
    }
    return router.pathname.startsWith(href);
  };
  
  return (
    <div className="flex flex-col w-64 bg-gray-900 min-h-screen">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <Link href="/" className="text-xl font-bold text-white">
          FrontDesk AI
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-gray-800 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
      
      {/* Bottom section */}
      <div className="p-4 border-t border-gray-800">
        <Link
          href="/demo-chat"
          className="flex items-center px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
        >
          <span className="mr-3 text-lg">💬</span>
          Demo Chat
        </Link>
      </div>
    </div>
  );
}
