'use client'

//importar bibliotecas e funções
import Link from 'next/link'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'

//função principal
interface PdfFile {
  id: string,
  file: File,
  name: string,
  size: number,
  pages?: number
};
interface MergeOptions {
  maxSizePerFile: number,
  enableSizeLimit: boolean,
  fileName: string
};
export default function MergePdfPage() {

  //definir constantes
  const [selectedFiles, setSelectedFiles] = useState<PdfFile[]>([])
  const [mergeOptions, setMergeOptions] = useState<MergeOptions>({ maxSizePerFile: 50, enableSizeLimit: false, fileName: `PDF_Mesclado` })
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [mergedFiles, setMergedFiles] = useState<Blob[]>([])
  const [showOrganizer, setShowOrganizer] = useState(false)
  const [draggedFile, setDraggedFile] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  //funções de gerenciamento de arquivos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
  };
  const addFiles = async (files: File[]) => {
    const pdfFiles = files.filter(file => file.type === `application/pdf`);
    if (pdfFiles.length === 0) return;
    setIsLoadingFiles(true);

    try {
      const newPdfFiles: PdfFile[] = await Promise.all(
        pdfFiles.map(async (file, index) => {
          try {
            const { getDocument } = await import(`pdfjs-dist`);
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await getDocument({ data: arrayBuffer }).promise;
            const pages = pdf.numPages;
            return { id: `${Date.now()}-${index}`, file, name: file.name, size: file.size, pages };
          } catch (error) {
            console.warn(`Erro ao detectar páginas do ${file.name}:`, error)
            return { id: `${Date.now()}-${index}`, file, name: file.name, size: file.size };
          };
        })
      );

      setSelectedFiles(prev => [...prev, ...newPdfFiles]);
      setTimeout(() => {
        setIsLoadingFiles(false);
        setShowOrganizer(true);
      }, 800);

    } catch (error) {
      console.error(`Erro ao processar arquivos:`, error);
      setIsLoadingFiles(false);
    };
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };
  const removeFile = (id: string) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter(file => file.id !== id);
      if (newFiles.length === 0) setShowOrganizer(false);
      return newFiles;
    });
  };
  const moveFile = (fromIndex: number, toIndex: number) => {
    const newFiles = [...selectedFiles];
    const [movedFile] = newFiles.splice(fromIndex, 1);
    newFiles.splice(toIndex, 0, movedFile);
    setSelectedFiles(newFiles);
  };
  const handleCardDragStart = (e: React.DragEvent, fileId: string) => {
    setDraggedFile(fileId);
    e.dataTransfer.effectAllowed = `move`;
  };
  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = `move`;
    setDragOverIndex(index);
  };
  const handleCardDragLeave = () => {
    setDragOverIndex(null);
  };
  const handleCardDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedFile) return;
    const dragIndex = selectedFiles.findIndex(file => file.id === draggedFile);
    if (dragIndex !== -1 && dragIndex !== dropIndex) moveFile(dragIndex, dropIndex);
    setDraggedFile(null);
    setDragOverIndex(null);
  };
  const addMoreFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ``;
      fileInputRef.current.click();
    };
  };
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return `0 Bytes`;
    const k = 1024;
    const sizes = [`Bytes`, `KB`, `MB`, `GB`];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ` ` + sizes[i];
  };
  const handleMerge = async () => {
    if (selectedFiles.length === 0) {
      alert(`Selecione pelo menos um arquivo PDF`);
      return;
    };

    setIsProcessing(true);
    setProgress(0);
    setResult(`Iniciando mesclagem...`);

    try {
      // Progresso: Preparação (0-10%)
      setProgress(5);
      const formData = new FormData();
      selectedFiles.forEach((pdfFile, index) => {
        formData.append(`files`, pdfFile.file);
        formData.append(`fileOrder`, index.toString());
      });
      formData.append(`maxSizePerFile`, mergeOptions.enableSizeLimit ? (mergeOptions.maxSizePerFile * 1024 * 1024).toString() : `0`);

      // Progresso: Enviando arquivos (10-20%)
      setProgress(10);
      setResult(`Enviando arquivos para processamento...`);
      const response = await fetch(`/api/merge/merge-pdfs`, { method: `POST`, body: formData });

      // Progresso: Processamento concluído (20-80%)
      setProgress(80);
      setResult(`Processando mesclagem...`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro no processamento`);
      };

      // Progresso: Finalizando (80-95%)
      setProgress(90);
      setResult(`Finalizando mesclagem...`);

      const contentType = response.headers.get(`content-type`);
      if (contentType?.includes(`application/json`)) {
        const data = await response.json();
        if (data.files && Array.isArray(data.files)) {
          setResult(`Mesclagem concluída! ${data.files.length} arquivo(s) gerado(s).`);
          setMergedFiles(data.files.map((fileData: string) => new Blob([Uint8Array.from(atob(fileData), c => c.charCodeAt(0))], { type: `application/pdf` })));
        };
      } else {
        const blob = await response.blob();
        setResult(`Mesclagem concluída! 1 arquivo gerado.`);
        setMergedFiles([blob]);
      };

      // Progresso: Concluído (100%)
      setProgress(100);
    } catch (error) {
      console.error(`Erro na mesclagem:`, error);
      setResult(`Erro: ${error instanceof Error ? error.message : `Falha na mesclagem`}`);
    } finally {
      setIsProcessing(false);
    };
  };
  const downloadMergedFiles = () => {
    mergedFiles.forEach((blob, index) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement(`a`);
      a.href = url;
      a.download = `${mergeOptions.fileName}_${index + 1}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };
  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  //retorno da função
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/"
              className={`text-sm ${isProcessing ? 'text-gray-400 pointer-events-none cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
            >
              ← Voltar ao Menu
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mesclar PDFs</h1>
          <p className="text-gray-600 text-sm mt-1">Combine múltiplos arquivos PDF</p>
        </div>

        {!showOrganizer && !isLoadingFiles ? (
          // Tela de seleção inicial
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold mb-2">Selecionar Arquivos PDF</h2>
              <p className="text-gray-600 text-sm">Escolha os arquivos que deseja mesclar</p>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleAreaClick}
            >
              <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-lg font-medium mb-2">Adicionar Arquivos PDF</h3>
                <p className="text-gray-600">
                  Arraste arquivos PDF aqui ou clique para selecionar
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        ) : isLoadingFiles ? (
          // Tela de loading
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium mb-2">Processando arquivos...</h3>
              <p className="text-gray-600 text-sm">Carregando informações dos PDFs selecionados</p>
            </div>
          </div>
        ) : (
          // Tela de organização dos arquivos
          <div className="flex gap-6" style={{ height: 'calc(100vh - 160px)' }}>
            {/* Área principal - Cards dos PDFs */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border p-6 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-xl font-semibold">Organizar Arquivos PDF</h2>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="add-more-files"
                  />
                  <Button onClick={addMoreFiles} variant="outline" className="cursor-pointer">
                    + Adicionar PDF
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                  {selectedFiles.map((file, index) => (
                    <Card
                      key={file.id}
                      draggable
                      onDragStart={(e) => handleCardDragStart(e, file.id)}
                      onDragOver={(e) => handleCardDragOver(e, index)}
                      onDragLeave={handleCardDragLeave}
                      onDrop={(e) => handleCardDrop(e, index)}
                      className={`cursor-move transition-all duration-200 h-auto ${draggedFile === file.id ? 'opacity-50 scale-95' : ''
                        } ${dragOverIndex === index ? 'ring-2 ring-blue-500 scale-105' : ''
                        } hover:shadow-md`}
                    >
                      <CardContent className="p-2 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-1 flex-shrink-0">
                          <div className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                            #{index + 1}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="h-4 w-4 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            ×
                          </Button>
                        </div>
                        <div className="flex-1 min-h-0">
                          <h4 className="font-medium text-xs leading-tight mb-1 line-clamp-2" title={file.name}>
                            {file.name}
                          </h4>
                          <div className="text-xs text-gray-500">
                            <p>{formatFileSize(file.size)}</p>
                            {file.pages && <p>{file.pages} páginas</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Configurações e Controles */}
            <div className="w-80 bg-white rounded-lg shadow-sm border p-6 flex flex-col overflow-hidden min-h-0">
              <div className="flex-1 space-y-4 overflow-y-auto min-h-0">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Configurações</h3>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="enable-size-limit"
                          checked={mergeOptions.enableSizeLimit}
                          onCheckedChange={(checked) => setMergeOptions(prev => ({
                            ...prev,
                            enableSizeLimit: checked as boolean
                          }))}
                        />
                        <Label htmlFor="enable-size-limit" className="text-sm cursor-pointer">
                          Limitar tamanho por arquivo
                        </Label>
                      </div>

                      {mergeOptions.enableSizeLimit && (
                        <div className="space-y-2">
                          <Label htmlFor="max-size" className="text-sm">
                            Tamanho máximo (MB)
                          </Label>
                          <Input
                            id="max-size"
                            type="number"
                            min="1"
                            max="500"
                            value={mergeOptions.maxSizePerFile}
                            onChange={(e) => setMergeOptions(prev => ({
                              ...prev,
                              maxSizePerFile: parseInt(e.target.value) || 50
                            }))}
                            className="text-sm"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file-name" className="text-sm">
                        Nome do PDF
                      </Label>
                      <Input
                        id="file-name"
                        type="text"
                        placeholder="PDF_Mesclado"
                        value={mergeOptions.fileName}
                        onChange={(e) => setMergeOptions(prev => ({
                          ...prev,
                          fileName: e.target.value || 'PDF_Mesclado'
                        }))}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Os arquivos serão nomeados como: {mergeOptions.fileName}_1.pdf, {mergeOptions.fileName}_2.pdf, etc.
                      </p>
                    </div>

                    <div className="pt-2 border-t">
                      <h4 className="text-sm font-medium mb-2">Resumo</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>Arquivos: {selectedFiles.length}</p>
                        <p>Tamanho total: {formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))}</p>
                        <p>Páginas totais: {selectedFiles.reduce((sum, file) => sum + (file.pages || 0), 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 mb-4">
                    💡 Arraste os cards para reorganizar a ordem dos arquivos
                  </p>
                </div>
              </div>

              {/* Controles de Processamento */}
              <div className="space-y-4 border-t pt-4 flex-shrink-0">
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
                  onClick={handleMerge}
                  disabled={isProcessing || selectedFiles.length === 0}
                  className="w-full cursor-pointer"
                  size="sm"
                >
                  {isProcessing ? 'Mesclando...' : 'Mesclar'}
                </Button>

                {mergedFiles.length > 0 && (
                  <Button
                    onClick={downloadMergedFiles}
                    disabled={isProcessing}
                    variant="outline"
                    className="w-full cursor-pointer"
                    size="sm"
                  >
                    Baixar
                  </Button>
                )}

                <Button
                  onClick={() => setShowOrganizer(false)}
                  disabled={isProcessing}
                  variant="outline"
                  className="w-full cursor-pointer"
                  size="sm"
                >
                  ← Voltar à Seleção
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};