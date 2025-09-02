'use client'

//importar bibliotecas e funções
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

//função principal
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">JURFIS - Processamento de PDFs</h1>
          <p className="text-gray-600">Sistema de processamento, mesclagem e anonimização de documentos PDF</p>
        </div>

        {/* Menu de opções */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

          {/* Card Chat de Atendimento */}
          <Link href="/chat">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-200 py-6">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💬</span>
                </div>
                <CardTitle className="text-xl text-gray-900">Chat de Atendimento</CardTitle>
                <CardDescription className="text-gray-600">
                  Sistema de atendimento via WhatsApp com interface completa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>• Integração com WhatsApp</p>
                  <p>• Conversas em tempo real</p>
                  <p>• Envio de arquivos e mensagens</p>
                  <p>• Interface estilo WhatsApp</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card Mesclar PDFs */}
          <Link href="/mesclar">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-green-200 py-6">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📖</span>
                </div>
                <CardTitle className="text-xl text-gray-900">Mesclar PDFs</CardTitle>
                <CardDescription className="text-gray-600">
                  Combine múltiplos arquivos PDF em um único documento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>• Upload de múltiplos PDFs</p>
                  <p>• Reorganização da ordem dos documentos</p>
                  <p>• Limitação de tamanho por arquivo</p>
                  <p>• Mesclagem em arquivo único</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card Anonimização de PDFs */}
          <Link href="/anonimizar">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-200 py-6">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔒</span>
                </div>
                <CardTitle className="text-xl text-gray-900">Anonimização de PDFs</CardTitle>
                <CardDescription className="text-gray-600">
                  Extraia páginas específicas, mescle com acórdãos e anonimize informações sensíveis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>• Upload de PDF e seleção de páginas</p>
                  <p>• Busca e mesclagem automática de acórdãos</p>
                  <p>• Anonimização interativa com seleção de áreas</p>
                  <p>• Download do documento processado</p>
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>
    </div>
  );
};