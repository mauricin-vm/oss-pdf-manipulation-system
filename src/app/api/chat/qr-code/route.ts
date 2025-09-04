//importar bibliotecas e funções
import { NextRequest, NextResponse } from 'next/server';

//definir variáveis de ambiente
const WPPCONNECT_SERVER_URL = process.env.WPPCONNECT_SERVER_URL || `http://localhost:21465`;
const SESSION_NAME = process.env.WHATSAPP_SESSION_NAME || `jurfis`;
const BEARER_TOKEN = process.env.WPPCONNECT_TOKEN || ``;

//função de GET (gerar QR Code)
export async function GET(request: NextRequest) {
  try {
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/chat/webhook`;
    const requestBody = { session: SESSION_NAME, waitQrCode: true, webhook: webhookUrl };
    const response = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/start-session`, {
      method: `POST`,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BEARER_TOKEN}` },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) return NextResponse.json({ success: false, error: `Falha ao gerar QR Code: ${response.statusText}` }, { status: response.status });

    const data = await response.json();
    return NextResponse.json({ success: true, qrCode: data.qrcode || null, status: data.status || `generating`, session: SESSION_NAME });
  } catch (error) {
    console.error(`Erro ao gerar QR Code:`, error);
    return NextResponse.json({ success: false, error: `Falha ao gerar QR Code`, details: error instanceof Error ? error.message : `Erro desconhecido.` }, { status: 500 });
  };
};

//função de POST (checar status da sessão)
export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${WPPCONNECT_SERVER_URL}/api/${SESSION_NAME}/check-connection-session`, { method: `GET`, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${BEARER_TOKEN}` } });
    if (!response.ok) throw new Error(`Falha ao checar status da sessão!`);

    const data = await response.json();
    return NextResponse.json({ success: true, connected: data.connected || false, status: data.status || `disconnected` });
  } catch (error) {
    console.error(`Erro ao checar status da sessão:`, error);
    return NextResponse.json({ success: false, error: `Falha ao checar status da sessão`, details: error instanceof Error ? error.message : `Erro desconhecido.` }, { status: 500 });
  };
};