import { useState } from 'react'
import Link from 'next/link'
import { BACKEND_URL, DEFAULT_BUSINESS_ID } from '../lib/config'
import BugReportModal from '../components/demo/BugReportModal'

export default function DemoChat() {
  const [customerPhone, setCustomerPhone] = useState('')
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastResponse, setLastResponse] = useState(null)
  const [isBugModalOpen, setIsBugModalOpen] = useState(false)

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!currentMessage.trim()) return
    if (!customerPhone.trim()) {
      setError('Please enter a customer phone number')
      return
    }

    const userMessage = currentMessage.trim()
    setCurrentMessage('')
    setError(null)
    setIsLoading(true)

    const newUserMessage = {
      sender: 'customer',
      text: userMessage,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      const response = await fetch(`${BACKEND_URL}/api/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: DEFAULT_BUSINESS_ID,
          from: customerPhone,
          channel: 'web_chat',
          message: userMessage
        })
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      setLastResponse(data)

      const assistantMessage = {
        sender: 'assistant',
        text: data.reply,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      console.error('Error sending message:', err)
      setError(err.message || 'Failed to send message. Make sure the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              Desk.ai
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Back to site
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                View dashboard
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
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Desk.ai Demo Chat
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pretend you're a customer texting in about an issue. Desk.ai will qualify the job in real time.
          </p>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
                    AI
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Desk.ai Assistant</h3>
                    <p className="text-blue-100 text-sm">Demo business: Houston Premier Plumbing</p>
                  </div>
                </div>
              </div>

              <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No messages yet — say hello to get started</p>
                    <p className="text-sm text-gray-400 mt-2">Try: "My water heater is leaking"</p>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-sm ${msg.sender === 'customer' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'}`}>
                      <div className={`text-xs font-semibold mb-1 ${msg.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {msg.sender === 'customer' ? 'You' : 'Desk.ai'}
                      </div>
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-900 border border-gray-200 max-w-xs lg:max-w-md px-5 py-3 rounded-2xl rounded-bl-none shadow-sm">
                      <div className="text-xs font-semibold mb-2 text-gray-500">Desk.ai</div>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="px-6 py-3 bg-red-50 border-t border-red-200">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !currentMessage.trim() || !customerPhone.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm font-medium"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">What Desk.ai understood</h2>
              <p className="text-sm text-gray-600 mb-6">This panel shows how Desk.ai is interpreting the conversation.</p>
              
              {!lastResponse ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Send a message to see extracted data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Booking Intent</h3>
                    <span className={`inline-flex items-center px-3 py-1.5 text-sm font-semibold rounded-full ${lastResponse.booking_intent === 'ready_to_book' ? 'bg-green-100 text-green-800' : lastResponse.booking_intent === 'collecting_info' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {lastResponse.booking_intent === 'ready_to_book' && (
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                      {lastResponse.booking_intent.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Collected Information</h3>
                    <div className="space-y-2">
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 mb-1">Issue</div>
                        <div className="text-sm text-gray-900 font-medium">{lastResponse.collected_data.issue_summary || 'Not provided'}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 mb-1">ZIP Code</div>
                        <div className="text-sm text-gray-900 font-medium">{lastResponse.collected_data.zip_code || 'Not provided'}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 mb-1">Preferred Time</div>
                        <div className="text-sm text-gray-900 font-medium">{lastResponse.collected_data.preferred_time || 'Not provided'}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="text-xs font-medium text-gray-500 mb-1">Urgency Level</div>
                        <div className={`text-sm font-bold ${lastResponse.collected_data.urgency === 'emergency' ? 'text-red-600' : lastResponse.collected_data.urgency === 'high' ? 'text-orange-600' : 'text-gray-900'}`}>
                          {lastResponse.collected_data.urgency ? lastResponse.collected_data.urgency.toUpperCase() : 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>
                  {lastResponse.internal_notes && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI Notes</h3>
                      <p className="text-sm text-gray-700 italic bg-blue-50 p-3 rounded-lg border border-blue-100">{lastResponse.internal_notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
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

      <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
    </div>
  )
}
