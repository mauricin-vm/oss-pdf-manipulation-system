'use client'

import { Chats } from '@/app/(routes)/chat/types/chat';

interface ChatHeaderProps {
  selectedChat: { chat: Chats, isOnline: string } | null,
  profilePic?: string | null;
}

export function ChatHeader({ selectedChat, profilePic }: ChatHeaderProps) {
  if (!selectedChat) return null;

  return (
    <div className="p-4 bg-gray-100 border-b flex items-center gap-3 h-[77px]">
      <div className="relative">
        {profilePic ? (
          <img
            src={profilePic}
            alt={selectedChat.chat.contact.formattedName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-gray-400">
            {selectedChat.chat.contact.formattedName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1">
        <h2 className="font-semibold text-gray-900">{selectedChat.chat.contact.formattedName}</h2>
        <p className="text-sm text-gray-600 h-5 flex items-center">
          {selectedChat.isOnline ? (
            <span className={`${selectedChat.isOnline === 'Digitando...' || selectedChat.isOnline === 'Gravando...' ? 'text-green-600 font-medium' : ''}`}>
              {selectedChat.isOnline}
            </span>
          ) : (
            <span>&nbsp;</span>
          )}
        </p>
      </div>
    </div>
  );
}