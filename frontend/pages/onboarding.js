// Onboarding Wizard - Multi-step business setup after signup
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { withOwnerAuth } from '../lib/withOwnerAuth';
import Logo from '../components/Logo';
import Step1BusinessDetails from '../components/onboarding/Step1BusinessDetails';
import Step2ServiceArea from '../components/onboarding/Step2ServiceArea';
import Step3Branding from '../components/onboarding/Step3Branding';
import Step4Confirm from '../components/onboarding/Step4Confirm';

const TOTAL_STEPS = 4;
const STORAGE_KEY = 'desk_ai_onboarding_data';

function OnboardingWizard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Wizard data state
  const [wizardData, setWizardData] = useState({
    // Step 1: Business Details
    businessName: '',
    slug: '',
    industry: '',
    phone: '',
    email: '',
    
    // Step 2: Service Area
    zipCodes: [],
    
    // Step 3: Branding
    logoPath: null,
    colorScheme: 'default', // default, blue, green, purple
    
    // Internal
    completed: false
  });

  // Load saved progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWizardData(parsed.wizardData || wizardData);
        setCurrentStep(parsed.currentStep || 1);
      } catch (e) {
        console.error('Failed to parse saved onboarding data');
      }
    }
  }, []);

  // Save progress to localStorage whenever data changes
  useEffect(() => {
    if (currentStep > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        wizardData,
        currentStep
      }));
    }
  }, [wizardData, currentStep]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const updateWizardData = (field, value) => {
    setWizardData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    setError(null);
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get auth token
      const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession());
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Import BACKEND_URL
      const { BACKEND_URL } = await import('../lib/config');

      // Create business via API
      const response = await fetch(`${BACKEND_URL}/api/business/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          businessName: wizardData.businessName,
          industry: wizardData.industry,
          phone: wizardData.phone,
          email: wizardData.email,
          zipCodes: wizardData.zipCodes,
          logoPath: wizardData.logoPath,
          colorScheme: wizardData.colorScheme
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create business');
      }

      const data = await response.json();
      
      // Clear localStorage
      localStorage.removeItem(STORAGE_KEY);
      
      // Mark as completed
      setWizardData(prev => ({ ...prev, completed: true }));
      
      // Reload auth context to fetch the new business
      if (window.location) {
        window.location.href = '/dashboard';
      }

    } catch (err) {
      console.error('Error creating business:', err);
      setError(err.message || 'Failed to create business. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo variant="header" showText={true} />
            <div className="text-sm text-gray-500">
              Step {currentStep} of {TOTAL_STEPS}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Set Up Your Business</h1>
            <span className="text-sm font-medium text-gray-600">
              {Math.round((currentStep / TOTAL_STEPS) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold
                ${currentStep > step ? 'bg-green-500 text-white' : ''}
                ${currentStep === step ? 'bg-blue-600 text-white' : ''}
                ${currentStep < step ? 'bg-gray-300 text-gray-600' : ''}
              `}>
                {currentStep > step ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : step}
              </div>
              <div className="ml-3 hidden sm:block">
                <div className={`text-sm font-medium ${currentStep >= step ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step === 1 && 'Business Details'}
                  {step === 2 && 'Service Area'}
                  {step === 3 && 'Branding'}
                  {step === 4 && 'Confirm'}
                </div>
              </div>
              {step < 4 && (
                <div className="hidden md:block w-16 lg:w-24 h-0.5 bg-gray-300 mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Wizard Steps */}
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          {currentStep === 1 && (
            <Step1BusinessDetails
              data={wizardData}
              updateData={updateWizardData}
              onNext={handleNext}
            />
          )}
          
          {currentStep === 2 && (
            <Step2ServiceArea
              data={wizardData}
              updateData={updateWizardData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 3 && (
            <Step3Branding
              data={wizardData}
              updateData={updateWizardData}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 4 && (
            <Step4Confirm
              data={wizardData}
              onBack={handleBack}
              onFinish={handleFinish}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:support@desk.ai" className="text-blue-600 hover:text-blue-700 font-medium">
              support@desk.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Only business owners can access onboarding
export default withOwnerAuth(OnboardingWizard);
