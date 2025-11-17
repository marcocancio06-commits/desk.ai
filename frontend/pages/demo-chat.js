import { useState } from 'react'
import { BACKEND_URL, DEFAULT_BUSINESS_ID } from '../lib/config'

export default function DemoChat() {
  const [customerPhone, setCustomerPhone] = useState('')
  const [messages, setMessages] = useState([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastResponse, setLastResponse] = useState(null)

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

    // Add user message to chat
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
      
      // Store the full response for debugging
      setLastResponse(data)

      // Add assistant reply to chat
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
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            FrontDesk AI Demo Chat
          </h1>
          <p className="text-gray-600">
            Test the customer messaging experience
          </p>
        </div>

        {/* Customer Phone Input */}
        <div className="mb-4 bg-white rounded-lg shadow p-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Customer Phone Number
          </label>
          <input
            id="phone"
            type="text"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="e.g., +1-555-123-4567"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Window */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    No messages yet. Start a conversation below!
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender === 'customer'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                      <div className="text-xs font-semibold mb-1">
                        {msg.sender === 'customer' ? 'You' : 'FrontDesk AI'}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                      <div className="text-xs font-semibold mb-1">FrontDesk AI</div>
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !currentMessage.trim() || !customerPhone.trim()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Structured Data Display */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Debug Info
              </h2>
              
              {!lastResponse ? (
                <p className="text-sm text-gray-500">
                  Send a message to see extracted data
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Booking Intent */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      Booking Intent
                    </h3>
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                      lastResponse.booking_intent === 'ready_to_book'
                        ? 'bg-green-100 text-green-800'
                        : lastResponse.booking_intent === 'collecting_info'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {lastResponse.booking_intent}
                    </span>
                  </div>

                  {/* Collected Data */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Collected Data
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Issue:</span>{' '}
                        <span className="text-gray-900">
                          {lastResponse.collected_data.issue_summary || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">ZIP Code:</span>{' '}
                        <span className="text-gray-900">
                          {lastResponse.collected_data.zip_code || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Time:</span>{' '}
                        <span className="text-gray-900">
                          {lastResponse.collected_data.preferred_time || 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Urgency:</span>{' '}
                        <span className={`font-semibold ${
                          lastResponse.collected_data.urgency === 'emergency'
                            ? 'text-red-600'
                            : lastResponse.collected_data.urgency === 'high'
                            ? 'text-orange-600'
                            : 'text-gray-900'
                        }`}>
                          {lastResponse.collected_data.urgency || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Internal Notes */}
                  {lastResponse.internal_notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">
                        Internal Notes
                      </h3>
                      <p className="text-xs text-gray-600 italic">
                        {lastResponse.internal_notes}
                      </p>
                    </div>
                  )}

                  {/* Raw JSON (collapsible) */}
                  <details className="mt-4">
                    <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                      Raw JSON Response
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                      {JSON.stringify(lastResponse, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>

            {/* Connection Info */}
            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Connection Info
              </h3>
              <div className="text-xs text-blue-800 space-y-1">
                <div><strong>Backend:</strong> {BACKEND_URL}</div>
                <div><strong>Business ID:</strong> demo-plumbing</div>
                <div><strong>Channel:</strong> web_chat</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
