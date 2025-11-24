// Step 2: Service Area
import { useState } from 'react';

export default function Step2ServiceArea({ data, updateData, onNext, onBack }) {
  const [errors, setErrors] = useState({});
  const [zipCodeInput, setZipCodeInput] = useState('');

  const validateZipCode = (zip) => {
    // Basic US ZIP code validation (5 digits or 5+4 format)
    return /^\d{5}(-\d{4})?$/.test(zip);
  };

  const handleAddZipCode = () => {
    const zip = zipCodeInput.trim();
    
    if (!zip) {
      setErrors({ zipCode: 'Please enter a ZIP code' });
      return;
    }

    if (!validateZipCode(zip)) {
      setErrors({ zipCode: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)' });
      return;
    }

    if (data.zipCodes.includes(zip)) {
      setErrors({ zipCode: 'This ZIP code is already added' });
      return;
    }

    updateData('zipCodes', [...data.zipCodes, zip]);
    setZipCodeInput('');
    setErrors({});
  };

  const handleRemoveZipCode = (zipToRemove) => {
    updateData('zipCodes', data.zipCodes.filter(zip => zip !== zipToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddZipCode();
    }
  };

  const validateStep = () => {
    const newErrors = {};

    if (data.zipCodes.length === 0) {
      newErrors.zipCodes = 'Please add at least one ZIP code to your service area';
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
        Define your service area
      </h2>
      <p className="text-gray-600 mb-6">
        Add the ZIP codes where you provide services. This helps match you with local customers.
      </p>

      <div className="space-y-6">
        {/* ZIP Code Input */}
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
            Add ZIP Codes <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              id="zipCode"
              type="text"
              value={zipCodeInput}
              onChange={(e) => setZipCodeInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., 10001"
              maxLength={10}
              className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.zipCode ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              onClick={handleAddZipCode}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Add
            </button>
          </div>
          {errors.zipCode && (
            <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Enter ZIP codes one at a time. You can add more later.
          </p>
        </div>

        {/* ZIP Codes List */}
        {data.zipCodes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Service Area ({data.zipCodes.length} ZIP {data.zipCodes.length === 1 ? 'code' : 'codes'})
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.zipCodes.map((zip) => (
                <div
                  key={zip}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg"
                >
                  <span className="font-medium">{zip}</span>
                  <button
                    onClick={() => handleRemoveZipCode(zip)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    aria-label={`Remove ${zip}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Error */}
        {errors.zipCodes && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errors.zipCodes}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Why we need this
              </h4>
              <p className="text-sm text-blue-800">
                Customers will be able to find you when they search for services in these ZIP codes. You can expand or modify your service area anytime from your dashboard settings.
              </p>
            </div>
          </div>
        </div>
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
