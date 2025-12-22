// src/components/AIAssistant/ChatMessage.tsx
import React from 'react';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp?: Date;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isUser, timestamp }) => {
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={`max-w-[70%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-gray-100 text-gray-800 rounded-tl-none'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        {timestamp && (
          <p className="text-xs text-gray-500 mt-1 px-2">
            {timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
