'use client'

//importar bibliotecas e funções
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

//função principal
interface QRCodeDisplayProps {
  qrCode: string | null,
  onGenerateNew: () => void
};
export function QRCodeDisplay({ qrCode, onGenerateNew }: QRCodeDisplayProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Conectar WhatsApp</h1>
          <p className="text-gray-600 text-sm">Escaneie o QR Code com seu WhatsApp</p>
        </div>

        <div className="flex justify-center mb-6">
          {qrCode ? (
            <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64 border rounded-lg" />
          ) : (
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border">
              <span className="text-gray-500">Gerando QR Code...</span>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-600 mb-4">
          <p>1. Abra o WhatsApp no seu celular</p>
          <p>2. Vá em Menu → Dispositivos conectados</p>
          <p>3. Toque em "Conectar um dispositivo"</p>
          <p>4. Aponte a câmera para este código</p>
          <p>5. Atualize a página após 20 segundos</p>
        </div>

        <Button onClick={onGenerateNew} className="w-full cursor-pointer mb-2">
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