// src/components/AIAssistant/AIAssistantModule.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../utils/supabaseClient';
import { sendMessageToAI, getGreeting, Message } from '../../utils/openRouterService';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { Sparkles, ArrowLeft, Trash2 } from 'lucide-react';

interface AIAssistantModuleProps {
  user: User;
}

interface ChatMessageType {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const STORAGE_KEY_PREFIX = 'eduverge_chat_';
const EXPIRY_HOURS = 2;

const AIAssistantModule: React.FC<AIAssistantModuleProps> = ({ user }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationHistory = useRef<Message[]>([]);

  // Load chat history on mount
  useEffect(() => {
    loadHistory();
  }, [user.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadHistory = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY_PREFIX + user.id);
      
      if (stored) {
        const data = JSON.parse(stored);
        
        // Check if expired
        if (Date.now() < data.expiresAt) {
          const storedMessages: StoredMessage[] = data.messages || [];
          
          // Convert to chat messages
          const loadedMessages: ChatMessageType[] = storedMessages.map((msg, index) => ({
            id: `${Date.now()}-${index}`,
            content: msg.content,
            isUser: msg.role === 'user',
            timestamp: new Date(msg.timestamp)
          }));
          
          setMessages(loadedMessages);
          
          // Rebuild conversation history
          conversationHistory.current = storedMessages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          }));
          
          return;
        } else {
          // Expired, clear it
          sessionStorage.removeItem(STORAGE_KEY_PREFIX + user.id);
        }
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
    
    // Show greeting if no history
    showGreeting();
  };




  
  const showGreeting = () => {
    const greeting = getGreeting(user.full_name);
    setMessages([{
      id: Date.now().toString(),
      content: greeting,
      isUser: false,
      timestamp: new Date()
    }]);
  };

  const saveToSession = (newMessages: StoredMessage[]) => {
    try {
      const data = {
        messages: newMessages,
        expiresAt: Date.now() + (EXPIRY_HOURS * 60 * 60 * 1000)
      };
      sessionStorage.setItem(STORAGE_KEY_PREFIX + user.id, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to session:', error);
    }
  };

  const handleSendMessage = async (userMessage: string) => {
    // Add user message to UI
    const userChatMessage: ChatMessageType = {
      id: Date.now().toString(),
      content: userMessage,
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userChatMessage]);

    // Add to conversation history
    conversationHistory.current.push({
      role: 'user',
      content: userMessage
    });

    // Save to session
    const currentMessages: StoredMessage[] = conversationHistory.current.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date().toISOString()
    }));
    saveToSession(currentMessages);

    setIsLoading(true);

    try {
      const aiResponse = await sendMessageToAI(conversationHistory.current, user.full_name);

      // Add AI response to UI
      const aiChatMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiChatMessage]);

      // Update conversation history
      conversationHistory.current.push({
        role: 'assistant',
        content: aiResponse
      });

      // Save to session
      const updatedMessages: StoredMessage[] = conversationHistory.current.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date().toISOString()
      }));
      saveToSession(updatedMessages);

    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear this conversation?')) {
      sessionStorage.removeItem(STORAGE_KEY_PREFIX + user.id);
      conversationHistory.current = [];
      showGreeting();
    }
  };

  const quickActions = [
    'What is java?',
    'How do I improve my soft skills?',
    'Study tips for exams',
    'Summarize a topic'
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Sparkles className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">AI Learning Assistant</h1>
              <p className="text-sm text-purple-100">Your 24/7 study companion</p>
            </div>
          </div>
          
          <button
            onClick={handleClearChat}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg.content}
            isUser={msg.isUser}
            timestamp={msg.timestamp}
          />
        ))}

        {isLoading && <TypingIndicator />}

        {/* Quick Actions */}
        {messages.length === 1 && !isLoading && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">Quick suggestions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(action)}
                  className="text-left text-sm bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};

export default AIAssistantModule;
