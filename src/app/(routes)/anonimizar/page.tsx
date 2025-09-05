'use client'

//importar bibliotecas e funções
import Link from 'next/link';
import PdfViewer from '@/app/(routes)/anonimizar/ui/PdfViewer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import { FileUpload } from '@/app/(routes)/anonimizar/ui/FileUpload';
import { usePdfProcessor } from '@/app/(routes)/anonimizar/hooks/pdf-processor';
import { PageRangeSelector } from '@/app/(routes)/anonimizar/ui/PageRangeSelector';

//função principal
interface SelectionArea {
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number,
  scale: number
};
export default function AnonymizationPage() {

  //definir constantes
  const { pdfInfo, processPdf, reset: resetPdfProcessor } = usePdfProcessor()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [startPage, setStartPage] = useState<number>(1)
  const [endPage, setEndPage] = useState<number>(1)
  const [excludedPages, setExcludedPages] = useState<string>('')
  const [acordaoNumber, setAcordaoNumber] = useState(``)
  const [rvNumber, setRvNumber] = useState(``)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [mergedFile, setMergedFile] = useState<Blob | null>(null)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [selectedAreas, setSelectedAreas] = useState<SelectionArea[]>([])
  const [isAnonymizing, setIsAnonymizing] = useState(false)
  const [ignoreAcordaoMerge, setIgnoreAcordaoMerge] = useState(false)
  const [inputDirectory, setInputDirectory] = useState(() => {
    const defaultDir = process.env.NEXT_PUBLIC_DEFAULT_ACORDAOS_DIRECTORY || `Downloads`;
    if (defaultDir === `Downloads` && typeof window !== `undefined`) {
      if (navigator.userAgent.includes(`Windows`)) return `C:\\Users\\%USERNAME%\\Downloads`
      else return `Downloads`
    };
    return defaultDir
  });

  //funções de gerenciamento de arquivos
  const handleFileSelect = async (file: File) => {
    setResult(null);
    setShowPdfViewer(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    };

    const result = await processPdf(file);
    if (result.isValid && result.totalPages) {
      setSelectedFile(file);
      setEndPage(result.totalPages);
      setResult(`PDF carregado com sucesso: ${result.totalPages} páginas.`);
    } else {
      setSelectedFile(null);
      setEndPage(1);
      setResult(result.error || `Erro ao processar PDF`);
    };
  };
  const handleProcess = async () => {
    if (!selectedFile) return alert(`Por favor, selecione um arquivo.`);
    if (!pdfInfo.isValid || !pdfInfo.totalPages) return alert(`O PDF selecionado não foi processado corretamente. Tente selecionar o arquivo novamente.`);
    if (!ignoreAcordaoMerge && (!acordaoNumber || !rvNumber)) return alert(`Por favor, preencha os campos de Acórdão e RV.`);
    if (startPage <= 0 || endPage <= 0) return alert(`As páginas devem ser números maiores que zero.`);
    if (startPage > endPage) return alert(`A página inicial não pode ser maior que a página final.`);
    if (endPage > pdfInfo.totalPages) return alert(`A página final não pode ser maior que o total de páginas (${pdfInfo.totalPages}).`);

    setIsProcessing(true);
    setProgress(0);

    try {
      let currentStep = 0
      const progressSteps = [
        { step: 10, message: `Preparando arquivo...` },
        { step: 25, message: `Extraindo páginas...` },
        { step: 50, message: `Buscando acórdão...` },
        { step: 75, message: `Mesclando documentos...` },
        { step: 90, message: `Finalizando...` }
      ];
      const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
          setProgress(progressSteps[currentStep].step);
          setResult(progressSteps[currentStep].message);
          currentStep++;
        };
      }, 300);

      const formData = new FormData();
      formData.append(`file`, selectedFile);
      formData.append(`startPage`, startPage.toString());
      formData.append(`endPage`, endPage.toString());
      formData.append(`excludedPages`, excludedPages);
      formData.append(`acordaoNumber`, ignoreAcordaoMerge ? `` : acordaoNumber);
      formData.append(`rvNumber`, ignoreAcordaoMerge ? `` : rvNumber);
      formData.append(`inputDirectory`, inputDirectory);
      formData.append(`ignoreAcordaoMerge`, ignoreAcordaoMerge.toString());

      const response = await fetch(`/api/anonymize/process-pdf`, { method: `POST`, body: formData });
      clearInterval(progressInterval);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setResult(errorData.error || `Erro no processamento do arquivo`);
        setProgress(0);
        return;
      };
      const result = await response.blob();
      setMergedFile(result);

      const url = URL.createObjectURL(result);
      setPdfUrl(url);
      setProgress(100);
      setResult(`PDF processado com sucesso!`);
      setShowPdfViewer(true);
    } catch (error) {
      console.error(`Erro:`, error);
      setResult(`Erro no processamento do arquivo.`);
    } finally {
      setIsProcessing(false);
    };
  };
  const resetToInitialState = () => {
    setShowPdfViewer(false);
    setMergedFile(null);
    setSelectedAreas([]);
    setSelectedFile(null);
    setStartPage(1);
    setEndPage(1);
    setExcludedPages('');
    setAcordaoNumber(``);
    setRvNumber(``);
    setIsProcessing(false);
    setProgress(0);
    setIsAnonymizing(false);
    setIgnoreAcordaoMerge(false);
    resetPdfProcessor();
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    };
    setResult(null);
  };
  const handleSelectionChange = (selections: SelectionArea[]) => {
    setSelectedAreas(selections);
  };
  const convertSelectedAreasToMuPDFFormat = (areas: SelectionArea[]) => {
    return areas.map(area => ({
      page: area.pageNumber,
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height
    }));
  };
  const handleAnonymize = async () => {

    //verificar se existe arquivo e áreas selecionadas
    if (!mergedFile || selectedAreas.length === 0) return alert(`Selecione pelo menos uma área para anonimizar.`);

    setIsAnonymizing(true);
    setProgress(0);

    try {
      //etapa 1: preparar dados
      setProgress(10);
      setResult(`🔒 Preparando arquivo PDF...`);
      const muPDFRedactions = convertSelectedAreasToMuPDFFormat(selectedAreas);

      //etapa 2: preparar FormData
      setProgress(25);
      setResult(`🎯 Convertendo ${selectedAreas.length} áreas selecionadas...`);
      const formData = new FormData();
      formData.append(`pdfFile`, mergedFile, `document.pdf`);
      formData.append(`redactions`, JSON.stringify(muPDFRedactions));
      formData.append(`acordaoNumber`, ignoreAcordaoMerge ? `` : acordaoNumber);
      formData.append(`rvNumber`, ignoreAcordaoMerge ? `` : rvNumber);

      //etapa 3: enviar para API
      setProgress(50);
      setResult(`🛡️ Aplicando anonimização...`);
      const response = await fetch(`/api/anonymize/pymupdf-anonymize`, { method: `POST`, body: formData });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro no processo de anonimização com PyMuPDF`);
      };

      //etapa 4: processar resposta
      setProgress(80);
      setResult(`📄 Finalizando download...`);
      const resultBlob = await response.blob();
      const filename = ignoreAcordaoMerge ? `Documento Selecionado - Anonimizado.pdf` : `Acórdão ${acordaoNumber} RV ${rvNumber} - Anonimizado.pdf`;
      const url = URL.createObjectURL(resultBlob);
      const a = document.createElement(`a`);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
      setResult(`✅ PDF anonimizado! ${selectedAreas.length} áreas foram processadas.`);

    } catch (error) {
      console.error(`Erro na anonimização:`, error);
      const errorMessage = error instanceof Error ? error.message : `Erro na anonimização com PyMuPDF`;
      setResult(`Erro na anonimização: ${errorMessage}`);
      setProgress(0);
    } finally {
      setIsAnonymizing(false);
    };
  };
  const downloadOriginalPdf = () => {
    if (!mergedFile || !pdfUrl) return;
    const a = document.createElement(`a`);
    a.href = pdfUrl;
    a.download = ignoreAcordaoMerge ? `Documento Selecionado.pdf` : `Acórdão ${acordaoNumber} RV ${rvNumber} - Mesclado.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  //retorno da função
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">

        {/* Header - apenas quando não está visualizando PDF */}
        {!showPdfViewer && (
          <div className="flex justify-between items-center mb-6">

            {/* Título à esquerda com link de volta */}
            <div className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
                  ← Voltar ao Menu
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Anonimização de PDFs</h1>
              <p className="text-gray-600 text-sm mt-1">Extração, junção e anonimização de documentos</p>
            </div>

            {/* Configuração de diretório de entrada */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Diretório do Acórdão:</span>
              <Input
                placeholder="Digite o caminho da pasta"
                value={inputDirectory}
                onChange={(e) => setInputDirectory(e.target.value)}
                className="text-sm w-[20rem] h-8"
                title={`Padrão: ${inputDirectory}`}
                autoComplete="off"
              />
            </div>
          </div>
        )}

        {/* Layout responsivo - muda quando PDF é processado */}
        {showPdfViewer ? (

          // Layout com mini menu à esquerda e visualizador à direita
          <div className="flex gap-4 h-[calc(100vh-32px)]">

            {/* Mini menu à esquerda */}
            <div className="w-60 bg-white rounded-lg shadow-sm border p-4 flex-shrink-0 overflow-y-auto">
              <div className="space-y-4">

                {/* Botão para voltar ao menu principal */}
                <Link href="/">
                  <Button
                    variant="outline"
                    className="w-full text-sm cursor-pointer mb-2"
                    size="sm"
                    disabled={isAnonymizing}
                  >
                    ← Menu Principal
                  </Button>
                </Link>

                {/* Botão para voltar */}
                <Button
                  onClick={resetToInitialState}
                  variant="outline"
                  className="w-full text-sm cursor-pointer"
                  size="sm"
                  disabled={isAnonymizing}
                >
                  Novo Processamento
                </Button>

                {/* Resumo do processamento */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-sm mb-2">Documento Processado</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p><strong>Arquivo:</strong> {selectedFile?.name}</p>
                    {!ignoreAcordaoMerge && (
                      <>
                        <p><strong>Acórdão:</strong> {acordaoNumber}</p>
                        <p><strong>RV:</strong> {rvNumber}</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Instruções para anonimização */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Anonimização Interativa</h3>
                  <div className="text-xs text-gray-600 space-y-2">
                    <p>1. Visualize o PDF ao lado</p>
                    <p>2. Clique e arraste para selecionar áreas sensíveis</p>
                    <p>3. As áreas selecionadas serão marcadas em vermelho</p>
                    <p>4. Clique em &quot;Anonimizar&quot; para aplicar tarjas pretas permanentes</p>
                  </div>

                </div>

                {/* Controles de download e anonimização */}
                <div className="space-y-3 border-t pt-4">
                  <Button
                    onClick={downloadOriginalPdf}
                    variant="outline"
                    className="w-full text-sm cursor-pointer"
                    size="sm"
                    disabled={!mergedFile || isAnonymizing}
                  >
                    📄 Baixar PDF Mesclado
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
                    className="w-full text-sm cursor-pointer"
                    size="sm"
                    disabled={!mergedFile || selectedAreas.length === 0 || isAnonymizing}
                  >
                    {isAnonymizing ? '🎯 Anonimizando...' : '🎯 Anonimizar'}
                  </Button>
                </div>

                {/* Resultado */}
                {result && (
                  <div className="border-t pt-4">
                    <div className={`p-3 rounded-md text-xs ${result.includes('Erro') || result.includes('não encontrado') || result.includes('Falha')
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
                  disabled={isAnonymizing}
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
                <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} isProcessing={!pdfInfo.isValid && selectedFile !== null} />
              </div>

              {/* Etapa 2: Configuração */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 ${selectedFile && pdfInfo.isValid ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'} rounded-full flex items-center justify-center text-sm font-semibold`}>2</div>
                    <h3 className={`font-semibold ${selectedFile && pdfInfo.isValid ? 'text-gray-900' : 'text-gray-400'}`}>Configuração</h3>
                  </div>
                  {selectedFile && (
                    <Button
                      onClick={() => {
                        const url = URL.createObjectURL(selectedFile);
                        window.open(url, '_blank');
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2 cursor-pointer"
                    >
                      Ver PDF
                    </Button>
                  )}
                </div>

                {selectedFile && pdfInfo.isValid ? (
                  <div className="space-y-3">
                    <PageRangeSelector
                      startPage={startPage}
                      endPage={endPage}
                      onStartPageChange={setStartPage}
                      onEndPageChange={setEndPage}
                      totalPages={pdfInfo.totalPages}
                      excludedPages={excludedPages}
                      onExcludedPagesChange={setExcludedPages}
                    />

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ignore-acordao"
                        checked={ignoreAcordaoMerge}
                        onCheckedChange={(checked) => setIgnoreAcordaoMerge(checked)}
                      />
                      <Label
                        htmlFor="ignore-acordao"
                        className="text-xs text-gray-600 cursor-pointer"
                      >
                        Ignorar acórdão (apenas documento selecionado)
                      </Label>
                    </div>

                    {!ignoreAcordaoMerge && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="acordao" className="text-xs">Acórdão</Label>
                          <Input
                            id="acordao"
                            placeholder="1234-2024"
                            value={acordaoNumber}
                            onChange={(e) => setAcordaoNumber(e.target.value)}
                            className="text-sm"
                            autoComplete="off"
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
                            autoComplete="off"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    {selectedFile && !pdfInfo.isValid
                      ? 'Processando PDF...'
                      : 'Faça upload de um PDF válido primeiro'
                    }
                  </div>
                )}
              </div>

              {/* Etapa 3: Processamento */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${selectedFile && pdfInfo.isValid && (ignoreAcordaoMerge || (acordaoNumber && rvNumber)) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} rounded-full flex items-center justify-center text-sm font-semibold`}>3</div>
                  <h3 className={`font-semibold ${selectedFile && pdfInfo.isValid && (ignoreAcordaoMerge || (acordaoNumber && rvNumber)) ? 'text-gray-900' : 'text-gray-400'}`}>Processamento</h3>
                </div>

                {selectedFile && pdfInfo.isValid && (ignoreAcordaoMerge || (acordaoNumber && rvNumber)) ? (
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
                      className="w-full text-sm py-2 cursor-pointer"
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
                <div className={`p-3 rounded-md text-sm ${result.includes('Erro') || result.includes('não encontrado') || result.includes('Falha') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                  {result}
                </div>
              </div>
            )}
          </div>

        )}
      </div>
    </div>
  );
};