import { NextRequest, NextResponse } from 'next/server';

// Endpoint para testar o webhook simulando eventos do wppconnect-server
export async function POST(request: NextRequest) {
  try {
    const { event, method } = await request.json();

    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/webhook`;
    const sseUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/connection-events`;

    let testEvent;
    let sseEvent;

    switch (event) {
      case 'qrcode':
        testEvent = {
          event: 'qrcode',
          data: {
            qrcode: 'data:image/png;base64,test-qr-code-' + Date.now(),
            session: 'jurfis'
          }
        };
        sseEvent = {
          type: 'qr_code_generated',
          qrCode: testEvent.data.qrcode,
          timestamp: Date.now(),
          source: 'test'
        };
        break;

      case 'authenticated':
        testEvent = {
          event: 'authenticated',
          data: {
            session: 'jurfis',
            status: 'authenticated'
          }
        };
        sseEvent = {
          type: 'authenticated',
          connected: false,
          state: 'AUTHENTICATED',
          timestamp: Date.now(),
          source: 'test'
        };
        break;

      case 'ready':
        testEvent = {
          event: 'ready',
          data: {
            session: 'jurfis',
            status: 'ready'
          }
        };
        sseEvent = {
          type: 'ready',
          connected: true,
          state: 'CONNECTED',
          timestamp: Date.now(),
          source: 'test'
        };
        break;

      case 'disconnected':
        testEvent = {
          event: 'disconnected',
          data: {
            session: 'jurfis',
            status: 'disconnected'
          }
        };
        sseEvent = {
          type: 'disconnected',
          connected: false,
          state: 'DISCONNECTED',
          timestamp: Date.now(),
          source: 'test'
        };
        break;

      case 'session-logged':
        // Simula o evento session-logged que indica sessão conectada
        testEvent = {
          event: 'session-logged',
          data: {
            session: 'jurfis',
            status: true
          }
        };
        sseEvent = {
          type: 'ready',
          connected: true,
          state: 'CONNECTED',
          timestamp: Date.now(),
          source: 'test',
          eventName: 'session-logged'
        };
        break;

      case 'socket-test':
        // Teste específico para eventos Socket.IO
        const socketResults = await testSocketEvents();
        return NextResponse.json({
          success: true,
          socketTestResults: socketResults,
          message: 'Eventos Socket.IO simulados - verifique o console do navegador'
        });

      default:
        return NextResponse.json({
          error: 'Evento não suportado. Use: qrcode, authenticated, ready, disconnected, session-logged, socket-test'
        }, { status: 400 });
    }

    // Decidir qual método usar baseado no parâmetro
    const results: any = { eventSent: testEvent };

    if (method === 'webhook' || !method) {
      // Método tradicional: webhook
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testEvent)
        });
        results.webhookResponse = await webhookResponse.json();
      } catch (error) {
        results.webhookError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    if (method === 'sse' || method === 'both' || !method) {
      // Método novo: SSE direto
      try {
        const sseResponse = await fetch(sseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sseEvent)
        });
        results.sseResponse = await sseResponse.json();
      } catch (error) {
        results.sseError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('Erro ao simular webhook:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Função para testar eventos Socket.IO específicos
async function testSocketEvents() {
  const events = [
    'qrcode', 'authenticated', 'ready', 'disconnected',
    'session-ready', 'session-authenticated', 'session-qrcode',
    'client_ready', 'client_connected', 'session_status',
    'whatsapp-ready', 'browser_open', 'connection.update'
  ];

  // Esta função seria chamada para emitir eventos via Socket.IO
  // Por enquanto, apenas retornamos os eventos que deveríamos testar
  return {
    message: 'Eventos Socket.IO para testar',
    events,
    instruction: 'Verifique o console do navegador para ver se algum destes eventos é capturado'
  };
}

// GET para listar eventos disponíveis
export async function GET() {
  return NextResponse.json({
    info: 'Endpoint para testar webhooks e eventos SSE',
    availableEvents: ['qrcode', 'authenticated', 'ready', 'disconnected', 'session-logged', 'socket-test'],
    methods: ['webhook', 'sse', 'both'],
    usage: {
      basic: 'POST { "event": "authenticated" }',
      withMethod: 'POST { "event": "ready", "method": "sse" }',
      both: 'POST { "event": "qrcode", "method": "both" }',
      sessionLogged: 'POST { "event": "session-logged" }',
      socketTest: 'POST { "event": "socket-test" }'
    },
    examples: [
      { event: 'qrcode', description: 'Simula geração de QR Code' },
      { event: 'authenticated', description: 'Simula autenticação bem-sucedida' },
      { event: 'ready', description: 'Simula sessão pronta e conectada' },
      { event: 'disconnected', description: 'Simula desconexão da sessão' },
      { event: 'session-logged', description: 'Simula evento session-logged com status: true (sessão conectada)' },
      { event: 'socket-test', description: 'Testa captura de eventos Socket.IO' }
    ]
  });
}