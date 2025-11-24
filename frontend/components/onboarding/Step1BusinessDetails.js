// Step 1: Business Details
import { useState, useEffect } from 'react';

const INDUSTRIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'handyman', label: 'General Handyman' },
  { value: 'other', label: 'Other' }
];

export default function Step1BusinessDetails({ data, updateData, onNext }) {
  const [errors, setErrors] = useState({});
  const [slugPreview, setSlugPreview] = useState('');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);

  // Generate slug from business name
  useEffect(() => {
    if (data.businessName) {
      const generated = data.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlugPreview(generated || 'your-business');
    } else {
      setSlugPreview('your-business');
    }
  }, [data.businessName]);

  const validateStep = () => {
    const newErrors = {};

    // Business name validation
    if (!data.businessName || data.businessName.trim().length < 2) {
      newErrors.businessName = 'Business name is required (minimum 2 characters)';
    }

    // Industry validation
    if (!data.industry) {
      newErrors.industry = 'Please select an industry';
    }

    // Phone validation
    if (!data.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(data.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Email validation
    if (!data.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      // Store the generated slug in wizard data
      updateData('slug', slugPreview);
      onNext();
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Tell us about your business
      </h2>
      <p className="text-gray-600 mb-6">
        We'll use this information to customize your experience and help customers find you.
      </p>

      <div className="space-y-6">
        {/* Business Name */}
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
            Business Name <span className="text-red-500">*</span>
          </label>
          <input
            id="businessName"
            type="text"
            value={data.businessName}
            onChange={(e) => updateData('businessName', e.target.value)}
            placeholder="e.g., Acme Plumbing Co."
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.businessName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.businessName && (
            <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
          )}
          
          {/* Slug Preview */}
          {slugPreview && data.businessName && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Your business URL
                  </p>
                  <p className="text-sm text-blue-800 font-mono">
                    desk.ai/b/<span className="font-bold">{slugPreview}</span>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    This is your public booking page customers will visit
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Industry */}
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
            Industry <span className="text-red-500">*</span>
          </label>
          <select
            id="industry"
            value={data.industry}
            onChange={(e) => updateData('industry', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.industry ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select your industry...</option>
            {INDUSTRIES.map((industry) => (
              <option key={industry.value} value={industry.value}>
                {industry.label}
              </option>
            ))}
          </select>
          {errors.industry && (
            <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            This helps Desk.ai personalize your AI assistant's responses
          </p>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Business Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => updateData('phone', e.target.value)}
            placeholder="e.g., +1-555-123-4567"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            This is the number customers will use to contact you
          </p>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Business Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => updateData('email', e.target.value)}
            placeholder="e.g., contact@acmeplumbing.com"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-end">
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
