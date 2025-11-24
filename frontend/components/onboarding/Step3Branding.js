// Step 3: Demo Branding Setup
import { useState } from 'react';

const COLOR_SCHEMES = [
  {
    value: 'default',
    label: 'Desk.ai Default',
    primary: '#2563eb',
    secondary: '#3b82f6',
    description: 'Clean blue theme (recommended)'
  },
  {
    value: 'professional',
    label: 'Professional Blue',
    primary: '#1e40af',
    secondary: '#3b82f6',
    description: 'Dark blue, trustworthy'
  },
  {
    value: 'eco',
    label: 'Eco Green',
    primary: '#059669',
    secondary: '#10b981',
    description: 'Fresh green, eco-friendly'
  },
  {
    value: 'energy',
    label: 'Energy Orange',
    primary: '#ea580c',
    secondary: '#f97316',
    description: 'Bold orange, energetic'
  },
  {
    value: 'premium',
    label: 'Premium Purple',
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    description: 'Royal purple, premium feel'
  }
];

export default function Step3Branding({ data, updateData, onNext, onBack }) {
  const [logoPreview, setLogoPreview] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo must be less than 2MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        // In production, this would upload to storage and return a path
        // For now, we'll just store the file name
        updateData('logoPath', `/uploads/logos/${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    updateData('logoPath', null);
  };

  const selectedScheme = COLOR_SCHEMES.find(s => s.value === data.colorScheme) || COLOR_SCHEMES[0];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Demo Branding Setup
      </h2>
      <p className="text-gray-600 mb-6">
        Customize your business profile with a logo and color scheme. This is for demo purposes only - full white-label branding available in premium plans.
      </p>

      <div className="space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Logo <span className="text-gray-500">(Optional)</span>
          </label>
          
          {!logoPreview ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, SVG up to 2MB
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-16 h-16 object-contain bg-gray-50 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Logo uploaded</p>
                    <p className="text-xs text-gray-500">Preview shown</p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveLogo}
                  className="text-red-600 hover:text-red-700 transition-colors text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">
            💡 Your logo will appear in your customer chat widget and business profile
          </p>
        </div>

        {/* Color Scheme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Color Scheme
          </label>
          <div className="grid grid-cols-1 gap-3">
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => updateData('colorScheme', scheme.value)}
                className={`
                  p-4 border-2 rounded-lg text-left transition-all
                  ${data.colorScheme === scheme.value 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: scheme.primary }}
                      />
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: scheme.secondary }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{scheme.label}</div>
                      <div className="text-sm text-gray-500">{scheme.description}</div>
                    </div>
                  </div>
                  {data.colorScheme === scheme.value && (
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            ⚠️ Demo only: Colors will apply to your business profile, but Desk.ai branding remains
          </p>
        </div>

        {/* Preview Box */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3 mb-3">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900">Your Business Name</div>
                <div className="text-xs text-gray-500">Powered by Desk.ai</div>
              </div>
            </div>
            <button
              style={{ backgroundColor: selectedScheme.primary }}
              className="w-full py-2 text-white rounded font-medium"
            >
              Sample Button
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                Demo Branding Limitations
              </h4>
              <p className="text-sm text-yellow-800">
                This setup is for demonstration purposes. Desk.ai branding will remain visible. Upgrade to premium plans for full white-label customization.
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
          onClick={onNext}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
