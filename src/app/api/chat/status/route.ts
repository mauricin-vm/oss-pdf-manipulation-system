//importar bibliotecas e funções
import { NextRequest, NextResponse } from 'next/server';

//definir variáveis de ambiente
const WPPCONNECT_SERVER_URL = process.env.WPPCONNECT_SERVER_URL || `http://localhost:21465`;
const SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || `jurfis`;
const BEARER_TOKEN = process.env.WPPCONNECT_TOKEN || ``;

//função de GET (checar status da instância)
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/check-connection-session`, { method: `GET`, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BEARER_TOKEN}` } });
    if (!response.ok) return NextResponse.json({ success: false, connected: false, status: `error`, error: `Falha ao verificar status: ${response.statusText}` }, { status: response.status });

    const data = await response.json();
    const isConnected = data.status === `CONNECTED` || data.status === true;
    return NextResponse.json({ success: true, connected: isConnected, status: isConnected ? `connected` : (data.status || `unknown`), session: SESSION_NAME });
  } catch (error) {
    console.error(`Erro ao verificar status:`, error);
    return NextResponse.json({ success: false, connected: false, status: `error`, error: `Falha ao conectar ao servidor do WhatsApp!`, details: error instanceof Error ? error.message : `Erro desconhecido.` }, { status: 500 });
  };
};

//função de POST (iniciar nova sessão)
export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/start-session`, { method: `POST`, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BEARER_TOKEN}` }, body: JSON.stringify({ session: SESSION_NAME, waitQrCode: true }) });
    if (!response.ok) return NextResponse.json({ success: false, error: `Falha ao iniciar sessão: ${response.statusText}` }, { status: response.status });

    const data = await response.json();
    return NextResponse.json({ success: true, session: SESSION_NAME, qrCode: data.qrcode || null, status: data.status || `starting` });
  } catch (error) {
    console.error(`Erro ao iniciar sessão:`, error);
    return NextResponse.json({ success: false, error: `Falha ao iniciar sessão`, details: error instanceof Error ? error.message : `Erro desconhecido.` }, { status: 500 });
  };
};