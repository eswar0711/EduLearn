// src/components/AIAssistant/ChatInput.tsx
import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about your studies..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          style={{ maxHeight: '120px' }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
    </div>
  );
};

export default ChatInput;
