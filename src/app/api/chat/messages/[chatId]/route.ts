//importar bibliotecas e funções
import { NextRequest, NextResponse } from 'next/server';

//definir variáveis de ambiente
const WPPCONNECT_SERVER_URL = process.env.WPPCONNECT_SERVER_URL || `http://localhost:21465`;
const SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || `jurfis`;
const BEARER_TOKEN = process.env.WPPCONNECT_TOKEN || ``;

//função de GET (carregar mensagens)
export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const { chatId } = await params;
    const { searchParams } = new URL(request.url);

    // Parâmetros da nova API
    const count = parseInt(searchParams.get(`count`) || `20`);
    const id = searchParams.get(`id`);
    const fromMe = searchParams.get(`fromMe`) === 'true' ? true : undefined;
    const direction = searchParams.get(`direction`) as 'before' | 'after' || 'before';

    // Construir query params para a nova API
    const queryParams = new URLSearchParams();
    queryParams.append('count', count.toString());
    if (id) queryParams.append('id', id);
    if (fromMe !== undefined) queryParams.append('fromMe', fromMe.toString());
    queryParams.append('direction', direction);

    // Para carregamento inicial (sem id), queremos as mensagens mais recentes
    // Para paginação (com id), queremos mensagens anteriores ao id fornecido

    let response;
    let apiUrl;

    // Se não há ID (carregamento inicial), usar a nova API sem ID para pegar as mais recentes
    // Se há ID (paginação), usar a nova API com ID para pegar mensagens anteriores
    if (!id) {
      // Para carregamento inicial, usar a nova API sem parâmetros extras para pegar as mais recentes
      apiUrl = `${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/get-messages/${chatId}?count=${count}&direction=before`;
    } else {
      // Para paginação, usar todos os parâmetros
      apiUrl = `${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/get-messages/${chatId}?${queryParams.toString()}`;
    }

    response = await fetch(apiUrl, {
      method: `GET`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    });

    if (!response.ok) throw new Error(`Falha ao carregar mensagens do servidor wppconnect!`);

    const data = await response.json();

    const formattedMessages = data.response?.map((message: any) => ({
      id: message.id._serialized || message.id,
      chatId: chatId,
      content: message.body || message.caption || `[Mídia]`,
      type: message.type === `image` ? `image` : message.type === `document` ? `file` : `text`,
      timestamp: message.timestamp || 0, // Manter timestamp original como número
      fromMe: message.fromMe || false,
      status: message.fromMe ? `delivered` : `received`,
      ack: message.ack, // Incluir o ack da mensagem
      authorId: message.author || message.from,
      mediaUrl: message.mediaUrl || null,
      fileName: message.filename || null
    })) || [];

    // Ordenar mensagens por timestamp para garantir ordem cronológica
    // Para carregamento inicial (sem id), ordenar do mais antigo para o mais novo
    // Para paginação, manter a ordem da API
    const sortedMessages = !id
      ? formattedMessages.sort((a: any, b: any) => (a.timestamp || 0) - (b.timestamp || 0))
      : formattedMessages;

    return NextResponse.json({
      success: true,
      messages: sortedMessages,
      totalMessages: sortedMessages.length,
      chatId,
      count,
      hasMore: sortedMessages.length === count, // Indica se há mais mensagens
      lastMessageId: sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].id : null,
      firstMessageId: sortedMessages.length > 0 ? sortedMessages[0].id : null
    });
  } catch (error) {
    console.error(`Erro ao carregar mensagens:`, error);
    return NextResponse.json({ success: false, error: `Falha ao carregar mensagens`, details: error instanceof Error ? error.message : `Erro desconhecido.` }, { status: 500 });
  };
};