'use client'

//importar bibliotecas e funções
import { useRouter } from 'next/navigation';
import { ChatHeader } from '@/app/(routes)/chat/ui/chat-header';
import { MediaModal } from '@/app/(routes)/chat/ui/media-modal';
import { useSession } from 'next-auth/react';
import { ChatSidebar } from '@/app/(routes)/chat/ui/chat-sidebar';
import { MessageList } from '@/app/(routes)/chat/ui/message-list';
import { MessageInput } from '@/app/(routes)/chat/ui/message-input';
import { QRCodeDisplay } from '@/app/(routes)/chat/ui/qr-code-display';
import { ConnectionStatus } from '@/app/(routes)/chat/ui/connection-status';
import { useConnectionEvents } from '@/app/(routes)/chat/hooks/useConnectionEvents';
import { useWebSocket } from '@/app/(routes)/chat/hooks/useSocket';
import { Chats, Message, widToString } from '@/app/(routes)/chat/types/chat';
import { useState, useEffect, useCallback, useRef } from 'react';

//função principal
interface ConnectionState {
  isConnected: boolean,
  status: `checking` | `connected` | `disconnected` | `error` | `qr_required`,
  session?: string
};
export default function ChatPage() {

  //definir as constantes
  const router = useRouter();
  const { data: session, status } = useSession();
  const { connectionState: realtimeConnection } = useConnectionEvents();

  const [chats, setChats] = useState<Chats[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState(``);
  const [searchTerm, setSearchTerm] = useState(``);
  const [currentPage, setCurrentPage] = useState(1);
  const [profilePics, setProfilePics] = useState<Record<string, string | null>>({});
  const [activeFilter, setActiveFilter] = useState(`all`);
  const [hasMoreChats, setHasMoreChats] = useState(true);
  const [selectedChat, setSelectedChat] = useState<{ chat: Chats, isOnline: string } | null>(null);
  const [isChangingPresence, setIsChangingPresence] = useState<{ chatId: string, isChanging: string } | null>(null);
  const [chatPresenceStates, setChatPresenceStates] = useState<Record<string, string>>({});

  const [connectionState, setConnectionState] = useState<ConnectionState>({ isConnected: false, status: `checking` });
  const { isConnectedToWS, presenceState, newMessages, messageAcks, getPresence } = useWebSocket({
    isConnected: connectionState.isConnected,
    schema: 'jurfis' // Nome da sessão conforme .env WHATSAPP_SESSION_NAME
  });
  const [isLoadingMoreChats, setIsLoadingMoreChats] = useState(false);
  const [forceScrollToBottom, setForceScrollToBottom] = useState(false);

  // Mapa para rastrear IDs temporários vs reais e ACKs pendentes
  const [messageIdMap, setMessageIdMap] = useState<Record<string, string>>({});
  const [pendingAcks, setPendingAcks] = useState<any[]>([]);

  //funções para gerenciamento de autenticação/conexão
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (status === `loading`) return;
    if (!session) return router.push(`/auth/signin`);

    // Só verificar status na primeira vez, não a cada mudança de session
    if (!hasInitialized.current) {
      checkInstanceStatus();
      hasInitialized.current = true;
    }
  }, [session, status, router]);
  useEffect(() => {
    if (!realtimeConnection.lastState) return;


    if (realtimeConnection.lastState === `DISCONNECTED` || realtimeConnection.lastState === `UNPAIRED` || !realtimeConnection.isConnected) {
      setConnectionState({ isConnected: false, status: `qr_required` });
      setChats([]);
      setMessages([]);
      setSelectedChat(null);
    } else if (realtimeConnection.lastState === `CONNECTED` && realtimeConnection.isConnected) {
      setConnectionState({ isConnected: true, status: `connected` });
    };
  }, [realtimeConnection.lastState, realtimeConnection.isConnected]);
  const checkInstanceStatus = async () => {
    try {
      setConnectionState({ isConnected: false, status: `checking` });
      const response = await fetch(`/api/chat/status`);
      const data = await response.json();
      if (data.success && data.connected) {
        setConnectionState({ isConnected: true, status: `connected`, session: data.session });
        loadChats();
      } else {
        setConnectionState({ isConnected: false, status: `qr_required` });
        generateQRCode();
      };
    } catch (error) {
      console.error(`Erro ao verificar status da instância jurfis:`, error);
      setConnectionState({ isConnected: false, status: `error` });
    };
  };

  //funções para gerenciamento do qrCode
  const generateQRCode = async () => {
    try {
      const response = await fetch(`/api/chat/qr-code`);
      const data = await response.json();
      if (data.success && data.qrCode) setQrCode(data.qrCode);
    } catch (error) {
      console.error(`Erro ao gerar QR Code:`, error);
    };
  };
  const handleCheckConnection = async () => {
    try {
      const response = await fetch(`/api/chat/qr-code`, { method: `POST` });
      const data = await response.json();
      if (data.success && data.connected) {
        setConnectionState({ isConnected: true, status: `connected` });
        setQrCode(null);
        loadChats();
      };
    } catch (error) {
      console.error(`Erro ao verificar status da conexão:`, error);
    };
  };
  useEffect(() => {
    if (connectionState.status === `qr_required` && qrCode) {
      const interval = setInterval(handleCheckConnection, 3000);
      return () => clearInterval(interval);
    };
  }, [connectionState.status, qrCode]);
  useEffect(() => {
    if (connectionState.status === `qr_required` && realtimeConnection.isConnected && realtimeConnection.lastState === `CONNECTED`) {
      setConnectionState({ isConnected: true, status: `connected` });
      setQrCode(null);
    };
  }, [connectionState.status, realtimeConnection.isConnected, realtimeConnection.lastState]);

  // WebSocket presence listener
  const presenceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    if (!isConnectedToWS || !getPresence) return;

    const cleanup = getPresence(async (err: any, message: any) => {

      // Se der erro
      if (err) return;

      const chatId = message.id;
      let presenceText = '';
      let shouldSetTimeout = false;

      // Se estiver digitando
      if (message.state === `typing`) {
        presenceText = 'Digitando...';
        shouldSetTimeout = true;
        setIsChangingPresence({ chatId: message.id, isChanging: 'Digitando...' });
      }
      // Se estiver gravando áudio
      else if (message.state === `recording_audio`) {
        presenceText = 'Gravando...';
        shouldSetTimeout = true;
        setIsChangingPresence({ chatId: message.id, isChanging: 'Gravando...' });
      }
      // Caso contrário, limpar
      else {
        presenceText = '';
        setIsChangingPresence(null);
      }

      // Se não há presenceText específica (digitando/gravando), verificar se está online
      if (!presenceText && message.isOnline !== undefined) {
        presenceText = message.isOnline ? 'Online' : '';
      }

      // Atualizar estado global de presença para todos os chats
      setChatPresenceStates(prev => ({
        ...prev,
        [chatId]: presenceText
      }));

      // Atualizar chat selecionado se for o mesmo
      setSelectedChat(prev => {
        if (!prev || widToString(prev.chat.id) !== message.id) return prev;
        const updatedChat = { ...prev, isOnline: presenceText };
        return updatedChat;
      });

      // Limpar timeout anterior se existir
      if (presenceTimeouts.current[chatId]) {
        clearTimeout(presenceTimeouts.current[chatId]);
        delete presenceTimeouts.current[chatId];
      }

      // Configurar timeout para limpar presença após 10 segundos
      if (shouldSetTimeout && presenceText) {
        presenceTimeouts.current[chatId] = setTimeout(() => {

          setChatPresenceStates(prev => ({
            ...prev,
            [chatId]: ''
          }));

          setSelectedChat(prev => {
            if (!prev || widToString(prev.chat.id) !== chatId) return prev;
            const updatedChat = { ...prev, isOnline: '' };
            return updatedChat;
          });

          setIsChangingPresence(null);
          delete presenceTimeouts.current[chatId];
        }, 10000); // 10 segundos
      }

    }, 'jurfis');

    // Retornar função de cleanup
    return cleanup;
  }, [isConnectedToWS, getPresence]);

  // Track para mensagens já processadas
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Listener para novas mensagens
  useEffect(() => {
    if (newMessages.length === 0) return;

    const latestMessage = newMessages[newMessages.length - 1];

    // Verificar se esta mensagem já foi processada
    if (processedMessageIds.current.has(latestMessage.id)) {
      return;
    }

    // Marcar mensagem como processada
    processedMessageIds.current.add(latestMessage.id);

    // Só processar mensagens que não são minhas
    if (latestMessage.fromMe) return;

    const chatId = latestMessage.chatId;

    // Atualizar lista de chats
    setChats(prevChats => {
      const chatIndex = prevChats.findIndex(chat => chat.id._serialized === chatId);

      if (chatIndex === -1) {
        return prevChats;
      }

      const updatedChat: Chats = {
        ...prevChats[chatIndex],
        lastReceivedKey: {
          ...latestMessage,
          content: latestMessage.content || latestMessage.body,
          timestamp: latestMessage.timestamp || latestMessage.t
        } as any, // Usar 'as any' para contornar problema de tipos do wppconnect
        unreadCount: (prevChats[chatIndex].unreadCount || 0) + 1
      };

      // Mover o chat atualizado para o topo da lista
      const newChats = [...prevChats];
      newChats.splice(chatIndex, 1); // Remove da posição atual
      newChats.unshift(updatedChat); // Adiciona no início

      return newChats;
    });

    // Se for mensagem do chat atualmente selecionado, adicionar à lista de mensagens
    if (selectedChat && widToString(selectedChat.chat.id) === chatId) {
      setMessages(prevMessages => {
        // Verificar se a mensagem já existe para evitar duplicação
        const messageExists = prevMessages.some(msg => msg.id === latestMessage.id);

        if (messageExists) {
          return prevMessages;
        }

        return [...prevMessages, {
          id: latestMessage.id,
          chatId: latestMessage.chatId,
          content: latestMessage.content || latestMessage.body,
          type: latestMessage.type,
          timestamp: latestMessage.timestamp || latestMessage.t,
          fromMe: latestMessage.fromMe,
          status: 'delivered'
        } as any];
      });

      // Marcar como lida automaticamente se o chat estiver selecionado
      setChats(prevChats => {
        return prevChats.map(chat => {
          if (chat.id._serialized === chatId) {
            return { ...chat, unreadCount: 0 };
          }
          return chat;
        });
      });

      // Enviar send-seen automaticamente para mensagens recebidas no chat selecionado
      sendSeenForChat(chatId);
    } else {
      // Mostrar notificação do Windows para mensagens de outros chats
      showWindowsNotification(latestMessage);
    }

  }, [newMessages, selectedChat]);

  // Função para processar atualizações de ACK
  const processAckUpdate = useCallback((ackData: any) => {

    // Atualizar status da mensagem baseado no ACK
    setMessages(prevMessages => {
      return prevMessages.map(message => {
        // Comparar IDs de forma mais flexível
        const messageId = message.id;
        const ackId = ackData.id;

        if (messageId === ackId) {
          let newStatus = 'sent';

          // ACK = 1: Enviado ao servidor
          // ACK = 2: Entregue ao dispositivo
          // ACK = 3: Lida pelo usuário
          if (ackData.ack === 1) newStatus = 'sent';
          else if (ackData.ack === 2) newStatus = 'delivered';
          else if (ackData.ack === 3) newStatus = 'read';

          // Atualizar tanto o status quanto o ack
          return { ...message, status: newStatus, ack: ackData.ack };
        }
        return message;
      });
    });
  }, []);

  // Listener para ACKs (confirmações de entrega/leitura)
  useEffect(() => {
    if (messageAcks.length === 0) return;

    const latestAck = messageAcks[messageAcks.length - 1];

    // Usar setTimeout para verificar se mensagem existe, evitando dependência de messages
    setTimeout(() => {
      setMessages(currentMessages => {
        const messageExists = currentMessages.some(m => m.id === latestAck.id);

        if (messageExists) {
          // Processar ACK imediatamente
          processAckUpdate(latestAck);
        } else {
          // Armazenar ACK para processamento posterior
          setPendingAcks(prev => [...prev.slice(-19), latestAck]); // Manter últimos 20
        }

        return currentMessages; // Não alterar mensagens aqui
      });
    }, 50); // Pequeno delay para garantir que mensagens foram atualizadas

  }, [messageAcks, processAckUpdate]);

  // Função para mostrar notificação do Windows
  const showWindowsNotification = (message: any) => {
    // Verificar se as notificações são suportadas
    if (!('Notification' in window)) {
      return;
    }

    // Verificar permissão
    if (Notification.permission === 'granted') {
      // Encontrar o chat para pegar o nome do contato
      const chat = chats.find(c => c.id._serialized === message.chatId);
      const senderName = chat?.contact?.formattedName || message.sender?.pushname || 'Contato desconhecido';
      const messageContent = message.content || message.body || 'Nova mensagem';

      const notification = new Notification(`${senderName}`, {
        body: messageContent,
        icon: '/favicon.ico', // Ou use a foto de perfil se disponível
        tag: message.chatId, // Para substituir notificações anteriores do mesmo chat
        requireInteraction: false,
        silent: false
      });

      // Fechar automaticamente após 5 segundos
      setTimeout(() => notification.close(), 5000);

      // Ao clicar na notificação, focar na janela
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

    } else if (Notification.permission !== 'denied') {
      // Solicitar permissão
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showWindowsNotification(message);
        }
      });
    }
  };

  // Solicitar permissão de notificação ao carregar o componente
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Hook para detectar quando a janela volta ao foco e enviar send-seen
  useEffect(() => {
    const handleWindowFocus = () => {
      if (selectedChat) {
        sendSeenForChat(widToString(selectedChat.chat.id));
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && selectedChat) {
        sendSeenForChat(widToString(selectedChat.chat.id));
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedChat]);

  // Hook para detectar tecla ESC e desmarcar chat selecionado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedChat) {
        setSelectedChat(null);
        setMessages([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedChat]);

  // Função para enviar send-seen com retry
  const sendSeenForChat = async (chatId: string, retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 segundo

    try {
      const response = await fetch(`/api/chat/send-seen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatId })
      });

      const data = await response.json();
      if (data.success) {
        return true;
      } else {
        throw new Error(data.error || 'Falha desconhecida ao enviar send-seen');
      }
    } catch (error) {
      console.error(`❌ Erro ao enviar send-seen (tentativa ${retryCount + 1}):`, error);

      if (retryCount < maxRetries) {
        setTimeout(() => {
          sendSeenForChat(chatId, retryCount + 1);
        }, retryDelay * (retryCount + 1)); // Aumenta o delay a cada tentativa
        return false;
      } else {
        console.error(`❌ Falha definitiva ao enviar send-seen após ${maxRetries + 1} tentativas`);
        return false;
      }
    }
  };

  //funções para gerenciamento das conversas
  const loadChats = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setCurrentPage(1);
        setHasMoreChats(true);
      };
      if (page > 1) setIsLoadingMoreChats(true);

      const response = await fetch(`/api/chat/chats?page=${page}&limit=20`);
      const data = await response.json();
      if (data.success) {
        if (append) setChats(prev => [...prev, ...data.chats]);
        else setChats(data.chats);
        setHasMoreChats(data.chats.length === 20 && page < data.totalPages);
        setCurrentPage(page);
      } else {
        console.error(`Falha ao carregar chats:`, data.error);
        if (!append) setChats([]);
      };
    } catch (error) {
      console.error(`Erro ao carregar chats:`, error);
      if (!append) setChats([]);
    } finally {
      setIsLoadingMoreChats(false);
    };
  }, []);
  // Carregar chats apenas na primeira conexão bem-sucedida
  const hasLoadedChats = useRef(false);
  useEffect(() => {
    if (realtimeConnection.lastState === `CONNECTED` && realtimeConnection.isConnected && connectionState.status === `connected`) {
      // Carregar apenas se não carregou ainda
      if (!hasLoadedChats.current) {
        loadChats();
        hasLoadedChats.current = true;
      }
    }

    // Resetar flag se perder conexão completamente
    if (realtimeConnection.lastState === `DISCONNECTED` || realtimeConnection.lastState === `UNPAIRED`) {
      hasLoadedChats.current = false;
    }
  }, [realtimeConnection.lastState, realtimeConnection.isConnected, connectionState.status, loadChats]);
  // Cache para evitar requisições duplicadas
  const profilePicRequests = useRef<Set<string>>(new Set());

  const fetchProfilePic = useCallback(async (chatId: string) => {
    // Verificar se já tem a imagem no cache
    if (profilePics[chatId]) return;

    // Verificar se já está fazendo a requisição
    if (profilePicRequests.current.has(chatId)) return;

    // Marcar como sendo requisitado
    profilePicRequests.current.add(chatId);

    try {
      const response = await fetch(`/api/chat/profile-pic?chatId=${encodeURIComponent(chatId)}`);
      const data = await response.json();
      if (data.success && data.profilePic) {
        setProfilePics(prev => ({ ...prev, [chatId]: data.profilePic }));
      } else {
        // Marcar como "sem foto" para evitar novas tentativas
        setProfilePics(prev => ({ ...prev, [chatId]: null }));
      }
    } catch (error) {
      console.error(`Erro ao carregar foto de perfil:`, error);
      // Marcar como "sem foto" para evitar novas tentativas
      setProfilePics(prev => ({ ...prev, [chatId]: null }));
    } finally {
      // Remover da lista de requisições em andamento
      profilePicRequests.current.delete(chatId);
    }
  }, [profilePics]);
  useEffect(() => {
    if (chats.length > 0) {
      chats.slice(0, 8).forEach(chat => {
        const chatId = widToString(chat.id);
        // Só buscar se não tem no cache e não está sendo requisitado
        if (profilePics[chatId] === undefined && !profilePicRequests.current.has(chatId)) {
          fetchProfilePic(chatId);
        }
      });
    };
  }, [chats, fetchProfilePic]);
  const handleScroll = useCallback(() => {
    if (!hasMoreChats || isLoadingMoreChats) return;
    loadChats(currentPage + 1, true);
  }, [hasMoreChats, isLoadingMoreChats, currentPage, loadChats]);
  const handleChatSelect = async (chat: Chats) => {
    // Marcar mensagens como lidas ao selecionar o chat
    const updatedChat = chat.unreadCount > 0 ? { ...chat, unreadCount: 0 } : chat;

    // Resetar estado de paginação das mensagens
    setMessagesState({
      lastMessageId: null,
      hasMoreMessages: true,
      isLoadingMessages: false,
      isLoadingOlderMessages: false
    });

    // Buscar status online do chat
    let onlineStatus = chatPresenceStates[chat.id._serialized] || '';
    try {
      const response = await fetch(`/api/chat/is-online?chatId=${encodeURIComponent(chat.id._serialized)}`);
      const data = await response.json();

      if (data.success) {
        onlineStatus = data.isOnline ? 'Online' : '';
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status online:', error);
    }

    setSelectedChat({ chat: updatedChat, isOnline: onlineStatus });
    loadMessages(widToString(chat.id));

    // Limpar cache de mensagens processadas ao trocar de chat
    processedMessageIds.current.clear();

    // Sempre marcar chat como lido ao selecionar e enviar send-seen
    setChats(prevChats => {
      return prevChats.map(prevChat => {
        if (prevChat.id._serialized === chat.id._serialized) {
          return { ...prevChat, unreadCount: 0 };
        }
        return prevChat;
      });
    });

    // Sempre enviar send-seen ao selecionar um chat (para garantir que a conversa seja marcada como visualizada)
    sendSeenForChat(chat.id._serialized);
  };

  //funções para gerenciamento de áudio
  type AudioStates = { [key: string]: { isPlaying: boolean, progress: number, audio?: HTMLAudioElement } };
  const [audioStates, setAudioStates] = useState<AudioStates>({});
  const handleAudioPlay = useCallback((messageId: string, audioBase64: string) => {
    if (!audioStates[messageId]?.audio) {
      const newAudio = new Audio(`data:audio/ogg;base64,${audioBase64}`);
      newAudio.onerror = () => {
        setAudioStates(prev => ({ ...prev, [messageId]: { ...prev[messageId], isPlaying: false } }));
      };

      newAudio.oncanplaythrough = () => {
        newAudio.addEventListener(`timeupdate`, () => {
          setAudioStates(prev => ({ ...prev, [messageId]: { ...prev[messageId], progress: (newAudio.currentTime / newAudio.duration) * 100 } }));
        });
        newAudio.addEventListener(`ended`, () => {
          setAudioStates(prev => ({ ...prev, [messageId]: { ...prev[messageId], isPlaying: false, progress: 0 } }));
        });
        setAudioStates(prev => ({ ...prev, [messageId]: { isPlaying: true, progress: 0, audio: newAudio } }));
        newAudio.play().catch(err => console.error(`Erro ao tocar áudio:`, err));
      };
    } else {
      const audio = audioStates[messageId].audio;
      const isPlaying = audioStates[messageId].isPlaying;

      if (isPlaying) {
        audio?.pause();
        setAudioStates(prev => ({ ...prev, [messageId]: { ...prev[messageId], isPlaying: false } }));
      } else {
        audio?.play().catch(err => console.error(`Erro ao tocar áudio:`, err));
        setAudioStates(prev => ({ ...prev, [messageId]: { ...prev[messageId], isPlaying: true } }));
      };
    };
  }, [audioStates]);
  const handleAudioProgress = useCallback((e: React.MouseEvent<HTMLDivElement>, messageId: string) => {
    const audio = audioStates[messageId]?.audio;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    audio.currentTime = audio.duration * clickPosition;
  }, [audioStates]);

  //funções para gerenciamento de mídia
  const [mediaModal, setMediaModal] = useState<{ isOpen: boolean, type: string, url: string }>({ isOpen: false, type: ``, url: `` });
  const handleMediaModal = (isOpen: boolean, type: string, url: string) => {
    setMediaModal({ isOpen, type, url });
  };

  //estado para controle de paginação das mensagens
  const [messagesState, setMessagesState] = useState<{
    lastMessageId: string | null;
    hasMoreMessages: boolean;
    isLoadingMessages: boolean;
    isLoadingOlderMessages: boolean;
  }>({
    lastMessageId: null,
    hasMoreMessages: true,
    isLoadingMessages: false,
    isLoadingOlderMessages: false
  });

  //funções para gerenciamento de mensagens
  const loadMessages = useCallback(async (chatId: string, loadMore = false) => {
    try {
      if (messagesState.isLoadingMessages || (!loadMore && !messagesState.hasMoreMessages && messagesState.lastMessageId)) return;

      setMessagesState(prev => ({
        ...prev,
        isLoadingMessages: true,
        isLoadingOlderMessages: loadMore
      }));

      // Construir parâmetros da URL
      const params = new URLSearchParams();
      params.append('count', '20');
      if (loadMore && messagesState.lastMessageId) {
        params.append('id', messagesState.lastMessageId);
        params.append('direction', 'before');
      }

      const response = await fetch(`/api/chat/messages/${encodeURIComponent(chatId)}?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        if (loadMore) {
          // Adicionar mensagens mais antigas ao início da lista
          setMessages(prev => [...data.messages, ...prev]);
        } else {
          // Substituir mensagens (carregamento inicial)
          setMessages(data.messages);
        }

        // Atualizar estado de paginação
        // Para paginação, usamos o ID da primeira mensagem (mais antiga) carregada
        const firstMessageId = loadMore && data.messages.length > 0 ? data.messages[0].id :
          (!loadMore && data.messages.length > 0 ? data.messages[0].id : null);

        setMessagesState({
          lastMessageId: firstMessageId,
          hasMoreMessages: data.hasMore,
          isLoadingMessages: false,
          isLoadingOlderMessages: false
        });

      } else {
        setMessages([]);
        setMessagesState({
          lastMessageId: null,
          hasMoreMessages: false,
          isLoadingMessages: false,
          isLoadingOlderMessages: false
        });
      }
    } catch (error) {
      console.error(`❌ Erro ao carregar mensagens:`, error);
      if (!loadMore) {
        setMessages([]);
        setMessagesState({
          lastMessageId: null,
          hasMoreMessages: false,
          isLoadingMessages: false,
          isLoadingOlderMessages: false
        });
      } else {
        setMessagesState(prev => ({ ...prev, isLoadingMessages: false }));
      }
    };
  }, [messagesState]);
  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !selectedChat || !session?.user?.name) return;

    // Adicionar prefixo do usuário à mensagem
    const messageWithUser = `_*${session.user.name}*_:\n\n${messageContent}`;

    const tempMessage: Message = { id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, chatId: selectedChat.chat.id, content: messageWithUser, type: `text`, timestamp: Date.now(), fromMe: true, status: `sending` } as unknown as Message;
    setMessages(prev => [...prev, tempMessage]);

    // Forçar scroll para baixo ao enviar mensagem
    setForceScrollToBottom(true);
    setTimeout(() => setForceScrollToBottom(false), 100);

    try {
      const response = await fetch(`/api/chat/send-message`, {
        method: `POST`,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedChat.chat.id._serialized,
          message: messageWithUser
        })
      });

      const data = await response.json();
      if (data.success && data.messageId) {

        // Armazenar mapeamento de ID temporário para ID real
        setMessageIdMap(prev => ({
          ...prev,
          [data.messageId]: tempMessage.id  // Mapear ID real -> ID temporário
        }));

        // Atualizar mensagem com ID real
        setMessages(prev => prev.map(m => m.id === tempMessage.id ? {
          ...m,
          id: data.messageId,
          status: `sent`,
          ack: 1 // ACK inicial = enviado
        } : m));

        // Processar ACKs pendentes para esta mensagem
        setPendingAcks(prev => {
          const acksForThisMessage = prev.filter(ack => ack.id === data.messageId);
          if (acksForThisMessage.length > 0) {
            // Processar o ACK mais recente
            const latestAck = acksForThisMessage[acksForThisMessage.length - 1];
            setTimeout(() => processAckUpdate(latestAck), 100);
            // Remover ACKs processados
            return prev.filter(ack => ack.id !== data.messageId);
          }
          return prev;
        });

      } else {
        setMessages(prev => prev.map(m => m.id === tempMessage.id ? { ...m, status: `sent` } : m));
      }
    } catch (error) {
      console.error(`Erro ao enviar mensagem:`, error);
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === tempMessage.id ? { ...m, status: `delivered` } : m));
      }, 1000);
    };
  };

  //funções para gerenciamento de arquivos
  const handleFileUpload = (file: File) => {
    if (!file || !selectedChat) return;
    const message: Message = { id: Date.now().toString(), chatId: selectedChat.chat.id, content: `📎 ${file.name}`, type: `file`, timestamp: Date.now(), fromMe: true, status: `sending` } as unknown as Message;
    setMessages(prev => [...prev, message]);
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, status: `delivered` } : m));
    }, 2000);
  };

  //visualização de carregamento
  if (status === `loading`) return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔄</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Carregando</h1>
          <p className="text-gray-600 text-sm">Verificando autenticação...</p>
        </div>
      </div>
    </div>
  );

  //visualização de autenticação
  if (!session) return null;

  //visualização de QR Code
  if (connectionState.status === `qr_required`) return <QRCodeDisplay qrCode={qrCode} onGenerateNew={generateQRCode} />;

  //visualização de status da conexão
  if (connectionState.status === `checking` || connectionState.status === `error` || !connectionState.isConnected) return <ConnectionStatus connectionState={connectionState} onRetry={checkInstanceStatus} />;

  // visualização de conversas
  return (
    <>
      <div className="h-screen bg-white flex">
        <ChatSidebar
          chats={chats}
          selectedChat={selectedChat}
          searchTerm={searchTerm}
          activeFilter={activeFilter}
          isLoadingMoreChats={isLoadingMoreChats}
          profilePics={profilePics}
          chatPresenceStates={chatPresenceStates}
          session={session}
          onSearchChange={setSearchTerm}
          onFilterChange={setActiveFilter}
          onChatSelect={handleChatSelect}
          onScroll={handleScroll}
        />

        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <ChatHeader
                selectedChat={selectedChat}
                profilePic={profilePics[widToString(selectedChat.chat.id)]}
              />

              <div className="flex-1 relative"
                style={{
                  backgroundColor: '#f5f1eb',
                  backgroundImage: 'url("/chat/images/bg-chat.png")',
                  backgroundRepeat: 'repeat',
                  backgroundSize: 'auto',
                  backgroundPosition: 'center',
                  backgroundAttachment: 'fixed'
                }}
              >
                <MessageList
                  messages={messages}
                  audioStates={audioStates}
                  onAudioPlay={handleAudioPlay}
                  onAudioProgress={handleAudioProgress}
                  onMediaModal={handleMediaModal}
                  onLoadMoreMessages={() => selectedChat && loadMessages(widToString(selectedChat.chat.id), true)}
                  hasMoreMessages={messagesState.hasMoreMessages}
                  isLoadingMessages={messagesState.isLoadingMessages}
                  scrollToBottom={forceScrollToBottom}
                />

                <MessageInput
                  selectedChat={selectedChat}
                  isTyping={isTyping}
                  onSendMessage={handleSendMessage}
                  onFileUpload={handleFileUpload}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">💬</span>
                </div>
                <h2 className="text-xl font-medium mb-2">Selecione uma conversa</h2>
                <p className="text-sm">Escolha uma conversa da lista para começar a atender</p>
              </div>
            </div>
          )}
        </div>

        <MediaModal
          isOpen={mediaModal.isOpen}
          type={mediaModal.type}
          url={mediaModal.url}
          onClose={() => setMediaModal({ isOpen: false, type: ``, url: `` })}
        />
      </div>
    </>
  );
};