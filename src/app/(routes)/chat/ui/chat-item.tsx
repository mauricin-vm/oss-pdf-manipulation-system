'use client'

//importar bibliotecas e funções
import { Chats } from '@/app/(routes)/chat/types/chat';
import { Message } from '@wppconnect-team/wppconnect';
import { HiOutlineDocument, HiOutlineEmojiHappy, HiOutlineMicrophone, HiOutlinePhotograph, HiOutlineUser, HiOutlineUserGroup, HiOutlineVideoCamera } from 'react-icons/hi';

//função principal
interface ChatItemProps {
  chat: Chats,
  isSelected: boolean,
  profilePic?: string | null,
  presenceStatus?: string,
  onSelect: (chat: Chats) => void
};
const ChatItem: React.FC<ChatItemProps> = ({ chat, isSelected, profilePic, presenceStatus, onSelect }) => {

  //formatar o conteúdo da mensagem
  const formatMessageBody = (message: Message) => {

    //se for imagem
    if (message.type === `image`) return (
      <div className="flex items-center justify-start | gap-1">
        <HiOutlinePhotograph className="w-[0.9rem] h-[0.9rem] mb-[0.13rem]" />
        <span>Foto</span>
      </div>
    );

    //se for video
    if (message.type === `video`) return (
      <div className="flex items-center justify-start | gap-1">
        <HiOutlineVideoCamera className="w-[0.95rem] h-[0.95rem]" />
        <span>Vídeo</span>
      </div>
    );

    //se for audio
    if (message.type === `ptt`) return (
      <div className="flex items-center justify-start | gap-1">
        <HiOutlineMicrophone className="w-[0.9rem] h-[0.9rem] mb-[0.13rem]" />
        <span>Áudio</span>
      </div>
    );

    //se for documento
    if (message.type === `document`) return (
      <div className="flex items-center justify-start | gap-1">
        <HiOutlineDocument className="w-[0.8rem] h-[0.8rem] mb-[0.13rem]" />
        <span>Documento</span>
      </div>
    );

    //se for sticker
    if (message.type === `sticker`) return (
      <div className="flex items-center justify-start | gap-1">
        <HiOutlineEmojiHappy className="w-[0.9rem] h-[0.9rem] mb-[0.13rem]" />
        <span>Sticker</span>
      </div>
    );

    // Remover formatação do WhatsApp para exibição no sidebar
    const removeWhatsAppFormatting = (text: string) => {
      return text
        .replace(/\*(.*?)\*/g, '$1') // Remove asteriscos (negrito)
        .replace(/_(.*?)_/g, '$1')   // Remove underlines (itálico)
        .replace(/~(.*?)~/g, '$1')   // Remove til (riscado)
        .replace(/\n/g, ' ')         // Substitui quebras de linha por espaço
        .trim();
    };

    return (<>{removeWhatsAppFormatting(message.content)}</>);
  };

  const formatMessageTime = (timestamp: number) => {
    // Verificar se o timestamp é válido
    if (!timestamp || isNaN(timestamp)) {
      return '';
    }

    // Verificar se timestamp está em segundos ou milissegundos
    const timestampMs = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
    const messageDate = new Date(timestampMs);

    // Verificar se a data é válida
    if (isNaN(messageDate.getTime())) {
      return '';
    }

    const today = new Date();

    // Resetar as horas para comparar apenas as datas
    const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Calcular ontem
    const yesterday = new Date(todayDay);
    yesterday.setDate(yesterday.getDate() - 1);

    // Se for hoje, mostra apenas a hora
    if (messageDay.getTime() === todayDay.getTime()) {
      return messageDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Se for do mesmo ano, mostra data e hora (sem ano)
    if (messageDate.getFullYear() === today.getFullYear()) {
      return messageDate.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Se for de outro ano, mostra ano, mês, dia e hora
    return messageDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      onClick={() => onSelect(chat)}
      className={`p-4 cursor-pointer hover:bg-gray-100 transition-colors ${isSelected ? 'bg-gray-100 border-r-3 border-gray-500' : ''
        }`}
    >
      <div className="relative flex items-start gap-4">
        <div className="relative">
          {(profilePic && profilePic !== null) ? (
            <img
              className="w-12 h-12 rounded-full object-cover"
              src={profilePic}
              alt={chat.contact.formattedName}
            />
          ) : (
            <div className="flex items-center justify-center | w-[3rem] h-[3rem] | bg-gray-200 border border-gray-300 rounded-full cursor-pointer">
              {chat.isGroup ? (
                <HiOutlineUserGroup className="w-[1.5rem] h-[1.5rem] | text-md" />
              ) : (
                <HiOutlineUser className="w-[1.5rem] h-[1.5rem] | text-md" />
              )}
            </div>
          )}
        </div>


        <div className="flex-1 ml-3">
          <div className="flex items-center justify-between | w-full">
            <h3 className="max-w-[200px] | text-senario-white dark:text-senario-dark font-semibold truncate">
              {chat.contact.formattedName}
            </h3>
            <div className="flex items-center gap-2">
              {chat.lastReceivedKey?.timestamp && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatMessageTime(chat.lastReceivedKey.timestamp)}
                </span>
              )}
              {chat.unreadCount > 0 && (
                <div className="absolute bottom-0 right-0 min-w-[20px] h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center px-1.5 flex-shrink-0 font-semibold">
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </div>
              )}
            </div>
          </div>
          <div className="max-w-[200px] | text-sm text-quinary-white/80 dark:text-senario-dark/50 truncate">
            {presenceStatus && presenceStatus !== 'Online' ? (
              <p className="font-bold text-green-600 italic">{presenceStatus}</p>
            ) : (
              chat.lastReceivedKey ? formatMessageBody(chat.lastReceivedKey) : ``
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export { ChatItem };