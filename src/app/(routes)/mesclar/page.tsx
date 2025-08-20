'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MergePdfPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Voltar ao Menu
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mesclar PDFs</h1>
          <p className="text-gray-600">Combine múltiplos arquivos PDF em um único documento</p>
        </div>

        {/* Card de Em Breve */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🚧</span>
            </div>
            <CardTitle className="text-2xl text-gray-900">Em Desenvolvimento</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              A funcionalidade de mesclagem de PDFs está sendo desenvolvida e estará disponível em breve.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-blue-800 mb-2">Funcionalidades Planejadas:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Upload de múltiplos arquivos PDF</li>
                <li>• Reorganização da ordem dos documentos</li>
                <li>• Visualização prévia dos arquivos</li>
                <li>• Mesclagem em arquivo único</li>
                <li>• Download do documento final</li>
              </ul>
            </div>

            <div className="pt-4">
              <Link href="/">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                  Voltar ao Menu Principal
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}