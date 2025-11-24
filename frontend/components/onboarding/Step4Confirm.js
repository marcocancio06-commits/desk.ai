// Step 4: Confirm and Create Business
export default function Step4Confirm({ data, onBack, onFinish, isSubmitting }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Review and confirm
      </h2>
      <p className="text-gray-600 mb-6">
        Please review your business information before completing setup.
      </p>

      <div className="space-y-6">
        {/* Business Details Summary */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
            <button
              onClick={() => onBack()}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Business Name</div>
              <div className="font-medium text-gray-900">{data.businessName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Industry</div>
              <div className="font-medium text-gray-900 capitalize">
                {data.industry === 'handyman' ? 'General Handyman' : data.industry}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium text-gray-900">{data.phone}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium text-gray-900">{data.email}</div>
            </div>
          </div>
          
          {/* Business URL Preview */}
          {data.slug && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-gray-700 mb-1">
                <strong>Your business URL:</strong>
              </div>
              <div className="text-sm font-mono text-blue-700">
                desk.ai/b/<span className="font-bold">{data.slug}</span>
              </div>
            </div>
          )}
        </div>

        {/* Service Area Summary */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Service Area</h3>
            <button
              onClick={() => onBack()}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit
            </button>
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-2">
              ZIP Codes ({data.zipCodes.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {data.zipCodes.map((zip) => (
                <span
                  key={zip}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                >
                  {zip}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Branding Summary */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Branding</h3>
            <button
              onClick={() => onBack()}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Logo</div>
              <div className="font-medium text-gray-900">
                {data.logoPath ? (
                  <span className="inline-flex items-center text-green-700">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Uploaded
                  </span>
                ) : (
                  'Not uploaded'
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Color Scheme</div>
              <div className="font-medium text-gray-900 capitalize">
                {data.colorScheme === 'default' ? 'Desk.ai Default' : data.colorScheme}
              </div>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            What happens next?
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Your business profile will be created
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              You'll get a unique business page URL (e.g., desk.ai/b/your-business)
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              AI chat will be enabled to start capturing leads
            </li>
            <li className="flex items-start">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              You'll be redirected to your dashboard to start managing leads
            </li>
          </ul>
        </div>

        {/* Terms */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            By completing setup, you agree to Desk.ai's{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
              Privacy Policy
            </a>.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          onClick={onFinish}
          disabled={isSubmitting}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Business...
            </>
          ) : (
            <>
              Finish Setup
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
