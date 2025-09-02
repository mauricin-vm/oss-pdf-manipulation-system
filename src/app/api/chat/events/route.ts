import { NextRequest } from 'next/server';

// Server-Sent Events endpoint como alternativa ao WebSocket
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    start(controller) {
      // Enviar header SSE
      controller.enqueue(encoder.encode('data: {"type":"connected","message":"Chat events connected"}\n\n'));

      // Simular eventos periódicos para desenvolvimento
      const interval = setInterval(() => {
        const mockEvent = {
          type: 'heartbeat',
          timestamp: Date.now(),
          message: 'Connection alive'
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(mockEvent)}\n\n`));
      }, 30000); // A cada 30 segundos

      // Cleanup function
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
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

// Endpoint para simular envio de eventos
export async function POST(request: NextRequest) {
  const { type, data } = await request.json();

  // Aqui você pode processar e distribuir eventos
  // Por exemplo, salvar no banco ou enviar para outros clientes


  return Response.json({
    success: true,
    eventId: Date.now().toString(),
    type,
    processed: true
  });
}