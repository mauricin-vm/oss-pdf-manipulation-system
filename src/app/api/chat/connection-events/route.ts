import { NextRequest } from 'next/server';

// Lista de clientes conectados (em produção, use Redis ou similar)
let connectedClients = new Set<ReadableStreamDefaultController>();

// Server-Sent Events endpoint para notificações de conexão
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    start(controller) {
      // Adicionar cliente à lista
      connectedClients.add(controller);

      // Enviar header SSE inicial
      const initialEvent = {
        type: 'connected',
        message: 'Connection events active',
        timestamp: Date.now()
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialEvent)}\n\n`));

      // Heartbeat para manter conexão viva
      const interval = setInterval(() => {
        try {
          const heartbeat = {
            type: 'heartbeat',
            timestamp: Date.now()
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(heartbeat)}\n\n`));
        } catch (error) {
          // Cliente desconectado
          clearInterval(interval);
          connectedClients.delete(controller);
        }
      }, 30000); // A cada 30 segundos

      // Cleanup quando cliente desconecta
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        connectedClients.delete(controller);
        controller.close();
      });
    }
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

// Endpoint para notificar mudanças de estado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Suportar tanto formato antigo quanto novo
    const eventData = {
      type: body.type,
      state: body.state || body.data?.state,
      connected: body.connected ?? (body.type === 'ready' || body.type === 'authenticated'),
      timestamp: body.timestamp || Date.now(),
      data: body.data,
      source: body.source || 'api',
      qrCode: body.data?.qrCode || body.qrCode
    };

    // Broadcast para todos os clientes conectados
    const encoder = new TextEncoder();
    const message = `data: ${JSON.stringify(eventData)}\n\n`;

    // Remover clientes desconectados e enviar para os ativos
    const activeClients = new Set<ReadableStreamDefaultController>();

    for (const client of connectedClients) {
      try {
        client.enqueue(encoder.encode(message));
        activeClients.add(client);
      } catch (error) {
        // Cliente desconectado, remover da lista
      }
    }

    connectedClients = activeClients;

    return Response.json({
      success: true,
      eventId: Date.now().toString(),
      clientsNotified: connectedClients.size
    });

  } catch (error) {
    console.error('Error broadcasting connection event:', error);
    return Response.json(
      { error: 'Failed to broadcast event' },
      { status: 500 }
    );
  }
}

// Função helper para notificar externamente (pode ser chamada de outros lugares)
export async function broadcastConnectionStateChange(state: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/connection-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'connection_state_change',
        state,
        connected: state === 'CONNECTED'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

  } catch (error) {
    console.error('Error broadcasting connection state:', error);
  }
}