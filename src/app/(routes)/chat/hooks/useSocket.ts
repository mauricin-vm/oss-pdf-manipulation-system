import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useState, useCallback } from 'react';

// Interfaces
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

interface SessionLoggedEvent {
  status: boolean;
  session: string;
}

interface QRCodeEvent {
  data: string;
  session: string;
}

// Estados de conexão simplificados
type ConnectionStatus = 'checking' | 'server_offline' | 'qr_required' | 'connecting' | 'connected';

interface ConnectionState {
  status: ConnectionStatus;
  qrCode: string | null;
  sessionState: string | null; // CONNECTED, UNPAIRED, etc.
  sessionLogged: boolean;
}

interface UseSocketProps {
  schema?: string;
}

export function useSocket({ schema = 'jurfis' }: UseSocketProps) {
  const socketRef = useRef<Socket | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 5;
  const isClient = typeof window !== 'undefined';

  // Estados principais
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'checking',
    qrCode: null,
    sessionState: null,
    sessionLogged: false
  });


  // Estados para mensagens e presença
  const [newMessages, setNewMessages] = useState<any[]>([]);
  const [messageAcks, setMessageAcks] = useState<any[]>([]);
  const [presenceState, setPresenceState] = useState<{
    chatId: string;
    isChanging: string;
  } | null>(null);

  const handlePresenceMessage = useCallback((message: PresenceChangedEvent) => {
    let presenceText = '';
    
    if (message.state === 'composing') {
      presenceText = 'Digitando...';
    } else if (message.state === 'recording') {
      presenceText = 'Gravando...';
    } else if (message.state === 'available') {
      presenceText = 'Online';
    }

    setPresenceState({ chatId: message.id, isChanging: presenceText });

    // Auto-clear após 10 segundos
    if (presenceText) {
      setTimeout(() => {
        setPresenceState(prev => 
          prev?.chatId === message.id ? { chatId: message.id, isChanging: '' } : prev
        );
      }, 10000);
    }
  }, []);

  const connectToSocket = useCallback(() => {
    if (!isClient) return;

    try {
      // Evitar reconexões desnecessárias
      if (socketRef.current?.connected) return;

      // Limpar socket anterior
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
      if (!wsUrl) {
        console.error('❌ NEXT_PUBLIC_WEBSOCKET_URL não definida');
        setConnectionState(prev => ({ ...prev, status: 'server_offline' }));
        return;
      }

      const url = new URL(wsUrl);
      const serverUrl = `http://${url.host}`;

      // Criar conexão Socket.IO
      socketRef.current = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: maxRetries,
        reconnectionDelay: 2000,
        forceNew: false
      });

      // === EVENTOS DE CONEXÃO ===
      socketRef.current.on('connect', () => {
        console.log('🔌 Socket conectado');
        retryCount.current = 0;
        
        // Se estava offline, resetar para checking e forçar verificação
        setConnectionState(prev => ({ 
          ...prev, 
          status: 'checking',
          qrCode: null // Limpar QR Code antigo
        }));

        // Entrar na sessão
        if (socketRef.current) {
          socketRef.current.emit('join-session', { session: schema });
        }

        // Forçar verificação de status após reconexão com retry
        const verifyStatusWithRetry = async (attempt = 1) => {
          const maxAttempts = 3;
          const delay = attempt * 2000; // 2s, 4s, 6s
          
          setTimeout(async () => {
            if (!socketRef.current?.connected) return;
            
            try {
              console.log(`🔄 Verificação pós-reconexão (tentativa ${attempt}/${maxAttempts})`);
              const response = await fetch('/api/chat/status');
              
              if (response.ok) {
                const data = await response.json();
                console.log('📊 Status pós-reconexão:', data);
                
                // Se API indica conectado, usar estado da API
                if (data.success && data.connected) {
                  console.log('✅ API confirma conectado - definindo status');
                  setConnectionState(prev => ({
                    ...prev,
                    status: 'connected',
                    sessionState: 'CONNECTED',
                    sessionLogged: true
                  }));
                  return; // Sucesso, parar tentativas
                } else {
                  // Se não está conectado e é a primeira tentativa, inicializar sessão
                  if (attempt === 1) {
                    console.log('🚀 Sessão não conectada - inicializando automaticamente...');
                    await initializeSession();
                  }
                }
              }
              
              // Se não deu certo e ainda há tentativas, tentar novamente
              if (attempt < maxAttempts) {
                verifyStatusWithRetry(attempt + 1);
              } else {
                console.log('⚠️ Todas as tentativas de verificação falharam');
              }
            } catch (error) {
              console.error(`❌ Erro na verificação pós-reconexão (tentativa ${attempt}):`, error);
              
              // Se não deu certo e ainda há tentativas, tentar novamente
              if (attempt < maxAttempts) {
                verifyStatusWithRetry(attempt + 1);
              }
            }
          }, delay);
        };
        
        verifyStatusWithRetry(1);
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('🔌 Socket desconectado:', reason);
        
        if (reason === 'transport close' || reason === 'transport error') {
          setConnectionState(prev => ({ 
            ...prev, 
            status: 'server_offline',
            qrCode: null,
            sessionState: null,
            sessionLogged: false
          }));
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.log('❌ Erro de conexão socket:', error.message);
        setConnectionState(prev => ({ 
          ...prev, 
          status: 'server_offline',
          qrCode: null,
          sessionState: null,
          sessionLogged: false
        }));
      });

      // === EVENTOS ESPECÍFICOS DO WPPCONNECT ===
      
      // 1. Evento session-logged - instância iniciada
      socketRef.current.on('session-logged', (data: SessionLoggedEvent) => {
        if (data.session === schema) {
          console.log('📱 Session logged:', data.status);
          setConnectionState(prev => ({ 
            ...prev, 
            sessionLogged: data.status 
          }));
          
          // Se session foi logada com sucesso, verificar se está conectada
          if (data.status === true) {
            console.log('✅ Sessão logada com sucesso - verificando se está conectada...');
            
            // Aguardar um pouco e verificar status via API para confirmar conexão
            setTimeout(async () => {
              try {
                const response = await fetch('/api/chat/status');
                if (response.ok) {
                  const statusData = await response.json();
                  console.log('📊 Status após session-logged:', statusData);
                  
                  if (statusData.success && statusData.connected) {
                    console.log('🎉 Confirmado: WhatsApp conectado após QR Code!');
                    setConnectionState(prev => ({
                      ...prev,
                      status: 'connected',
                      sessionState: 'CONNECTED',
                      sessionLogged: true,
                      qrCode: null // Limpar QR Code
                    }));
                  }
                }
              } catch (error) {
                console.error('❌ Erro ao verificar status após session-logged:', error);
              }
            }, 2000); // Aguardar 2s para garantir que a sessão foi totalmente iniciada
          }
        }
      });

      // 2. Evento state-${session} - estados da sessão
      socketRef.current.on(`state-${schema}`, (client: any, state: string) => {
        console.log('📱 Estado da sessão:', state);
        
        const newStatus = state === 'CONNECTED' ? 'connected' :
                         state === 'UNPAIRED' || state === 'UNPAIRED_IDLE' ? 'qr_required' :
                         state === 'OPENING' || state === 'PAIRING' ? 'connecting' :
                         state === 'CONFLICT' || state === 'TIMEOUT' || state === 'DEPRECATED_VERSION' ? 'qr_required' :
                         'checking';
        
        setConnectionState(prev => ({ 
          ...prev, 
          sessionState: state,
          status: newStatus,
          // Quando conectado, garantir que sessionLogged também seja true e limpar QR Code
          sessionLogged: state === 'CONNECTED' ? true : prev.sessionLogged,
          qrCode: state === 'CONNECTED' ? null : prev.qrCode
        }));

        // Se recebeu CONNECTED diretamente, também fazer log de sucesso
        if (state === 'CONNECTED') {
          console.log('🎉 Estado CONNECTED recebido - WhatsApp conectado!');
        }
      });

      // 3. Evento qrCode - QR Code gerado
      socketRef.current.on('qrCode', (data: QRCodeEvent) => {
        if (data.session === schema) {
          console.log('🔗 QR Code recebido');
          setConnectionState(prev => ({ 
            ...prev, 
            qrCode: data.data,
            status: 'qr_required'
          }));
        }
      });

      // === EVENTOS DE MENSAGENS ===
      
      // Mensagens recebidas
      socketRef.current.on(`received-message-${schema}`, (data: ReceivedMessage) => {
        setNewMessages(prev => [...prev.slice(-49), data.response]);
      });

      // ACKs de mensagens
      socketRef.current.on(`onack-${schema}`, (ackData: any) => {
        const normalizedAck = {
          id: ackData.id?._serialized || ackData.id,
          ack: ackData.ack
        };
        setMessageAcks(prev => [...prev.slice(-49), normalizedAck]);
      });

      // Mudanças de presença
      socketRef.current.on(`onpresencechanged-${schema}`, (data: PresenceChangedEvent) => {
        handlePresenceMessage(data);
      });

      // Outros eventos
      socketRef.current.on('incomingcall', (data: any) => {
        console.log('📞 Chamada recebida:', data);
      });

      socketRef.current.on(`onrevokedmessage-${schema}`, (data: any) => {
        console.log('🗑️ Mensagem revogada:', data);
      });

    } catch (error) {
      console.error('❌ Erro ao criar socket:', error);
      setConnectionState(prev => ({ ...prev, status: 'server_offline' }));
    }
  }, [isClient, schema, handlePresenceMessage]);

  // Conectar automaticamente
  useEffect(() => {
    connectToSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [connectToSocket]);

  // Função para registrar callback de presença (compatibilidade)
  const getPresence = useCallback((callback: (err: any, message: any) => void, sessionName?: string) => {
    if (!socketRef.current) return () => {};

    const session = sessionName || schema;
    const eventName = `onpresencechanged-${session}`;

    const handleMessage = (data: PresenceChangedEvent) => {
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

    return () => {
      if (socketRef.current) {
        socketRef.current.off(eventName, handleMessage);
      }
    };
  }, [schema]);

  // Função para enviar mensagem
  const sendMessage = useCallback((message: any) => {
    if (socketRef.current?.connected) {
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

  // Função para inicializar sessão quando necessário
  const initializeSession = useCallback(async () => {
    try {
      console.log('🚀 Inicializando sessão WhatsApp...');
      const response = await fetch('/api/chat/status', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Sessão inicializada:', data);
        if (data.qrCode) {
          setConnectionState(prev => ({ 
            ...prev, 
            qrCode: data.qrCode,
            status: 'qr_required'
          }));
        }
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar sessão:', error);
    }
  }, []);

  // Função para gerar novo QR Code
  const generateQRCode = useCallback(async () => {
    try {
      const response = await fetch('/api/chat/qr-code');
      const data = await response.json();
      
      if (data.success && data.qrCode) {
        setConnectionState(prev => ({ 
          ...prev, 
          qrCode: data.qrCode,
          status: 'qr_required'
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao gerar QR Code:', error);
    }
  }, []);

  return {
    // Estados principais
    connectionState,
    
    // Estados para compatibilidade
    isConnectedToWS: socketRef.current?.connected ?? false,
    serverOffline: connectionState.status === 'server_offline',
    
    // Dados
    newMessages,
    messageAcks,
    presenceState,
    
    // Funções
    getPresence,
    sendMessage,
    reconnect,
    generateQRCode,
    initializeSession
  };
}