//importar bibliotecas e funções
import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState, useCallback } from 'react';



interface ReceivedMessage {
  session: string;
  response: any;
}

interface PresenceChangedEvent {
  id: string;
  participant?: string;
  state: 'unavailable' | 'available' | 'composing' | 'recording' | 'paused';
  session: string;
}

interface UseWebSocketProps {
  isConnected: boolean;
  schema?: string;
}

export function useWebSocket({ isConnected, schema }: UseWebSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 5;
  const isClient = typeof window !== 'undefined';

  const [isConnectedToWS, setIsConnectedToWS] = useState(false);
  const [presenceState, setPresenceState] = useState<{
    chatId: string;
    isChanging: string;
  } | null>(null);

  // Estados para diferentes tipos de eventos
  const [newMessages, setNewMessages] = useState<any[]>([]);
  const [messageAcks, setMessageAcks] = useState<any[]>([]);

  const handlePresenceMessage = useCallback((message: PresenceChangedEvent) => {

    // Se estiver digitando
    if (message.state === 'composing') {
      setPresenceState({ chatId: message.id, isChanging: 'Digitando...' });
      return;
    }

    // Se estiver gravando áudio
    if (message.state === 'recording') {
      setPresenceState({ chatId: message.id, isChanging: 'Gravando...' });
      return;
    }

    // Se estiver online/disponível
    if (message.state === 'available') {
      setPresenceState({ chatId: message.id, isChanging: 'Online' });
      return;
    }

    // Se pausou ou não está disponível
    if (message.state === 'paused' || message.state === 'unavailable') {
      setPresenceState({ chatId: message.id, isChanging: '' });
      return;
    }

    // Caso contrário, limpar estado
    setPresenceState(null);
  }, []);

  const connectToSocket = useCallback(() => {
    if (!isClient) {
      return;
    }

    try {
      // Evitar reconexões desnecessárias
      if (socketRef.current?.connected) {
        return;
      }

      // Desconectar socket anterior se existir
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Obter URL do servidor
      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;


      if (!wsUrl) {
        console.error('❌ NEXT_PUBLIC_WEBSOCKET_URL não está definida no .env');
        return;
      }

      // Extrair host e porta da URL WebSocket
      const url = new URL(wsUrl);
      const serverUrl = `http://${url.host}`;


      // Criar conexão Socket.IO
      socketRef.current = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: maxRetries,
        reconnectionDelay: 2000,
        forceNew: false, // Reutilizar conexão se possível
        upgrade: true,
        rememberUpgrade: true
      });

      socketRef.current.on('connect', () => {
        setIsConnectedToWS(true);
        retryCount.current = 0;

        // Enviar schema se fornecido (sessão do WhatsApp)
        if (schema && socketRef.current) {
          socketRef.current.emit('join-session', { session: schema });
        }
      });

      // Escutar mensagens recebidas
      socketRef.current.on(`received-message-${schema}`, (data: ReceivedMessage) => {
        setNewMessages(prev => [...prev.slice(-49), data.response]); // Manter últimas 50
      });

      // Escutar mudanças de presença
      socketRef.current.on(`onpresencechanged-${schema}`, (data: PresenceChangedEvent) => {
        handlePresenceMessage(data);
      });

      // Escutar ACKs de mensagens
      socketRef.current.on(`onack-${schema}`, (ackData: any) => {

        // Normalizar estrutura do ACK
        const normalizedAck = {
          id: ackData.id?._serialized || ackData.id,
          ack: ackData.ack
        };

        setMessageAcks(prev => [...prev.slice(-49), normalizedAck]);
      });

      // Log de todos os eventos recebidos para debug
      socketRef.current.onAny((eventName, ...args) => {
        if (eventName.includes('ack') || eventName.includes('Ack')) {
        }
      });

      // Escutar ligações
      socketRef.current.on('incomingcall', (data: any) => {
        console.log('📞 Ligação recebida:', data);
      });

      // Escutar reações
      socketRef.current.on('onreactionmessage', (data: any) => {
        console.log('😍 Reação recebida:', data);
      });

      // Escutar mensagens revogadas
      socketRef.current.on(`onrevokedmessage-${schema}`, (data: any) => {
        console.log('🗑️ Mensagem revogada:', data);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('🔌 Socket.IO desconectado:', reason);
        setIsConnectedToWS(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Erro na conexão Socket.IO:', error.message);
        console.error('Servidor tentado:', serverUrl);
        setIsConnectedToWS(false);
      });

    } catch (error) {
      console.error('Erro ao criar Socket.IO:', error);
    }
  }, [isClient, schema, handlePresenceMessage]); // Remover isConnected das dependências

  // Função para registrar callback de presença (compatibilidade com código antigo)
  const getPresence = useCallback((callback: (err: any, message: any) => void, sessionName?: string) => {
    if (!socketRef.current) {
      return () => { };
    }

    const session = sessionName || schema || 'default';
    const eventName = `onpresencechanged-${session}`;

    console.log('📡 Registrando escuta de presença para:', eventName);

    const handleMessage = (data: PresenceChangedEvent) => {
      // Converter para formato compatível com código antigo
      const compatibleMessage = {
        id: data.id,
        state: data.state === 'composing' ? 'typing' :
          data.state === 'recording' ? 'recording_audio' :
            data.state === 'available' ? 'online' : data.state,
        isOnline: data.state === 'available',
        participant: data.participant,
        session: data.session
      };

      callback(null, compatibleMessage);
    };

    socketRef.current.on(eventName, handleMessage);

    // Retornar função de cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.off(eventName, handleMessage);
      }
    };
  }, [schema]);

  // Conectar apenas quando isConnected muda (não reconectar a cada render)
  useEffect(() => {
    if (isConnected && !socketRef.current?.connected) {
      console.log('🔗 Conectando Socket.IO pela primeira vez ou após desconexão...');
      connectToSocket();
    } else if (!isConnected && socketRef.current?.connected) {
      // Desconectar apenas se não estiver mais conectado
      console.log('🔌 Desconectando Socket.IO por perda de conexão principal...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnectedToWS(false);
    }
  }, [isConnected]); // Remover connectToSocket das dependências

  // Cleanup apenas no unmount do componente
  useEffect(() => {
    return () => {
      console.log('🧹 Limpando Socket.IO no unmount do componente...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      setIsConnectedToWS(false);
    };
  }, []); // Array vazio = só executa no unmount

  // Função para enviar mensagem via Socket.IO
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('message', message);
      return true;
    }
    return false;
  }, []);

  // Função para forçar reconexão
  const reconnect = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryCount.current = 0;
    connectToSocket();
  }, [connectToSocket]);

  return {
    isConnectedToWS,
    presenceState,
    newMessages,
    messageAcks,
    getPresence,
    sendMessage,
    reconnect
  };
}