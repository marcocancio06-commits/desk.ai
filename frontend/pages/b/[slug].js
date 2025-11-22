// Public business page - /b/[slug]
// Customers can chat with a specific business without authentication

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Logo from '../../components/Logo';
import ChatInterface from '../../components/demo/ChatInterface';
import { BACKEND_URL } from '../../lib/config';

export default function PublicBusinessPage() {
  const router = useRouter();
  const { slug } = router.query;
  
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  // Success - show business chat
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo variant="header" showText={true} />
            <Link href="/directory" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Browse businesses
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Message {business.name}
          </h1>
          <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600">
            {business.industry && (
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {business.industry.charAt(0).toUpperCase() + business.industry.slice(1)}
              </span>
            )}
            {business.phone && (
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {business.phone}
              </span>
            )}
            {business.serviceZipCodes && business.serviceZipCodes.length > 0 && (
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Serving {business.serviceZipCodes.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Phone Number Input */}
        <div className="mb-6 max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Your Phone Number
            </label>
            <input
              id="phone"
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g., +1-555-123-4567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSending}
            />
            <p className="mt-2 text-xs text-gray-500">
              We'll use this to follow up on your request.
            </p>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="max-w-3xl mx-auto" style={{ height: '600px' }}>
          <ChatInterface
            messages={messages}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            handleSendMessage={handleSendMessage}
            isLoading={isSending}
            error={chatError}
            customerPhone={customerPhone}
            placeholder={`Describe your ${business.industry || 'service'} needs...`}
            chatTitle={business.name}
            chatSubtitle={business.industry ? `${business.industry.charAt(0).toUpperCase() + business.industry.slice(1)} Services` : 'We\'re here to help!'}
          />
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            💬 Powered by <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">Desk.ai</Link> - AI-powered customer service for local businesses
          </p>
        </div>
      </div>
    </div>
  );
}
