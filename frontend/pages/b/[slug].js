// Public business page - /b/[slug]
// Polished public-facing page for real customers

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Logo from '../../components/Logo';
import ChatInterface from '../../components/demo/ChatInterface';
import Footer from '../../components/marketing/Footer';
import { BACKEND_URL } from '../../lib/config';
import { getIndustryServices, getIndustryDescription, formatIndustryName } from '../../lib/industryServices';

export default function PublicBusinessPage() {
  const router = useRouter();
  const { slug } = router.query;
  
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showChat, setShowChat] = useState(false);
  
  // Chat state
  const [customerPhone, setCustomerPhone] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Fetch business info when slug changes
  useEffect(() => {
    if (!slug) return;
    
    const fetchBusiness = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${BACKEND_URL}/api/business/${slug}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Business not found');
          }
          throw new Error('Failed to load business');
        }
        
        const data = await response.json();
        
        if (data.ok && data.business) {
          setBusiness(data.business);
        } else {
          throw new Error(data.error || 'Business not found');
        }
      } catch (err) {
        console.error('Error fetching business:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusiness();
  }, [slug]);

  // Handle sending messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!currentMessage.trim()) return;
    if (!customerPhone.trim()) {
      setChatError('Please enter a phone number');
      return;
    }
    if (!business) {
      setChatError('Business not loaded');
      return;
    }

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setChatError(null);
    setIsSending(true);

    // Add user message to chat
    const newUserMessage = {
      sender: 'customer',
      text: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${BACKEND_URL}/api/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: business.id, // Use the actual business UUID
          from: customerPhone,
          channel: 'web_chat',
          message: userMessage
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // Add assistant response to chat
      const assistantMessage = {
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Error sending message:', err);
      
      let errorMessage = 'Failed to send message. Please try again.';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. The AI is taking longer than usual to respond. Please try again.';
      } else if (err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please try again later.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setChatError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage = {
        sender: 'system',
        text: `⚠️ ${errorMessage}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsSending(false);
    }
  };

  // Handle quick prompt selection
  const handleQuickPrompt = (promptText) => {
    setCurrentMessage(promptText);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading business...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Logo variant="header" showText={true} />
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Back to site
              </Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Business Not Found</h1>
          <p className="text-lg text-gray-600 mb-6">
            {error || 'The business you\'re looking for doesn\'t exist or is no longer active.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/directory" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Browse Businesses
            </Link>
            <Link href="/" className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success - show business page
  const services = getIndustryServices(business.industry);
  const industryDesc = getIndustryDescription(business.industry);
  const industryName = formatIndustryName(business.industry);
  
  // SEO metadata
  const pageTitle = `${business.name} | Desk.ai`;
  const pageDescription = `Connect with ${business.name} for ${industryDesc}. AI-powered scheduling and rapid response.`;
  const ogImage = business.logo_url || 'https://desk.ai/og-default.png';
  
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* OpenGraph tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={`https://desk.ai/b/${business.slug}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://desk.ai/b/${business.slug}`} />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header with gradient accent */}
        <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
          {/* Gradient decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-5"></div>
          
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-center justify-between h-16">
              <Logo variant="header" showText={true} />
              <Link href="/directory" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Browse businesses
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Professional Business Header */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-8 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              {/* Logo / Avatar */}
              <div className="flex-shrink-0 mx-auto sm:mx-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg">
                  {business.logo_url ? (
                    <img src={business.logo_url} alt={business.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {business.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Business Info */}
              <div className="flex-1 text-center sm:text-left">
                {/* Business Name - Large and Bold */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                  {business.name}
                </h1>
                
                {/* Tagline - Italic */}
                {business.tagline && (
                  <p className="text-base sm:text-xl text-gray-600 italic mb-3 sm:mb-4">
                    {business.tagline}
                  </p>
                )}
                
                {/* Industry Badge + Powered by Desk.ai */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                  {industryName && (
                    <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs sm:text-sm font-semibold">
                      {industryName}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-xs sm:text-sm font-medium border border-purple-200">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    <span className="whitespace-nowrap">Powered by Desk.ai</span>
                  </span>
                </div>
                
                {/* Short Description */}
                {business.short_description && (
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 mb-4 sm:mb-5 leading-relaxed">
                    {business.short_description}
                  </p>
                )}
                
                {/* Trust Elements */}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {/* Service ZIPs */}
                  {business.zip_codes && business.zip_codes.length > 0 && (
                    <div className="flex items-start justify-center sm:justify-start text-gray-600 text-sm sm:text-base">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="break-words">
                        <strong className="text-gray-900">Serving:</strong> {business.zip_codes.join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Response Time */}
                  <div className="flex items-start justify-center sm:justify-start text-gray-600 text-sm sm:text-base">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Typically responds <strong className="text-gray-900">within minutes</strong>
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {business.phone && (
                    <a
                      href={`tel:${business.phone}`}
                      className="inline-flex items-center justify-center px-5 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-semibold touch-manipulation text-sm sm:text-base"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call Now
                    </a>
                  )}
                  
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="inline-flex items-center justify-center px-5 sm:px-6 py-3 sm:py-3.5 bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all font-semibold touch-manipulation text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {showChat ? 'Hide Chat' : 'Start Chat'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chat Panel (Conditional) */}
          {showChat && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6 mb-8">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Chat with {business.name}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Ask about pricing, availability, or your specific job. We're here to help!
                </p>
              </div>
              
              {/* Phone Number Input */}
              {!customerPhone && (
                <div className="mb-4 sm:mb-6">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g., +1-555-123-4567"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    We'll use this to follow up on your request
                  </p>
                </div>
              )}
              
              {/* Chat Interface - Mobile optimized height */}
              <div className="h-[60vh] sm:h-[500px] min-h-[400px] max-h-[600px]">
                <ChatInterface
                  messages={messages}
                  currentMessage={currentMessage}
                  setCurrentMessage={setCurrentMessage}
                  handleSendMessage={handleSendMessage}
                  isLoading={isSending}
                  error={chatError}
                  customerPhone={customerPhone}
                  placeholder={`Ask about ${industryName || 'your needs'}...`}
                  chatTitle="AI Assistant"
                  chatSubtitle={null}
                  quickPrompts={[
                    { text: 'Describe my issue' },
                    { text: 'Ask for availability' },
                    { text: 'Request a quote' }
                  ]}
                  onQuickPrompt={handleQuickPrompt}
                />
              </div>
            </div>
          )}
          
          {/* About Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
            {/* Business Description */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">About Us</h2>
              </div>
              
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600">
                <p>
                  This business uses <span className="font-semibold text-blue-600">Desk.ai</span> for rapid response scheduling and customer service.
                </p>
                <p>
                  Our AI-powered intake system is always available to help you get the service you need, when you need it.
                </p>
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs sm:text-sm text-blue-900">
                      <strong>24/7 Availability:</strong> Our AI assistant can help schedule services any time, day or night.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Services */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Our Services</h2>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {services.map((service, index) => (
                  <div key={index} className="flex items-start p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation">
                    <span className="text-xl sm:text-2xl mr-2 sm:mr-3 flex-shrink-0">{service.icon}</span>
                    <div>
                      <div className="font-semibold text-sm sm:text-base text-gray-900">{service.name}</div>
                      <div className="text-xs sm:text-sm text-gray-600">{service.description}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <p className="text-xs sm:text-sm text-gray-500 italic">
                  Chat with us or call to discuss your specific needs and get a free estimate.
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Ready to Get Started?</h2>
            <p className="text-base sm:text-lg text-blue-100 mb-4 sm:mb-6">
              Contact us now for fast, professional {industryName} service
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl font-bold text-base sm:text-lg touch-manipulation"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="truncate">Call {business.phone}</span>
                </a>
              )}
              <button
                onClick={() => {
                  setShowChat(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-all shadow-lg hover:shadow-xl font-bold text-base sm:text-lg border-2 border-purple-500 touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Start a Chat
              </button>
            </div>
          </div>
          
          {/* Powered by Desk.ai */}
          <div className="mt-6 sm:mt-8 text-center px-4">
            <p className="text-xs sm:text-sm text-gray-500">
              💬 Powered by <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">Desk.ai</Link> — AI-powered customer service for local businesses
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
