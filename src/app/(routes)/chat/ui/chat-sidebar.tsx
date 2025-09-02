'use client'

//importar bibliotecas e funções
import { Chats, widToString } from '@/app/(routes)/chat/types/chat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import { Session } from 'next-auth';
import { ChatItem } from '@/app/(routes)/chat/ui/chat-item';
import { UserProfile } from '@/app/(routes)/chat/ui/user-profile';

//função principal
interface ChatSidebarProps {
  chats: Chats[],
  selectedChat: { chat: Chats, isOnline: string } | null,
  searchTerm: string,
  activeFilter: string,
  isLoadingMoreChats: boolean,
  profilePics: Record<string, string | null>,
  chatPresenceStates: Record<string, string>,
  session: Session | null,
  onSearchChange: (term: string) => void,
  onFilterChange: (filter: string) => void,
  onChatSelect: (chat: Chats) => void,
  onScroll: () => void
};
const ChatSidebar: React.FC<ChatSidebarProps> = ({ chats, selectedChat, searchTerm, activeFilter, isLoadingMoreChats, profilePics, chatPresenceStates, session, onSearchChange, onFilterChange, onChatSelect, onScroll }) => {

  //definir as referências
  const chatListRef = useRef<HTMLDivElement>(null);

  //filtrar as conversas
  // const filteredChats = chats.filter(chat => {
  //   const matchesSearch = chat.name.toLowerCase().includes(searchTerm.toLowerCase()) || (chat.id.user && chat.id.user.includes(searchTerm));

  //   switch (activeFilter) {
  //     case `unread`:
  //       return matchesSearch && chat.unreadCount > 0;
  //     case `online`:
  //       return matchesSearch && (chat || false);
  //     default:
  //       return matchesSearch;
  //   };
  // });

  //retorno da função principal
  return (
    <div className="w-96 bg-gray-50 border-r flex flex-col">

      {/* barra de pesquisa e filtros */}
      <div className="p-4 bg-gray-50">

        {/* campo de pesquisa */}
        <Input
          placeholder="Buscar conversas..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="text-sm mb-3"
        />

        {/* botões de filtro */}
        <div className="flex gap-1">
          {[
            { key: `all`, label: `Todos` },
            { key: `ccf`, label: `CCF` },
            { key: `jurfis`, label: `JURFIS` },
            { key: `unread`, label: `Não lidos` }
          ].map(filter => (
            <Button
              key={filter.key}
              size="sm"
              variant={activeFilter === filter.key ? "default" : "outline"}
              onClick={() => onFilterChange(filter.key)}
              className="text-xs px-2 py-1 h-7 cursor-pointer"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {/* lista de conversas */}
      <div
        ref={chatListRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800"
        onScroll={onScroll}
      >
        {chats.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            </div>
          </div>
        ) : null}

        {chats.map(chat => {
          const chatId = chat.id._serialized;
          const presenceStatus = chatPresenceStates[chatId] || '';

          return (
            <ChatItem
              key={widToString(chat.id)}
              chat={chat}
              isSelected={selectedChat?.chat.id._serialized === chatId}
              profilePic={profilePics[chatId]}
              presenceStatus={presenceStatus}
              onSelect={onChatSelect}
            />
          );
        })}

        {isLoadingMoreChats && (
          <div className="flex items-center justify-center w-full py-4">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* perfil do usuário */}
      <UserProfile session={session} />
    </div>
  );
};
export { ChatSidebar };