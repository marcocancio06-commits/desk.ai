import Link from 'next/link';

export default function FinalCTA() {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      {/* Main CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Stop missing calls. Start closing jobs.
        </h2>
        <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
          Join local service businesses who never miss an opportunity again. Get started in minutes.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            href="/demo-chat"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-lg hover:bg-gray-50 transition-all shadow-lg"
          >
            Try Desk.ai free for 14 days
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          
          <Link 
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-lg hover:bg-white hover:text-blue-600 transition-all"
          >
            View dashboard
          </Link>
        </div>
        
        <div className="flex items-center justify-center gap-6 text-blue-100 text-sm">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            No credit card required
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            14-day free trial
          </div>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Cancel anytime
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="col-span-1">
              <div className="text-2xl font-bold text-white mb-3">Desk.ai</div>
              <p className="text-blue-200 text-sm">
                Your AI front desk for local service businesses.
              </p>
            </div>
            
            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li><Link href="/demo-chat" className="hover:text-white">Demo</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li><Link href="#about" className="hover:text-white">About</Link></li>
                <li><Link href="#contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="#careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="#blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li><Link href="#privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="#security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="pt-8 border-t border-blue-500 flex flex-col sm:flex-row justify-between items-center text-blue-200 text-sm">
            <p>&copy; {currentYear} Desk.ai. All rights reserved.</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <a href="#twitter" className="hover:text-white transition-colors">Twitter</a>
              <a href="#linkedin" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#github" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
