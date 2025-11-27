// Custom hook for shared demo chat logic
// Handles state, messages, and API calls for both customer and owner views

import { useState } from 'react';
import { BACKEND_URL, DEMO_BUSINESS } from '../../config/demoConfig';

export function useDemoChat() {
  const [customerPhone, setCustomerPhone] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!currentMessage.trim()) return;
    if (!customerPhone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    setError(null);
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage = {
      sender: 'customer',
      text: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${BACKEND_URL}/api/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: DEMO_BUSINESS.id,
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
      setLastResponse(data);

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
      
      let errorMessage = 'Failed to send message. Make sure the backend is running.';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Request timed out. The AI is taking longer than usual to respond. Please try again or simplify your question.';
      } else if (err.message.includes('fetch')) {
        errorMessage = 'Unable to connect to the server. Please check if the backend is running on port 3001.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage = {
        sender: 'system',
        text: `⚠️ ${errorMessage}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    customerPhone,
    setCustomerPhone,
    messages,
    currentMessage,
    setCurrentMessage,
    isLoading,
    error,
    lastResponse,
    
    // Actions
    handleSendMessage
  };
}
