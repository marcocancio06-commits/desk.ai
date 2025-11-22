// Business Directory - /directory
// Simple demo page showing available businesses with filtering

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';
import { BACKEND_URL } from '../lib/config';

export default function Directory() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [zipFilter, setZipFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  // Fetch businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all active businesses from the backend
        const response = await fetch(`${BACKEND_URL}/api/businesses`);
        
        if (!response.ok) {
          throw new Error('Failed to load businesses');
        }
        
        const data = await response.json();
        setBusinesses(data.ok && data.businesses ? data.businesses : []);
      } catch (err) {
        console.error('Error fetching businesses:', err);
        setError('Failed to load businesses');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusinesses();
  }, []);

  // Filter businesses client-side
  const filteredBusinesses = businesses.filter(business => {
    if (zipFilter && business.serviceZipCodes) {
      const hasZip = business.serviceZipCodes.some(zip => 
        zip.includes(zipFilter.trim())
      );
      if (!hasZip) return false;
    }
    
    if (industryFilter && business.industry) {
      const industryMatch = business.industry.toLowerCase().includes(industryFilter.toLowerCase().trim());
      if (!industryMatch) return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo variant="header" showText={true} />
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Back to site
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Find a Service Provider
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with local businesses powered by AI-driven customer service
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by ZIP Code
              </label>
              <input
                id="zip"
                type="text"
                value={zipFilter}
                onChange={(e) => setZipFilter(e.target.value)}
                placeholder="e.g., 77005"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Industry
              </label>
              <input
                id="industry"
                type="text"
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                placeholder="e.g., plumbing, hvac, electrical"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {(zipFilter || industryFilter) && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-gray-600">Active filters:</span>
              {zipFilter && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  ZIP: {zipFilter}
                </span>
              )}
              {industryFilter && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                  Industry: {industryFilter}
                </span>
              )}
              <button
                onClick={() => {
                  setZipFilter('');
                  setIndustryFilter('');
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
            <p className="text-gray-600">Loading businesses...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Business List */}
        {!loading && !error && filteredBusinesses.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No businesses found</h3>
            <p className="text-gray-600">
              {zipFilter || industryFilter 
                ? 'Try adjusting your filters to see more results.' 
                : 'No businesses are currently available.'}
            </p>
          </div>
        )}

        {!loading && !error && filteredBusinesses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <div
                key={business.id}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6">
                  {/* Business Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {business.name}
                    </h3>
                    {business.industry && (
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {business.industry.charAt(0).toUpperCase() + business.industry.slice(1)}
                      </span>
                    )}
                  </div>

                  {/* Business Info */}
                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    {business.phone && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {business.phone}
                      </div>
                    )}
                    {business.serviceZipCodes && business.serviceZipCodes.length > 0 && (
                      <div className="flex items-start">
                        <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>
                          Serving {business.serviceZipCodes.slice(0, 3).join(', ')}
                          {business.serviceZipCodes.length > 3 && ` +${business.serviceZipCodes.length - 3} more`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Services */}
                  {business.services && business.services.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Services</p>
                      <div className="flex flex-wrap gap-1">
                        {business.services.slice(0, 3).map((service, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                          >
                            {service}
                          </span>
                        ))}
                        {business.services.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded">
                            +{business.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CTA Button */}
                  <Link
                    href={`/b/${business.slug}`}
                    className="block w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
                  >
                    Chat with {business.name.split(' ')[0]}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Demo Notice */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Demo Directory</h3>
          <p className="text-gray-700 max-w-2xl mx-auto">
            This is a demonstration of Desk.ai's multi-tenant capabilities. In production, this directory would include 
            all active businesses using Desk.ai for customer service.
          </p>
          <div className="mt-4">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Learn more about Desk.ai →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
