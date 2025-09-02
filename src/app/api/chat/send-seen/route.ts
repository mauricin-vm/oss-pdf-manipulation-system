//importar bibliotecas e funções
import { NextRequest, NextResponse } from 'next/server';

//definir variáveis de ambiente
const WPPCONNECT_SERVER_URL = process.env.WPPCONNECT_SERVER_URL || `http://localhost:21465`;
const SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || `jurfis`;
const BEARER_TOKEN = process.env.WPPCONNECT_TOKEN || ``;

//função de POST (marcar conversa como visualizada)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json({ success: false, error: `chatId é obrigatório` }, { status: 400 });
    }

    // Fazer requisição para o servidor wppconnect
    const response = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/send-seen`, {
      method: `POST`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BEARER_TOKEN}`
      },
      body: JSON.stringify({ phone: chatId })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ Erro ao marcar conversa como visualizada:`, errorData);
      throw new Error(`Falha ao marcar conversa como visualizada no servidor wppconnect!`);
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.response,
      chatId
    });
  } catch (error) {
    console.error(`❌ Erro ao marcar conversa como visualizada:`, error);
    return NextResponse.json({
      success: false,
      error: `Falha ao marcar conversa como visualizada`,
      details: error instanceof Error ? error.message : `Erro desconhecido.`
    }, { status: 500 });
  }
}