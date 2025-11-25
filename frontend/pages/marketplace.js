// Marketplace Page - /marketplace
// Public marketplace for businesses listed on Desk.ai (Growzone Market v1)
// FEATURE FLAG: Controlled by MARKETPLACE_ENABLED in lib/featureFlags.js

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Logo from '../components/Logo';
import Footer from '../components/marketing/Footer';
import { BACKEND_URL } from '../lib/config';
import { formatIndustryName } from '../lib/industryServices';
import { MARKETPLACE_ENABLED } from '../lib/featureFlags';

export default function Marketplace() {
  const router = useRouter();

  // FEATURE FLAG: Redirect if marketplace is disabled
  useEffect(() => {
    if (!MARKETPLACE_ENABLED) {
      router.push('/');
    }
  }, [router]);

  // Return empty while redirecting
  if (!MARKETPLACE_ENABLED) {
    return null;
  }
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [zipFilter, setZipFilter] = useState('');

  // Fetch marketplace businesses (only is_public = true)
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${BACKEND_URL}/api/marketplace`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Marketplace API error:', errorData);
          throw new Error(errorData.error || 'Failed to load marketplace');
        }
        
        const data = await response.json();
        
        if (!data.ok) {
          throw new Error(data.error || 'Invalid response from marketplace API');
        }
        
        setBusinesses(data.businesses || []);
      } catch (err) {
        console.error('Error fetching marketplace businesses:', err);
        setError(err.message || 'Failed to load marketplace');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinesses();
  }, []);

  // Filter businesses client-side
  const filteredBusinesses = businesses.filter(business => {
    // Search filter (name)
    if (searchQuery) {
      const nameMatch = business.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!nameMatch) return false;
    }
    
    // Industry filter
    if (industryFilter && business.industry) {
      const industryMatch = business.industry.toLowerCase().includes(industryFilter.toLowerCase().trim());
      if (!industryMatch) return false;
    }
    
    // ZIP filter
    if (zipFilter && business.service_zip_codes) {
      const hasZip = business.service_zip_codes.some(zip => 
        zip.includes(zipFilter.trim())
      );
      if (!hasZip) return false;
    }
    
    return true;
  });

  return (
    <>
      <Head>
        <title>Growzone Market | Desk.ai</title>
        <meta name="description" content="Browse businesses powered by Desk.ai. Connect with local service providers using AI-driven customer service." />
        <meta name="robots" content="index, follow" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Logo variant="header" showText={true} />
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Back to home
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-semibold text-gray-800">Beta Marketplace</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Growzone Market
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover local service businesses using Desk.ai for instant, AI-powered customer responses.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            {/* Search Bar */}
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search businesses
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by business name..."
                  className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by industry
                </label>
                <div className="relative">
                  <input
                    id="industry"
                    type="text"
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                    placeholder="e.g., plumbing, hvac, electrical"
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by ZIP code
                </label>
                <div className="relative">
                  <input
                    id="zip"
                    type="text"
                    value={zipFilter}
                    onChange={(e) => setZipFilter(e.target.value)}
                    placeholder="e.g., 90210"
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Active Filters */}
            {(searchQuery || industryFilter || zipFilter) && (
              <div className="mt-4 flex items-center gap-2 text-sm flex-wrap">
                <span className="text-gray-600 font-medium">Active filters:</span>
                {searchQuery && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                    Search: "{searchQuery}"
                  </span>
                )}
                {industryFilter && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                    Industry: {industryFilter}
                  </span>
                )}
                {zipFilter && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                    ZIP: {zipFilter}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIndustryFilter('');
                    setZipFilter('');
                  }}
                  className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Loading marketplace...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
              <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-red-900 mb-2">We couldn't load the marketplace</h3>
              <p className="text-red-700 mb-4">
                Please refresh the page or try again later. If the problem persists, contact support.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh page
              </button>
            </div>
          )}

          {/* Empty State - No Businesses */}
          {!loading && !error && businesses.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No businesses visible in Growzone Market yet
              </h3>
              <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                Once business owners opt in to appear in the marketplace, they'll show up here. This is an early access marketplace.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/signup?role=owner" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Add your business →
                </Link>
                <Link href="/" className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold">
                  Learn about Desk.ai
                </Link>
              </div>
            </div>
          )}

          {/* Empty State - Filters Applied, No Results */}
          {!loading && !error && businesses.length > 0 && filteredBusinesses.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No businesses match these filters
              </h3>
              <p className="text-lg text-gray-600 mb-6 max-w-md mx-auto">
                Try adjusting your search criteria or clearing the filters to see more results.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIndustryFilter('');
                  setZipFilter('');
                }}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear all filters
              </button>
            </div>
          )}

          {/* Business Grid */}
          {!loading && !error && filteredBusinesses.length > 0 && (
            <>
              <div className="mb-6 text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredBusinesses.length}</span> {filteredBusinesses.length === 1 ? 'business' : 'businesses'}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBusinesses.map((business) => {
                  const zipCodes = business.service_zip_codes || [];
                  const industryName = formatIndustryName(business.industry);
                  
                  return (
                    <div
                      key={business.id}
                      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
                    >
                      {/* Card Header */}
                      <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
                        <div className="absolute inset-0 bg-black opacity-10"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-end gap-3">
                            {/* Logo */}
                            <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                              {business.logo_url ? (
                                <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {/* Business Header */}
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                            {business.name}
                          </h3>
                          
                          {/* Tagline */}
                          {business.tagline && (
                            <p className="text-gray-600 text-sm mb-3 italic line-clamp-2">
                              "{business.tagline}"
                            </p>
                          )}
                          
                          {business.industry && (
                            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {industryName}
                            </span>
                          )}
                        </div>

                        {/* Short Description */}
                        {business.short_description && (
                          <div className="mb-4">
                            <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                              {business.short_description}
                            </p>
                          </div>
                        )}

                        {/* Service Areas */}
                        {zipCodes && zipCodes.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-start text-gray-600 text-sm">
                              <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <div className="flex-1">
                                <div className="flex flex-wrap gap-1.5">
                                  {zipCodes.slice(0, 5).map((zip, idx) => (
                                    <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                      {zip}
                                    </span>
                                  ))}
                                  {zipCodes.length > 5 && (
                                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                                      +{zipCodes.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Active on Desk.ai Badge */}
                        <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                          <div className="flex items-center text-sm">
                            <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700 font-medium">Active on Desk.ai</span>
                          </div>
                        </div>

                        {/* CTA Button */}
                        <Link
                          href={`/b/${business.slug}`}
                          className="block w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-semibold"
                        >
                          💬 Chat with this business
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Info Footer */}
          <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-8 shadow-md">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-3">
                  <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wide">
                    Early Access
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">About Growzone Market</h3>
                <p className="text-gray-700 mb-2 text-lg leading-relaxed">
                  This is an early marketplace showcasing local service businesses that have opted in to be discoverable. 
                  Each business here uses <strong>Desk.ai</strong> for AI-powered customer service, available 24/7.
                </p>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Desk.ai helps service businesses never miss a customer inquiry with intelligent chat that qualifies leads, 
                  answers questions, and schedules appointments automatically.
                </p>
                <div className="flex flex-wrap gap-4 mt-6">
                  <Link href="/" className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold border-2 border-blue-600 shadow-sm">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Learn about Desk.ai
                  </Link>
                  <Link href="/get-started" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-md">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add your business
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
