// Shared chat interface component used by both customer and owner views
// Displays messages, handles input, and manages chat UI

export default function ChatInterface({ 
  messages, 
  currentMessage, 
  setCurrentMessage, 
  handleSendMessage, 
  isLoading, 
  error,
  customerPhone,
  placeholder = "Type your message...",
  chatTitle = "Desk.ai Assistant",
  chatSubtitle = "Demo business: Houston Premier Plumbing"
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold mr-3">
            AI
          </div>
          <div>
            <h3 className="text-white font-semibold">{chatTitle}</h3>
            {chatSubtitle && (
              <p className="text-blue-100 text-sm">{chatSubtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
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
            <div className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-sm ${
              msg.sender === 'customer' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
            }`}>
              <div className={`text-xs font-semibold mb-1 ${
                msg.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'
              }`}>
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

      {/* Error Display */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200 flex-shrink-0">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
        <div className="flex space-x-3">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder={placeholder}
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
  );
}
