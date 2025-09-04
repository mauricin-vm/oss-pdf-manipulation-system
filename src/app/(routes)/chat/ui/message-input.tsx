'use client'

import { useState } from 'react';
import { HiOutlinePlus, HiOutlineEmojiHappy } from 'react-icons/hi';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';
import { Chats, Message } from '@/app/(routes)/chat/types/chat';

interface MessageInputProps {
  selectedChat: { chat: Chats, isOnline: string } | null,
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File) => void;
}

export function MessageInput({ selectedChat, onSendMessage, onFileUpload }: MessageInputProps) {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    setNewMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat) return;
    onFileUpload(file);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 right-4 p-3 bg-white rounded-xl border shadow-lg z-20">
          <div className="grid grid-cols-8 gap-2">
            {['😀', '😂', '😊', '😍', '👍', '👎', '❤️', '🎉', '📄', '✅', '❌', '⚠️', '🔥', '💡', '🤝', '👋'].map(emoji => (
              <button
                key={emoji}
                onClick={() => {
                  setNewMessage(prev => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-xl hover:bg-gray-100 p-1 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-4 mb-4">
        <div className="flex items-center bg-white rounded-full border border-gray-300 px-2 py-1 shadow-lg w-full">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            accept="*/*"
          />

          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
            onClick={() => document.getElementById('file-upload')?.click()}
            title="Anexar arquivo"
          >
            <HiOutlinePlus className="w-5 h-5 text-gray-600" />
          </button>

          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Emojis"
          >
            <HiOutlineEmojiHappy className="w-5 h-5 text-gray-600" />
          </button>

          <textarea
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1 resize-none bg-transparent px-3 py-2 min-h-[36px] max-h-[120px] focus:outline-none placeholder-gray-500 text-gray-900"
            rows={1}
          />

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            title="Enviar mensagem"
          >
            <HiOutlinePaperAirplane className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}