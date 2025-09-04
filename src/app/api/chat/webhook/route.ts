import { NextRequest, NextResponse } from 'next/server';

// Webhook para receber mensagens em tempo real do wppconnect-server
export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();

    // Processar diferentes tipos de eventos
    switch (webhookData.event) {
      case 'onMessage':
        await handleNewMessage(webhookData);
        break;

      case 'onAck':
        await handleMessageAck(webhookData);
        break;

      case 'onPresenceUpdate':
        await handlePresenceUpdate(webhookData);
        break;

      case 'onStateChange':
        await handleStateChange(webhookData);
        break;

      // Eventos de QR Code e autenticação
      case 'qrcode':
        await handleQRCode(webhookData);
        break;

      case 'authenticated':
        await handleAuthenticated(webhookData);
        break;

      case 'ready':
        await handleReady(webhookData);
        break;

      case 'disconnected':
        await handleDisconnected(webhookData);
        break;

      default:

        // Tentar processar eventos com nomes diferentes
        if (webhookData.event?.includes('qr') || webhookData.event?.includes('QR')) {
          await handleQRCode(webhookData);
        } else if (webhookData.event?.includes('auth') || webhookData.event?.includes('Auth')) {
          await handleAuthenticated(webhookData);
        } else if (webhookData.event?.includes('ready') || webhookData.event?.includes('Ready')) {
          await handleReady(webhookData);
        }
    }

    return NextResponse.json({ success: true, received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleNewMessage(data: any) {
  const message = data.data;

  // Formatear mensagem recebida
  const formattedMessage = {
    id: message.id._serialized || message.id,
    chatId: message.from,
    content: message.body || message.caption || '[Mídia]',
    type: message.type === 'image' ? 'image' :
      message.type === 'document' ? 'file' : 'text',
    timestamp: new Date(message.timestamp * 1000).toISOString(),
    fromMe: message.fromMe || false,
    authorId: message.author || message.from,
    mediaUrl: message.mediaUrl || null,
    fileName: message.filename || null
  };

  // Aqui você pode:
  // 1. Salvar no banco de dados
  // 2. Enviar via WebSocket para clientes conectados
  // 3. Processar comandos automatizados
  // 4. Notificar operadores

  // Se for uma mensagem de comando, processar automaticamente
  if (!message.fromMe && message.body?.toLowerCase().startsWith('/')) {
    await processCommand(formattedMessage);
  }
}

async function handleMessageAck(data: any) {
  // Atualizar status da mensagem (enviada, entregue, lida)
  const ackData = data.data;

  // Transmitir ACK via WebSocket para todos os clientes conectados
  try {
    const WPPCONNECT_SERVER_URL = process.env.WPPCONNECT_SERVER_URL || 'http://localhost:21465';
    const SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || 'jurfis';

    // Enviar evento via Socket.IO interno do wppconnect
    await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/send-socket-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: `onack-${SESSION_NAME}`,
        data: {
          id: ackData.id._serialized,
          ack: ackData.ack
        }
      })
    });

  } catch (error) {
    console.error('Error sending ACK event:', error);
  }
}

async function handlePresenceUpdate(data: any) {
  // Atualizar status online/digitando
  const presenceData = data.data;

}

async function handleStateChange(data: any) {
  // Mudança no estado da sessão WhatsApp
  const stateData = data.data;

  // Notificar todos os clientes conectados sobre mudança de estado
  await notifyConnectionStateChange(stateData.state);
}

// Novo handler para eventos de QR Code
async function handleQRCode(data: any) {

  // Broadcast do QR Code para todos os clientes
  const eventData = {
    type: 'qr_code_generated',
    qrCode: data.data?.qrcode || data.qrcode,
    timestamp: Date.now()
  };

  await broadcastEvent(eventData);
}

// Handler para quando WhatsApp é autenticado
async function handleAuthenticated(data: any) {
  const eventData = {
    type: 'authenticated',
    timestamp: Date.now()
  };
  await broadcastEvent(eventData);

  // Também notificar mudança de estado
  await notifyConnectionStateChange('AUTHENTICATED');
}

// Handler para quando a sessão está pronta
async function handleReady(data: any) {

  const eventData = {
    type: 'ready',
    timestamp: Date.now()
  };

  await broadcastEvent(eventData);

  // Também notificar mudança de estado
  await notifyConnectionStateChange('CONNECTED');
}

// Handler para quando desconectado
async function handleDisconnected(data: any) {
  await broadcastEvent({
    type: 'disconnected',
    timestamp: Date.now()
  });

  // Também notificar mudança de estado
  await notifyConnectionStateChange('DISCONNECTED');
}

// Função genérica para broadcast de eventos
async function broadcastEvent(eventData: any) {
  try {

    // Broadcast via SSE endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/connection-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    if (response.ok) {
      const result = await response.json();
    } else {
      throw new Error(`Broadcast failed: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Error broadcasting event:', error);
  }
}

// Função para notificar mudanças de estado para clientes
async function notifyConnectionStateChange(state: string) {
  try {
    // Broadcast via SSE endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/connection-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'connection_state_change',
        state: state,
        connected: state === 'CONNECTED'
      })
    });

    if (response.ok) {
    } else {
      throw new Error(`Broadcast failed: ${response.status}`);
    }

  } catch (error) {
    console.error('Error notifying connection state change:', error);
  }
}

async function processCommand(message: any) {
  const command = message.content.toLowerCase();

  // Comandos automatizados básicos
  const responses: { [key: string]: string } = {
    '/help': 'Comandos disponíveis:\n/help - Ajuda\n/status - Status do atendimento\n/horario - Horário de funcionamento',
    '/status': 'Sistema de atendimento ativo. Um operador entrará em contato em breve.',
    '/horario': 'Atendimento: Segunda a Sexta, 08:00 às 18:00'
  };

  if (responses[command]) {
    // Enviar resposta automática
    await fetch('/api/chat/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: message.chatId,
        message: responses[command]
      })
    });
  }
}

// GET endpoint para verificar webhook
export async function GET() {
  return NextResponse.json({
    success: true,
    webhook: 'active',
    timestamp: new Date().toISOString(),
    info: 'Webhook está funcionando e pronto para receber eventos do wppconnect-server',
    supportedEvents: ['qrcode', 'authenticated', 'ready', 'disconnected', 'onMessage', 'onAck', 'onPresenceUpdate', 'onStateChange']
  });
}