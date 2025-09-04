'use client'

//importar bibliotecas e funções
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

//função principal
interface QRCodeDisplayProps {
  qrCode: string | null,
  onGenerateNew: () => void,
  connectionState?: {
    status: string;
    sessionState: string | null;
  }
};
export function QRCodeDisplay({ qrCode, onGenerateNew, connectionState }: QRCodeDisplayProps) {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isConnecting, setIsConnecting] = useState(false);

  // Monitorar mudanças no estado de conexão para detectar quando conecta
  useEffect(() => {
    if (connectionState) {
      console.log('🔍 QR Code - Estado de conexão mudou:', connectionState);

      // Se mudou para estados de progresso (PAIRING, OPENING), mostrar feedback
      if (connectionState.sessionState === 'PAIRING') {
        console.log('📱 QR Code lido - conectando...');
        setIsConnecting(true);
      }

      // Se chegou a CONNECTED, a página principal vai redirecionar automaticamente
      // Não precisa fazer nada aqui, apenas manter o feedback visual
      if (connectionState.status === 'connected' || connectionState.sessionState === 'CONNECTED') {
        console.log('✅ WhatsApp conectado! Redirecionando para chat...');
        setIsConnecting(true);
      }
    }
  }, [connectionState]);

  // Sincronizar status do servidor com estado de conexão recebido
  useEffect(() => {
    if (connectionState) {
      if (connectionState.status === 'server_offline') {
        setServerStatus('offline');
      } else if (connectionState.status === 'checking') {
        setServerStatus('checking');
      } else {
        setServerStatus('online');
      }
    }
  }, [connectionState]);
  // Se servidor está offline, mostrar erro com retry manual
  if (serverStatus === 'offline') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Servidor WhatsApp Offline</h1>
            <p className="text-gray-600 text-sm">O servidor wppconnect não está disponível no momento</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm text-center">
              Verifique se o servidor wppconnect-server está rodando na porta 21465 e tente novamente.
            </p>
          </div>

          <Button
            onClick={() => setServerStatus('checking')}
            className="w-full cursor-pointer mb-2"
          >
            Tentar Reconectar
          </Button>

          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="cursor-pointer"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Se verificando servidor, mostrar carregamento
  if (serverStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verificando Servidor</h1>
            <p className="text-gray-600 text-sm">Conectando ao servidor da API...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se está conectando após leitura do QR Code
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Conectando WhatsApp</h1>
            <p className="text-gray-600 text-sm mb-4">QR Code lido! Aguarde enquanto estabelecemos a conexão...</p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <p className="text-green-700 text-sm text-center mt-2">
                Sincronizando com seu WhatsApp...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Servidor online - mostrar QR Code normal
  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conectar WhatsApp</h1>
          <p className="text-gray-600 text-sm">Escaneie o QR Code com seu WhatsApp</p>
        </div>

        <div className="flex justify-center mb-6">
          {qrCode ? (
            <img
              src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
              alt="QR Code WhatsApp"
              className="w-64 h-64 border rounded-lg"
              onError={(e) => {
                console.error('❌ Erro ao carregar QR Code:', e);
              }}
            />
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span className="text-gray-500 text-sm">Gerando QR Code...</span>
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-600 mb-4">
          <p>1. Abra o WhatsApp no seu celular</p>
          <p>2. Vá em Menu → Dispositivos conectados</p>
          <p>3. Toque em "Conectar um dispositivo"</p>
          <p>4. Aponte a câmera para este código</p>
        </div>

        <Button onClick={onGenerateNew} className="w-full cursor-pointer mb-2" disabled={!qrCode}>
          Gerar Novo QR Code
        </Button>

        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="cursor-pointer"
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};