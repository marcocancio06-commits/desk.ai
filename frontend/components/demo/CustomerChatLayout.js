// Customer-facing chat layout - No internal debug info
// Clean interface that feels like a real customer texting a business

import Link from 'next/link';
import Logo from '../Logo';
import ChatInterface from './ChatInterface';
import { useDemoChat } from './useDemoChat';

export default function CustomerChatLayout() {
  const {
    customerPhone,
    setCustomerPhone,
    messages,
    currentMessage,
    setCurrentMessage,
    isLoading,
    error,
    handleSendMessage
  } = useDemoChat();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Simple Header */}
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Badge */}
        <div className="max-w-3xl mx-auto mb-6">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white uppercase tracking-wide">
                  Demo
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">
                  This is a demonstration of Desk.ai's chat support capabilities
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Try asking about plumbing services, pricing, or scheduling. The AI is trained on Houston Premier Plumbing's business.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Customer-facing header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Message Houston Premier Plumbing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get help with your plumbing needs. We're here to assist you 24/7.
          </p>
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
              disabled={isLoading}
            />
            <p className="mt-2 text-xs text-gray-500">
              We'll use this to follow up on your request.
            </p>
          </div>
        </div>

        {/* Chat Interface - Full Width, No Side Panel */}
        <div className="max-w-3xl mx-auto" style={{ height: '600px' }}>
          <ChatInterface
            messages={messages}
            currentMessage={currentMessage}
            setCurrentMessage={setCurrentMessage}
            handleSendMessage={handleSendMessage}
            isLoading={isLoading}
            error={error}
            customerPhone={customerPhone}
            placeholder="Describe your plumbing issue..."
            chatTitle="Houston Premier Plumbing"
            chatSubtitle="We're here to help!"
          />
        </div>

        {/* Simple footer note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            💬 This is a demo of Desk.ai's AI-powered customer service
          </p>
        </div>
      </div>
    </div>
  );
}
