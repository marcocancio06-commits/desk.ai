// ============================================================================
// DEMO CUSTOMER CHAT - Clean standalone chat page for Loom demos
// ============================================================================
// This is what customers see - a clean, professional chat interface.
// No auth required, no intelligence panel - just a simple chat.
// ============================================================================

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { DEMO_BUSINESS, BACKEND_URL } from '../../config/demoConfig';

// Generate a unique session ID to ensure fresh conversations
const generateSessionPhone = () => {
  // Generate a fake phone number format that fits in 20 chars
  // Format: 555XXXXXXX (10 digits, clearly fake, fits DB constraint)
  const random = Math.floor(Math.random() * 9000000) + 1000000;
  return `555${random}`;
};

export default function DemoCustomerChat() {
  // Generate unique session identifier on mount (prevents conversation bleed-through)
  const [sessionId] = useState(() => generateSessionPhone());
  
  // Phone input state (display only - sessionId is used for backend)
  const [phone, setPhone] = useState('');
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingIntent, setBookingIntent] = useState('none');
  
  // Success state
  const [showThankYou, setShowThankYou] = useState(false);
  
  // Ref for auto-scroll
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Watch for booking ready state
  useEffect(() => {
    if (bookingIntent === 'ready_to_book') {
      // Wait a moment then show thank you
      const timer = setTimeout(() => {
        setShowThankYou(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [bookingIntent]);

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (phone.trim().length >= 10) {
      setPhoneSubmitted(true);
      // Add welcome message
      setMessages([{
        sender: 'assistant',
        text: `Hi! Welcome to ${DEMO_BUSINESS.name}. How can I help you today? Are you looking for a detail, wash, or something else?`,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || isLoading) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setError(null);
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, {
      sender: 'customer',
      text: userMessage,
      timestamp: new Date().toISOString()
    }]);

    try {
      const response = await fetch(`${BACKEND_URL}/api/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: DEMO_BUSINESS.id,
          from: sessionId,  // Use unique session ID to ensure fresh conversation
          displayPhone: phone,  // Store display phone separately
          channel: 'web_chat',
          message: userMessage,
          isDemo: true  // Flag for demo mode
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      
      // Track booking intent
      if (data.booking_intent) {
        setBookingIntent(data.booking_intent);
      }

      // Add AI response
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toISOString()
      }]);

    } catch (err) {
      setError('Failed to send message. Please try again.');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setShowThankYou(false);
    setMessages([]);
    setBookingIntent('none');
    setPhoneSubmitted(false);
    setPhone('');
  };

  // Thank You Screen
  if (showThankYou) {
    return (
      <>
        <Head>
          <title>Thank You | {DEMO_BUSINESS.name}</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Received!</h1>
              <p className="text-gray-600 mb-6">
                Thank you for reaching out to {DEMO_BUSINESS.name}. 
                We've captured your details and will contact you shortly to confirm your appointment.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
                <p className="text-gray-500 mb-2 font-medium">What happens next:</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 font-medium">1.</span>
                    Our team reviews your request
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 font-medium">2.</span>
                    We'll call or text to confirm timing
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 font-medium">3.</span>
                    Show up and we'll take care of the rest!
                  </li>
                </ul>
              </div>
              <button
                onClick={resetChat}
                className="mt-6 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Start a new conversation
              </button>
            </div>
            
            {/* Demo badge */}
            <p className="mt-6 text-xs text-gray-400">
              This is a demo of Desk.ai • <Link href="/demo" className="text-blue-500 hover:underline">Back to demo menu</Link>
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Book Now | {DEMO_BUSINESS.name}</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm flex-shrink-0">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                {DEMO_BUSINESS.name.charAt(0)}
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">{DEMO_BUSINESS.name}</h1>
                <p className="text-xs text-gray-500">Powered by Desk.ai</p>
              </div>
            </div>
            <Link href="/demo" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-6">
          {!phoneSubmitted ? (
            // Phone Input Screen
            <div className="flex-1 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Get a Free Quote</h2>
                  <p className="text-gray-600 text-sm">
                    Chat with our AI assistant to get pricing and schedule your service in minutes.
                  </p>
                </div>
                
                <form onSubmit={handlePhoneSubmit}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                    required
                  />
                  <button
                    type="submit"
                    disabled={phone.trim().length < 10}
                    className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Start Chat
                  </button>
                </form>
                
                <p className="text-xs text-gray-400 text-center mt-4">
                  We'll use this to follow up on your request
                </p>
              </div>
            </div>
          ) : (
            // Chat Interface
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex-shrink-0">
                <h2 className="font-semibold">Chat with {DEMO_BUSINESS.name}</h2>
                <p className="text-blue-100 text-sm">Get a quote in under 2 minutes</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    {msg.sender === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                        </svg>
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                      msg.sender === 'customer'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm shadow-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    {msg.sender === 'customer' && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center ml-2 flex-shrink-0">
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-2">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3z" />
                      </svg>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t bg-white flex-shrink-0">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!currentMessage.trim() || isLoading}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>

        {/* Trust Signals */}
        {phoneSubmitted && (
          <footer className="py-4 flex-shrink-0">
            <div className="flex justify-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Instant Response
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Free Quotes
              </div>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}
