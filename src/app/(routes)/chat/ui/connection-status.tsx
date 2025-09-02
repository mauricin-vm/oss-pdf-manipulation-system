'use client'

//importar bibliotecas e funções
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

//definir interface
interface ConnectionState {
  isConnected: boolean,
  status: `checking` | `connected` | `disconnected` | `error` | `qr_required`,
  session?: string
};
interface ConnectionStatusProps {
  connectionState: ConnectionState,
  onRetry: () => void
};

//função principal
export function ConnectionStatus({ connectionState, onRetry }: ConnectionStatusProps) {

  //visualização de carregamento
  if (connectionState.status === `checking`) return (
    <div className="h-screen bg-white flex">
      <div className="w-96 bg-gray-50 border-r flex flex-col">
        <div className="p-4 bg-gray-50">
          <div className="text-center text-gray-500 py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm">Conectando...</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚡</span>
          </div>
          <h2 className="text-xl font-medium mb-2">Verificando conexão</h2>
          <p className="text-sm">Aguarde um momento...</p>
        </div>
      </div>
    </div>
  );

  //visualização de erro
  if (connectionState.status === `error`) return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erro de Conexão</h1>
          <p className="text-gray-600 text-sm">Não foi possível conectar com o wppconnect-server</p>
        </div>

        <Button onClick={onRetry} className="w-full cursor-pointer mb-2">
          Tentar Novamente
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

  //visualização de desconexão
  if (!connectionState.isConnected) return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔄</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conectando</h1>
          <p className="text-gray-600 text-sm">Aguarde enquanto verificamos a conexão...</p>
        </div>
      </div>
    </div>
  );

  //se não houver conexão, retornar null
  return null;
};