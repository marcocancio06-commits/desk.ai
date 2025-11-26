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
  chatSubtitle = "Demo business: Elite Auto Detailing",
  quickPrompts = null, // Array of quick prompt objects: [{ text, action }]
  onQuickPrompt = null // Callback when quick prompt is clicked
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold mr-2 sm:mr-3 shadow-sm flex-shrink-0">
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-semibold text-sm sm:text-base truncate">{chatTitle}</h3>
            {chatSubtitle && (
              <p className="text-blue-100 text-xs sm:text-sm truncate">{chatSubtitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm sm:text-base">No messages yet — say hello to get started</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">Our AI assistant is ready to help you</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex items-end gap-1.5 sm:gap-2 ${
            msg.sender === 'customer' ? 'justify-end' : 
            msg.sender === 'system' ? 'justify-center' : 'justify-start'
          }`}>
            {/* AI Avatar */}
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </div>
            )}
            
            {/* Message Bubble */}
            {msg.sender !== 'system' && (
              <div className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                msg.sender === 'customer' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-sm shadow-md' 
                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
              }`}>
                <div className={`text-xs font-medium mb-1 sm:mb-1.5 ${
                  msg.sender === 'customer' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {msg.sender === 'customer' ? 'You' : 'AI Assistant'}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{msg.text}</div>
              </div>
            )}
            
            {/* System Message */}
            {msg.sender === 'system' && (
              <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 max-w-md mx-4">
                {msg.text}
              </div>
            )}
            
            {/* Customer Avatar */}
            {msg.sender === 'customer' && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-end gap-1.5 sm:gap-2 justify-start">
            {/* AI Avatar */}
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
            </div>
            
            {/* Typing Bubble */}
            <div className="bg-white text-gray-900 border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="text-xs font-medium mb-2 text-gray-500">AI Assistant</div>
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm text-gray-600">Desk.ai is typing</span>
                <div className="flex space-x-1 ml-1">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
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

      {/* Quick Prompts */}
      {quickPrompts && quickPrompts.length > 0 && messages.length === 0 && (
        <div className="px-3 sm:px-6 py-2 sm:py-3 bg-white border-t border-gray-200 flex-shrink-0">
          <p className="text-xs font-medium text-gray-500 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => onQuickPrompt && onQuickPrompt(prompt.text)}
                className="inline-flex items-center px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors border border-blue-200 touch-manipulation"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="whitespace-nowrap">{prompt.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form - Mobile optimized with viewport units */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 sm:p-4 bg-white flex-shrink-0">
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !currentMessage.trim() || !customerPhone.trim()}
            className="px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm font-medium touch-manipulation flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span className="sr-only">Send message</span>
          </button>
        </div>
      </form>
    </div>
  );
}
