// Owner demo view - Shows chat + intelligence panel
// For demoing to business owners how Desk.ai extracts information

import { useState } from 'react';
import Link from 'next/link';
import ChatInterface from './ChatInterface';
import { useDemoChat } from './useDemoChat';
import { BACKEND_URL } from '../../lib/config';
import BugReportModal from './BugReportModal';
import ScheduleAppointmentModal from './ScheduleAppointmentModal';
import Logo from '../Logo';

export default function OwnerChatLayout() {
  const {
    customerPhone,
    setCustomerPhone,
    messages,
    currentMessage,
    setCurrentMessage,
    isLoading,
    error,
    lastResponse,
    handleSendMessage
  } = useDemoChat();

  const [isBugModalOpen, setIsBugModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header with navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo variant="header" showText={true} />
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Back to site
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                View dashboard
              </Link>
              <Link href="/demo-chat/customer" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Customer view
              </Link>
              <button
                onClick={() => setIsBugModalOpen(true)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Report a bug
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Owner-facing header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Desk.ai Demo Chat
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pretend you're a customer texting in about an issue. Desk.ai will qualify the job in real time and show you what it understood.
          </p>
        </div>

        {/* Phone Number Input */}
        <div className="mb-6 max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Customer Phone Number
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
              This simulates a customer reaching out via SMS or web chat.
            </p>
          </div>
        </div>

        {/* Two-column layout: Chat + Intelligence Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chat Interface */}
          <div className="lg:col-span-2" style={{ height: '600px' }}>
            <ChatInterface
              messages={messages}
              currentMessage={currentMessage}
              setCurrentMessage={setCurrentMessage}
              handleSendMessage={handleSendMessage}
              isLoading={isLoading}
              error={error}
              customerPhone={customerPhone}
              placeholder="Type your message..."
              chatTitle="Desk.ai Assistant"
              chatSubtitle="Demo business: Houston Premier Plumbing"
            />
          </div>

          {/* Right: Intelligence Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* What Desk.ai Understood */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">What Desk.ai understood</h2>
              <p className="text-sm text-gray-600 mb-6">
                This panel shows how Desk.ai is interpreting the conversation.
              </p>
              
              {!lastResponse ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">
                    Send a message to see what Desk.ai extracts from the conversation.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Booking Intent */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Booking Intent
                    </h3>
                    <span className={`inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full ${
                      lastResponse.booking_intent === 'ready_to_book' 
                        ? 'bg-green-100 text-green-800' 
                        : lastResponse.booking_intent === 'collecting_info' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {lastResponse.booking_intent === 'ready_to_book' && (
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {lastResponse.booking_intent.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Collected Information */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Collected Information
                    </h3>
                    <div className="space-y-2">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 mb-1">Issue</div>
                        <div className="text-sm text-gray-900 font-medium">
                          {lastResponse.collected_data.issue_summary || 'Not provided'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 mb-1">ZIP Code</div>
                        <div className="text-sm text-gray-900 font-medium">
                          {lastResponse.collected_data.zip_code || 'Not provided'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 mb-1">Preferred Time</div>
                        <div className="text-sm text-gray-900 font-medium">
                          {lastResponse.collected_data.preferred_time || 'Not provided'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 mb-1">Urgency Level</div>
                        <div className={`text-sm font-bold ${
                          lastResponse.collected_data.urgency === 'emergency' 
                            ? 'text-red-600' 
                            : lastResponse.collected_data.urgency === 'high' 
                            ? 'text-orange-600' 
                            : 'text-gray-900'
                        }`}>
                          {lastResponse.collected_data.urgency 
                            ? lastResponse.collected_data.urgency.toUpperCase() 
                            : 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Notes */}
                  {lastResponse.internal_notes && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        AI Notes
                      </h3>
                      <p className="text-sm text-gray-700 italic bg-blue-50 p-3 rounded-lg border border-blue-100">
                        {lastResponse.internal_notes}
                      </p>
                    </div>
                  )}
                  
                  {/* Schedule Job Card - show when ready_to_book */}
                  {lastResponse.booking_intent === 'ready_to_book' && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3 flex-1">
                            <h3 className="text-sm font-semibold text-green-900 mb-1">
                              Ready to schedule this job?
                            </h3>
                            <p className="text-xs text-green-800 mb-3">
                              All required information collected. Click below to add this job to your schedule.
                            </p>
                            <button
                              onClick={() => setIsScheduleModalOpen(true)}
                              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
                            >
                              Schedule this job
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connection Info */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Connection Info
              </h3>
              <div className="space-y-2 text-xs text-blue-800">
                <div className="flex justify-between">
                  <span className="font-medium">Backend:</span>
                  <span className="text-blue-600">{BACKEND_URL}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Business ID:</span>
                  <span>demo-plumbing</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Channel:</span>
                  <span>web_chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
      
      <ScheduleAppointmentModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        defaultData={{
          customerPhone: customerPhone,
          issueSummary: lastResponse?.collected_data?.issue_summary,
          zipCode: lastResponse?.collected_data?.zip_code,
          preferredTimeText: lastResponse?.collected_data?.preferred_time,
          urgency: lastResponse?.collected_data?.urgency
        }}
        onSuccess={(appointment) => {
          console.log('Appointment created:', appointment);
          setIsScheduleModalOpen(false);
        }}
      />
    </div>
  );
}
