import { useEffect, useRef, useState } from 'react';

interface ConnectionEvent {
  type: string;
  state?: string;
  connected?: boolean;
  timestamp: number;
}

export function useConnectionEvents() {
  const [connectionState, setConnectionState] = useState<{
    isConnected: boolean;
    lastState: string | null;
    lastUpdate: number;
  }>({
    isConnected: false,
    lastState: null,
    lastUpdate: Date.now()
  });

  // Early return se não estiver no cliente
  const isClient = typeof window !== 'undefined';

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    if (!isClient) return;

    const connectToEvents = () => {
      try {
        // Fechar conexão anterior se existir
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Criar nova conexão SSE
        eventSourceRef.current = new EventSource('/api/chat/connection-events');

        eventSourceRef.current.onopen = () => {
          retryCount.current = 0; // Reset retry count on successful connection
        };

        eventSourceRef.current.onmessage = (event) => {
          try {
            const data: ConnectionEvent = JSON.parse(event.data);

            if (data.type === 'connection_state_change') {
              setConnectionState(prev => ({
                ...prev,
                isConnected: data.connected ?? false,
                lastState: data.state ?? prev.lastState,
                lastUpdate: data.timestamp
              }));
            }
          } catch (error) {
            console.error('Error parsing connection event:', error);
          }
        };

        eventSourceRef.current.onerror = (error) => {
          console.error('Connection events stream error:', error);

          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }

          // Retry with exponential backoff
          if (retryCount.current < maxRetries) {
            retryCount.current++;
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);


            retryTimeoutRef.current = setTimeout(() => {
              connectToEvents();
            }, retryDelay);
          } else {
            console.error('Max retries reached for connection events');
          }
        };

      } catch (error) {
        console.error('Error creating EventSource:', error);
      }
    };

    // Iniciar conexão
    connectToEvents();

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  // Função para forçar reconexão
  const reconnect = () => {
    if (!isClient) return;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryCount.current = 0;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Reconectar após um pequeno delay
    setTimeout(() => {
      try {
        eventSourceRef.current = new EventSource('/api/chat/connection-events');

        eventSourceRef.current.onopen = () => {
          retryCount.current = 0;
        };

        eventSourceRef.current.onmessage = (event) => {
          try {
            const data: ConnectionEvent = JSON.parse(event.data);

            if (data.type === 'connection_state_change') {
              setConnectionState(prev => ({
                ...prev,
                isConnected: data.connected ?? false,
                lastState: data.state ?? prev.lastState,
                lastUpdate: data.timestamp
              }));
            }
          } catch (error) {
            console.error('Error parsing connection event:', error);
          }
        };

        eventSourceRef.current.onerror = (error) => {
          console.error('Reconnection events stream error:', error);
        };

      } catch (error) {
        console.error('Error reconnecting to events:', error);
      }
    }, 1000);
  };

  return {
    connectionState,
    reconnect,
    isListening: isClient && eventSourceRef.current?.readyState === EventSource.OPEN
  };
}