//importar bibliotecas e funções
import { NextRequest, NextResponse } from 'next/server';

//definir variáveis de ambiente
const WPPCONNECT_SERVER_URL = process.env.WPPCONNECT_SERVER_URL || `http://localhost:21465`;
const SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || `jurfis`;
const BEARER_TOKEN = process.env.WPPCONNECT_TOKEN || ``;

//função de GET (carregar chats)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get(`page`) || `1`);
    const limit = parseInt(searchParams.get(`limit`) || `20`);

    const response = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/list-chats`, { method: `POST`, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BEARER_TOKEN}` }, body: JSON.stringify({}) });
    if (!response.ok) return NextResponse.json({ success: false, error: `Falha ao carregar chats: ${response.statusText}`, status: response.status }, { status: response.status });
    const data = await response.json();
    const chats = data.response || data || [];
    const formatedResult = await Promise.all(chats.map(async (chat: any) => {
      if (chat.lastReceivedKey) {
        const lastMessage = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/message-by-id/${chat.lastReceivedKey._serialized}`, { method: `GET`, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BEARER_TOKEN}` } });
        if (!lastMessage.ok) return new NextResponse(`Erro ao listar as informações da mensagem (get-message-by-id)!`, { status: 500 });
        const lastMessageData = await lastMessage.json();
        return { ...chat, lastReceivedKey: lastMessageData.response.data };
      };
      return { ...chat, lastReceivedKey: null };
    }));

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedChats = formatedResult.slice(startIndex, endIndex);

    return NextResponse.json({ success: true, chats: paginatedChats, totalChats: formatedResult.length, page, limit, totalPages: Math.ceil(formatedResult.length / limit) });
  } catch (error) {
    console.error(`Erro ao carregar chats:`, error);
    return NextResponse.json({ success: false, error: `Falha ao carregar chats`, details: error instanceof Error ? error.message : `Erro desconhecido.` }, { status: 500 });
  };
};