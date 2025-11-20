// Custom hook for shared demo chat logic
// Handles state, messages, and API calls for both customer and owner views

import { useState } from 'react';
import { BACKEND_URL, DEFAULT_BUSINESS_ID } from '../../lib/config';

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
      });

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
      console.error('Error sending message:', err);
      setError(err.message || 'Failed to send message. Make sure the backend is running.');
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
