'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { FileUpload } from '@/components/FileUpload'
import { PageRangeSelector } from '@/components/PageRangeSelector'
import PdfViewer from '@/components/PdfViewer'

interface SelectionArea {
  id: string
  x: number
  y: number
  width: number
  height: number
  pageNumber: number
  scale: number
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [startPage, setStartPage] = useState<number>(1)
  const [endPage, setEndPage] = useState<number>(1)
  const [acordaoNumber, setAcordaoNumber] = useState('')
  const [rvNumber, setRvNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [mergedFile, setMergedFile] = useState<Blob | null>(null)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [selectedAreas, setSelectedAreas] = useState<SelectionArea[]>([])
  const [isAnonymizing, setIsAnonymizing] = useState(false)
  const [pdfTotalPages, setPdfTotalPages] = useState<number | null>(null)

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    setResult(null)
    setShowPdfViewer(false)
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    
    // Detectar número de páginas do PDF para ajustar página final
    try {
      const { getDocument } = await import('pdfjs-dist')
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await getDocument({ data: arrayBuffer }).promise
      const totalPages = pdf.numPages
      setPdfTotalPages(totalPages)
      setEndPage(totalPages) // Definir página final como total de páginas
      console.log(`PDF detectado com ${totalPages} páginas`)
    } catch (error) {
      console.warn('Não foi possível detectar número de páginas:', error)
      setPdfTotalPages(null)
      setEndPage(1) // Fallback para 1 se não conseguir detectar
    }
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
      // Simular progresso durante o processamento
      const progressSteps = [
        { step: 10, message: 'Preparando arquivo...' },
        { step: 25, message: 'Extraindo páginas...' },
        { step: 50, message: 'Buscando acórdão...' },
        { step: 75, message: 'Mesclando documentos...' },
        { step: 90, message: 'Finalizando...' }
      ]

      // Iniciar progresso
      let currentStep = 0
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setProgress(progressSteps[currentStep].step)
          setResult(progressSteps[currentStep].message)
          currentStep++
        }
      }, 300) // Atualizar a cada 300ms

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

      // Parar o progresso simulado
      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro no processamento do arquivo')
      }

      const result = await response.blob()
      setMergedFile(result)

      // Criar URL para visualização
      const url = URL.createObjectURL(result)
      setPdfUrl(url)

      // Também fazer download
      const a = document.createElement('a')
      a.href = url
      a.download = `Acordao-${acordaoNumber}-RV-${rvNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setProgress(100)
      setResult('PDF processado com sucesso!')
      setShowPdfViewer(true)
    } catch (error) {
      console.error('Erro:', error)
      setResult('Erro no processamento do arquivo.')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetToInitialState = () => {
    // Limpar TODOS os dados para novo processamento
    setShowPdfViewer(false)
    setMergedFile(null)
    setSelectedAreas([])
    setSelectedFile(null) // Limpar arquivo selecionado
    setStartPage(1) // Resetar página inicial
    setEndPage(1) // Resetar página final
    setAcordaoNumber('') // Limpar número do acórdão
    setRvNumber('') // Limpar número RV
    setIsProcessing(false) // Garantir que não está processando
    setProgress(0) // Resetar progresso
    setIsAnonymizing(false) // Garantir que não está anonimizando
    setPdfTotalPages(null) // Limpar total de páginas
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    setResult(null)
  }

  const handleSelectionChange = (selections: SelectionArea[]) => {
    setSelectedAreas(selections)
  }

  const handleAnonymize = async () => {
    if (!mergedFile || selectedAreas.length === 0) {
      alert('Selecione pelo menos uma área para anonimizar.')
      return
    }

    setIsAnonymizing(true)
    setProgress(0)

    try {
      // Progresso simulado para anonimização
      const anonSteps = [
        { step: 15, message: '🔒 Carregando PDF...' },
        { step: 30, message: '🎯 Detectando áreas selecionadas...' },
        { step: 50, message: '🛡️ Aplicando anonimização robusta...' },
        { step: 75, message: '🔐 Processando múltiplas camadas...' },
        { step: 90, message: '📄 Gerando PDF final...' }
      ]

      let currentStep = 0
      const anonInterval = setInterval(() => {
        if (currentStep < anonSteps.length) {
          setProgress(anonSteps[currentStep].step)
          setResult(anonSteps[currentStep].message)
          currentStep++
        }
      }, 400) // Um pouco mais lento para anonimização

      const formData = new FormData()
      formData.append('file', mergedFile, 'merged.pdf')
      formData.append('acordaoNumber', acordaoNumber)
      formData.append('rvNumber', rvNumber)
      formData.append('selections', JSON.stringify(selectedAreas))

      const response = await fetch('/api/anonymize-selected-areas', {
        method: 'POST',
        body: formData
      })

      clearInterval(anonInterval)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro no processo de anonimização')
      }

      const result = await response.blob()
      const filename = `Acordao-${acordaoNumber}-RV-${rvNumber}-Anonimizado.pdf`

      const url = URL.createObjectURL(result)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setProgress(100)
      setResult(`✅ PDF anonimizado com sucesso! ${selectedAreas.length} áreas foram anonimizadas.`)
    } catch (error) {
      console.error('Erro na anonimização:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro na anonimização do arquivo'
      setResult(`Erro na anonimização: ${errorMessage}`)
    } finally {
      setIsAnonymizing(false)
    }
  }

  const clearSelections = () => {
    setSelectedAreas([])
  }

  const downloadOriginalPdf = () => {
    if (!mergedFile || !pdfUrl) return
    
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = `Acordao-${acordaoNumber}-RV-${rvNumber}-Original.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">JURFIS - Processamento de PDFs</h1>
          <p className="text-gray-600 text-sm mt-1">Extração, junção e anonimização de documentos</p>
        </div>

        {/* Layout responsivo - muda quando PDF é processado */}
        {showPdfViewer ? (
          // Layout com mini menu à esquerda e visualizador à direita
          <div className="flex gap-4 h-[calc(100vh-120px)]">
            {/* Mini menu à esquerda */}
            <div className="w-80 bg-white rounded-lg shadow-sm border p-4 flex-shrink-0 overflow-y-auto">
              <div className="space-y-4">
                
                {/* Botão para voltar */}
                <Button 
                  onClick={resetToInitialState}
                  variant="outline" 
                  className="w-full text-sm"
                  size="sm"
                >
                  ← Novo Processamento
                </Button>

                {/* Resumo do processamento */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-sm mb-2">Documento Processado</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><strong>Arquivo:</strong> {selectedFile?.name}</p>
                    <p><strong>Acórdão:</strong> {acordaoNumber}</p>
                    <p><strong>RV:</strong> {rvNumber}</p>
                    <p><strong>Páginas:</strong> {startPage} - {endPage}</p>
                  </div>
                </div>

                {/* Instruções para anonimização */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Anonimização Interativa</h3>
                  <div className="text-xs text-gray-600 space-y-2">
                    <p>1. Visualize o PDF ao lado</p>
                    <p>2. Clique e arraste para selecionar áreas sensíveis</p>
                    <p>3. As áreas selecionadas serão marcadas em vermelho</p>
                    <p>4. Clique em "Anonimizar" para aplicar tarjas pretas permanentes</p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded text-xs">
                    <p className="font-medium text-blue-800">Áreas selecionadas: {selectedAreas.length}</p>
                    {selectedAreas.length > 0 && (
                      <p className="text-blue-600 mt-1">
                        Distribuídas em {new Set(selectedAreas.map(a => a.pageNumber)).size} página(s)
                      </p>
                    )}
                  </div>
                </div>

                {/* Controles de download e anonimização */}
                <div className="space-y-3 border-t pt-4">
                  <Button 
                    onClick={downloadOriginalPdf}
                    variant="outline"
                    className="w-full text-sm" 
                    size="sm"
                    disabled={!mergedFile}
                  >
                    📄 Baixar PDF Original
                  </Button>

                  {isAnonymizing && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-3" />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-600">
                          {result || 'Anonimizando...'}
                        </p>
                        <p className="text-xs text-purple-600 font-medium">
                          {progress}%
                        </p>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleAnonymize}
                    className="w-full text-sm" 
                    size="sm"
                    disabled={!mergedFile || selectedAreas.length === 0 || isAnonymizing}
                  >
                    {isAnonymizing ? '🎯 Anonimizando...' : `🎯 Anonimizar ${selectedAreas.length} Área(s)`}
                  </Button>
                </div>

                {/* Resultado */}
                {result && (
                  <div className="border-t pt-4">
                    <div className={`p-3 rounded-md text-xs ${
                      result.includes('Erro') 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {result}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Visualizador de PDF à direita */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
              {pdfUrl ? (
                <PdfViewer 
                  pdfUrl={pdfUrl} 
                  onSelectionChange={handleSelectionChange}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Carregando PDF...
                </div>
              )}
            </div>
          </div>
        ) : (
          // Layout original para processamento inicial
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Etapa 1: Upload */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                  <h3 className="font-semibold text-gray-900">Upload PDF</h3>
                </div>
                <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} />
              </div>

              {/* Etapa 2: Configuração */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${selectedFile ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'} rounded-full flex items-center justify-center text-sm font-semibold`}>2</div>
                  <h3 className={`font-semibold ${selectedFile ? 'text-gray-900' : 'text-gray-400'}`}>Configuração</h3>
                </div>

                {selectedFile ? (
                  <div className="space-y-3">
                    <PageRangeSelector
                      startPage={startPage}
                      endPage={endPage}
                      onStartPageChange={setStartPage}
                      onEndPageChange={setEndPage}
                      totalPages={pdfTotalPages}
                    />

                    <div className="space-y-2">
                      <Label htmlFor="acordao" className="text-xs">Acórdão</Label>
                      <Input
                        id="acordao"
                        placeholder="1234-2024"
                        value={acordaoNumber}
                        onChange={(e) => setAcordaoNumber(e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rv" className="text-xs">RV</Label>
                      <Input
                        id="rv"
                        placeholder="5678-2024"
                        value={rvNumber}
                        onChange={(e) => setRvNumber(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">Faça upload primeiro</div>
                )}
              </div>

              {/* Etapa 3: Processamento */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${selectedFile && acordaoNumber && rvNumber ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} rounded-full flex items-center justify-center text-sm font-semibold`}>3</div>
                  <h3 className={`font-semibold ${selectedFile && acordaoNumber && rvNumber ? 'text-gray-900' : 'text-gray-400'}`}>Processamento</h3>
                </div>

                {selectedFile && acordaoNumber && rvNumber ? (
                  <div className="space-y-2">
                    {isProcessing && (
                      <div className="space-y-2">
                        <Progress value={progress} className="h-3" />
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-600">
                            {result || 'Processando...'}
                          </p>
                          <p className="text-xs text-blue-600 font-medium">
                            {progress}%
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleProcess}
                      disabled={isProcessing}
                      className="w-full text-sm py-2"
                      size="sm"
                    >
                      {isProcessing ? 'Processando...' : 'Mesclar PDF'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">Configure os dados</div>
                )}
              </div>
            </div>

            {/* Resultado */}
            {result && !showPdfViewer && (
              <div className="mt-6 pt-6 border-t">
                <div className={`p-3 rounded-md text-sm ${result.includes('Erro') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                  {result}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}