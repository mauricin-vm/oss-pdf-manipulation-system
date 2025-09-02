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
    const chatId = searchParams.get(`chatId`);
    if (!chatId) return NextResponse.json({ success: false, error: `ID da conversa não informado!` }, { status: 400 });

    const response = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/chat-is-online/${chatId}`, { method: `GET`, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BEARER_TOKEN}` } });
    if (!response.ok) return NextResponse.json({ success: false, error: `Falha ao verificar se o contato está online: ${response.statusText}` }, { status: response.status });

    const data = await response.json();
    return NextResponse.json({ success: true, isOnline: data.response.isOnline || false });
  } catch (error) {
    console.error(`Erro ao verificar se o contato está online:`, error);
    return NextResponse.json({ success: false, error: `Falha ao verificar se o contato está online`, details: error instanceof Error ? error.message : `Erro desconhecido.` }, { status: 500 });
  };
};