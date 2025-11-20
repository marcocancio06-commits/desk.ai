// Customer-facing chat layout - No internal debug info
// Clean interface that feels like a real customer texting a business

import Link from 'next/link';
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
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              Desk.ai
            </Link>
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Back to site
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
