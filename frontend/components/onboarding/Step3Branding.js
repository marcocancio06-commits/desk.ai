// Step 3: Marketplace & Branding
// FEATURE FLAG: Marketplace UI controlled by MARKETPLACE_ENABLED
import { useState } from 'react';
import { MARKETPLACE_ENABLED } from '../../lib/featureFlags';

export default function Step3Branding({ data, updateData, onNext, onBack }) {
  const [errors, setErrors] = useState({});

  const validateStep = () => {
    const newErrors = {};

    // If marketplace is enabled, tagline and description are recommended
    if (MARKETPLACE_ENABLED && data.isPublic) {
      if (!data.tagline || data.tagline.trim().length < 10) {
        newErrors.tagline = 'Tagline should be at least 10 characters to help customers understand your service';
      } else if (data.tagline.length > 60) {
        newErrors.tagline = 'Tagline must be 60 characters or less';
      }

      if (!data.shortDescription || data.shortDescription.trim().length < 20) {
        newErrors.shortDescription = 'Description should be at least 20 characters';
      } else if (data.shortDescription.length > 200) {
        newErrors.shortDescription = 'Description must be 200 characters or less';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      onNext();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {MARKETPLACE_ENABLED ? 'Marketplace Visibility' : 'Business Setup'}
      </h2>
      <p className="text-gray-600 mb-6">
        {MARKETPLACE_ENABLED 
          ? 'Choose whether to list your business in the Growzone Market where customers can find and chat with you.'
          : 'Configure your business settings. Your business chat will be accessible via direct link.'
        }
      </p>

      <div className="space-y-6">
        {/* Marketplace Toggle - Only show if marketplace feature is enabled */}
        {MARKETPLACE_ENABLED && (
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  List in Growzone Market
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Make your business discoverable in our public marketplace. Customers can search, filter, and chat with your AI assistant to schedule services.
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Public profile at /b/{data.slug || 'your-business'}
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Searchable by location and industry
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    24/7 AI assistant for lead capture
                  </li>
                </ul>
              </div>
              <div className="ml-6">
                <button
                  type="button"
                  onClick={() => updateData('isPublic', !data.isPublic)}
                  className={`
                    relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${data.isPublic ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 
                      transition duration-200 ease-in-out
                      ${data.isPublic ? 'translate-x-6' : 'translate-x-0'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conditional Fields - Only show if marketplace is enabled AND user opted in */}
        {MARKETPLACE_ENABLED && data.isPublic && (
          <>
            {/* Tagline */}
            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-2">
                Business Tagline <span className="text-red-500">*</span>
              </label>
              <input
                id="tagline"
                type="text"
                maxLength={60}
                value={data.tagline || ''}
                onChange={(e) => updateData('tagline', e.target.value)}
                placeholder="e.g., Fast, reliable plumbing for Houston homes"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.tagline ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.tagline ? (
                  <p className="text-sm text-red-600">{errors.tagline}</p>
                ) : (
                  <p className="text-sm text-gray-500">A short, catchy description (max 60 characters)</p>
                )}
                <p className="text-xs text-gray-400">{(data.tagline || '').length}/60</p>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Business Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="shortDescription"
                rows={4}
                maxLength={200}
                value={data.shortDescription || ''}
                onChange={(e) => updateData('shortDescription', e.target.value)}
                placeholder="e.g., We're a family-owned plumbing company serving Houston since 2010. We specialize in emergency repairs, installations, and maintenance for residential and commercial properties."
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.shortDescription ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.shortDescription ? (
                  <p className="text-sm text-red-600">{errors.shortDescription}</p>
                ) : (
                  <p className="text-sm text-gray-500">Help customers understand what you do (max 200 characters)</p>
                )}
                <p className="text-xs text-gray-400">{(data.shortDescription || '').length}/200</p>
              </div>
            </div>

            {/* Marketplace Preview */}
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Marketplace Preview</h4>
              <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{data.businessName || 'Your Business Name'}</h3>
                    <p className="text-sm text-blue-600 font-medium">{data.tagline || 'Your tagline will appear here'}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {data.industry || 'Industry'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {data.shortDescription || 'Your description will appear here to help customers understand what you offer.'}
                </p>
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {data.zipCodes?.length > 0 
                    ? `Serving ${data.zipCodes.slice(0, 3).join(', ')}${data.zipCodes.length > 3 ? ` +${data.zipCodes.length - 3} more` : ''}` 
                    : 'Service area will appear here'}
                </div>
                <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Chat with this business
                </button>
              </div>
            </div>
          </>
        )}

        {/* Private Mode Info */}
        {!data.isPublic && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-gray-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Private Mode
                </h4>
                <p className="text-sm text-gray-600">
                  Your business will only be accessible via direct link. You can enable marketplace listing later from your dashboard settings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
