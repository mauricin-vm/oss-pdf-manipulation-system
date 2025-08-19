'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { FileUpload } from '@/components/FileUpload'
import { PageRangeSelector } from '@/components/PageRangeSelector'

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [startPage, setStartPage] = useState<number>(1)
  const [endPage, setEndPage] = useState<number>(1)
  const [acordaoNumber, setAcordaoNumber] = useState('')
  const [rvNumber, setRvNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setResult(null)
  }

  const handleProcess = async () => {
    if (!selectedFile || !acordaoNumber || !rvNumber) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    if (startPage <= 0 || endPage <= 0) {
      alert('As páginas devem ser números maiores que zero.')
      return
    }

    if (startPage > endPage) {
      alert('A página inicial não pode ser maior que a página final.')
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('startPage', startPage.toString())
      formData.append('endPage', endPage.toString())
      formData.append('acordaoNumber', acordaoNumber)
      formData.append('rvNumber', rvNumber)

      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro no processamento do arquivo')
      }

      const result = await response.blob()
      
      const url = URL.createObjectURL(result)
      const a = document.createElement('a')
      a.href = url
      a.download = `Acordao-${acordaoNumber}-RV-${rvNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setProgress(100)
      setResult('PDF processado e download iniciado com sucesso!')
    } catch (error) {
      console.error('Erro:', error)
      setResult('Erro no processamento do arquivo.')
    } finally {
      setIsProcessing(false)
    }
  }


  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Processamento de PDFs</h1>
          <p className="text-gray-600 mt-2">
            Extraia páginas de votos vencedores e junte com acórdãos completos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upload e Configuração</CardTitle>
            <CardDescription>
              Faça upload do PDF e configure os parâmetros de processamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} />
            
            {selectedFile && (
              <>
                <PageRangeSelector
                  startPage={startPage}
                  endPage={endPage}
                  onStartPageChange={setStartPage}
                  onEndPageChange={setEndPage}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="acordao">Número do Acórdão</Label>
                    <Input
                      id="acordao"
                      placeholder="Ex: 1234-2024"
                      value={acordaoNumber}
                      onChange={(e) => setAcordaoNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rv">Número RV</Label>
                    <Input
                      id="rv"
                      placeholder="Ex: 5678-2024"
                      value={rvNumber}
                      onChange={(e) => setRvNumber(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {selectedFile && (
          <Card>
            <CardHeader>
              <CardTitle>Processamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-gray-600 text-center">
                    Processando arquivo...
                  </p>
                </div>
              )}
              
              {result && (
                <div className={`p-3 rounded-md ${
                  result.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                  {result}
                </div>
              )}
              
              <Button 
                onClick={handleProcess} 
                disabled={isProcessing || !selectedFile || !acordaoNumber || !rvNumber}
                className="w-full"
              >
                {isProcessing ? 'Processando...' : 'Processar PDF'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
