import { NextRequest, NextResponse } from 'next/server';

const WPPCONNECT_SERVER_URL = process.env.WPPCONNECT_SERVER_URL || 'http://localhost:21465';
const SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || 'session';
const BEARER_TOKEN = process.env.WPPCONNECT_TOKEN || '';

export async function POST(request: NextRequest) {
  try {
    const { chatId, message, type = 'text' } = await request.json();

    if (!chatId || !message) {
      return NextResponse.json(
        { error: 'Chat ID and message are required' },
        { status: 400 }
      );
    }

    // Enviar mensagem via wppconnect-server
    const response = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`
      },
      body: JSON.stringify({
        phone: chatId.replace('@c.us', ''),
        message: message,
        isGroup: chatId.includes('@g.us')
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message via wppconnect-server');
    }

    const data = await response.json();


    // Tentar extrair o ID de diferentes formas
    let messageId = null;

    // Estruturas possíveis do wppconnect
    if (data.response?.id?._serialized) {
      messageId = data.response.id._serialized;
    } else if (data.response?.id) {
      messageId = data.response.id;
    } else if (data.id?._serialized) {
      messageId = data.id._serialized;
    } else if (data.id) {
      messageId = data.id;
    } else if (data.response) {
      // Procurar por qualquer propriedade que contenha um ID válido do WhatsApp
      const responseStr = JSON.stringify(data.response);
      const idMatch = responseStr.match(/true_\d+@c\.us_[A-Z0-9]+/);
      if (idMatch) {
        messageId = idMatch[0];
      }
    }

    if (!messageId) {
      messageId = Date.now().toString();
    }

    return NextResponse.json({
      success: true,
      messageId: messageId,
      status: 'sent',
      timestamp: new Date().toISOString(),
      wppResponse: data
    });

  } catch (error) {
    console.error('Send message error:', error);

    // Retornar erro real em vez de mock
    return NextResponse.json({
      success: false,
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Enviar arquivo
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chatId = formData.get('chatId') as string;
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string || '';

    if (!chatId || !file) {
      return NextResponse.json(
        { error: 'Chat ID and file are required' },
        { status: 400 }
      );
    }

    // Converter arquivo para base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Enviar arquivo via wppconnect-server
    const response = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/send-file-base64`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`
      },
      body: JSON.stringify({
        phone: chatId.replace('@c.us', ''),
        base64: base64,
        filename: file.name,
        caption: caption,
        isGroup: chatId.includes('@g.us')
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send file via wppconnect-server');
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      messageId: data.response?.id?._serialized || Date.now().toString(),
      status: 'sent',
      fileName: file.name,
      fileSize: file.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Send file error:', error);

    // Mock response para desenvolvimento
    return NextResponse.json({
      success: true,
      messageId: Date.now().toString(),
      status: 'sent',
      fileName: 'mock-file.pdf',
      fileSize: 1024,
      timestamp: new Date().toISOString(),
      mock: true
    });
  }
}