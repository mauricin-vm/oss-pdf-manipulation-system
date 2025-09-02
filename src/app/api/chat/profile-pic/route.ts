//importar bibliotecas e funções
import { NextRequest, NextResponse } from 'next/server';

//definir variáveis de ambiente
const WPPCONNECT_SERVER_URL = process.env.WPPCONNECT_SERVER_URL || `http://localhost:21465`;
const SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || `jurfis`;
const BEARER_TOKEN = process.env.WPPCONNECT_TOKEN || ``;

//função de GET (carregar foto de perfil)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get(`chatId`);
    if (!chatId) return NextResponse.json({ success: false, error: `O identificador do chat é obrigatório!` }, { status: 400 });

    const phone = chatId.split(`@`)[0];
    const response = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/profile-pic/${phone}`, { method: `GET`, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BEARER_TOKEN}` } });
    if (!response || !response.ok) return NextResponse.json({ success: false, error: `Falha ao carregar foto de perfil: ${response.statusText}`, status: response.status }, { status: response.status });

    const data = await response.json();
    return NextResponse.json({ success: true, profilePic: data.response?.img || data.response?.imgFull || data.img || data.imgFull || null, chatId: chatId });
  } catch (error) {
    console.error(`Erro ao carregar foto de perfil:`, error);
    return NextResponse.json({ success: false, error: `Falha ao carregar foto de perfil`, details: error instanceof Error ? error.message : `Erro desconhecido.` }, { status: 500 });
  };
};