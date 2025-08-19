'use client'

import { useState, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Configurar worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface SelectionArea {
  id: string
  x: number
  y: number
  width: number
  height: number
  pageNumber: number
  scale: number // Adicionar escala para cálculos precisos
}

interface PdfViewerProps {
  pdfUrl: string
  onSelectionChange: (selections: SelectionArea[]) => void
}

export default function PdfViewer({ pdfUrl, onSelectionChange }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selections, setSelections] = useState<SelectionArea[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null)
  const [currentSelection, setCurrentSelection] = useState<{ x: number, y: number, width: number, height: number } | null>(null)
  const [scale, setScale] = useState<number>(1.0)
  const [pageSize, setPageSize] = useState<{ width: number, height: number } | null>(null)
  
  const pageRef = useRef<HTMLDivElement>(null)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }

  const onPageLoadSuccess = (page: any) => {
    // Armazenar o tamanho real da página para cálculos de coordenadas
    setPageSize({
      width: page.originalWidth,
      height: page.originalHeight
    })
  }

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!pageRef.current || !pageSize) return
    
    const rect = pageRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    setIsSelecting(true)
    setSelectionStart({ x, y })
    setCurrentSelection({ x, y, width: 0, height: 0 })
  }, [pageSize])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !pageRef.current) return
    
    const rect = pageRef.current.getBoundingClientRect()
    const currentX = event.clientX - rect.left
    const currentY = event.clientY - rect.top
    
    const width = currentX - selectionStart.x
    const height = currentY - selectionStart.y
    
    setCurrentSelection({
      x: width >= 0 ? selectionStart.x : currentX,
      y: height >= 0 ? selectionStart.y : currentY,
      width: Math.abs(width),
      height: Math.abs(height)
    })
  }, [isSelecting, selectionStart])

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !currentSelection || !pageRef.current || !pageSize) return
    
    // Só adicionar se a seleção tiver tamanho mínimo
    if (currentSelection.width > 10 && currentSelection.height > 10) {
      // Converter coordenadas do visualizador para coordenadas do PDF real
      const realX = (currentSelection.x / scale)
      const realY = (currentSelection.y / scale)
      const realWidth = (currentSelection.width / scale)
      const realHeight = (currentSelection.height / scale)
      
      const newSelection: SelectionArea = {
        id: `selection-${Date.now()}-${Math.random()}`,
        x: realX,
        y: realY,
        width: realWidth,
        height: realHeight,
        pageNumber: currentPage,
        scale: scale // Armazenar a escala usada
      }
      
      const updatedSelections = [...selections, newSelection]
      setSelections(updatedSelections)
      onSelectionChange(updatedSelections)
    }
    
    setIsSelecting(false)
    setSelectionStart(null)
    setCurrentSelection(null)
  }, [isSelecting, currentSelection, selections, currentPage, onSelectionChange, scale, pageSize])

  const clearSelections = () => {
    setSelections([])
    onSelectionChange([])
  }

  const removeSelection = (id: string) => {
    const updatedSelections = selections.filter(s => s.id !== id)
    setSelections(updatedSelections)
    onSelectionChange(updatedSelections)
  }

  const handleZoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0))
  }

  const handleZoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5))
  }

  const resetZoom = () => {
    setScale(1.0)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Controles de navegação e zoom */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 text-sm"
          >
            ← Anterior
          </button>
          
          <span className="text-sm font-medium">
            Página {currentPage} de {numPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 text-sm"
          >
            Próxima →
          </button>
        </div>

        {/* Controles de zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="px-2 py-1 bg-gray-500 text-white rounded text-sm disabled:bg-gray-300"
          >
            🔍-
          </button>
          
          <span className="text-xs font-medium min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="px-2 py-1 bg-gray-500 text-white rounded text-sm disabled:bg-gray-300"
          >
            🔍+
          </button>
          
          <button
            onClick={resetZoom}
            className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
          >
            100%
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">
            {selections.filter(s => s.pageNumber === currentPage).length} seleções nesta página
          </span>
          
          <button
            onClick={clearSelections}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm"
          >
            Limpar Todas
          </button>
        </div>
      </div>

      {/* Visualizador do PDF */}
      <div className="flex-1 overflow-auto">
        <div className="flex justify-center p-4">
          <div 
            ref={pageRef}
            className="relative cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              className="shadow-lg"
            >
              <Page 
                pageNumber={currentPage}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onLoadSuccess={onPageLoadSuccess}
              />
            </Document>
            
            {/* Renderizar seleções da página atual */}
            {selections
              .filter(selection => selection.pageNumber === currentPage)
              .map(selection => (
                <div
                  key={selection.id}
                  className="absolute border-2 border-red-500 bg-red-200 bg-opacity-30 cursor-pointer group"
                  style={{
                    left: selection.x * scale,
                    top: selection.y * scale,
                    width: selection.width * scale,
                    height: selection.height * scale,
                  }}
                  onClick={() => removeSelection(selection.id)}
                >
                  <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    Clique para remover
                  </div>
                </div>
              ))}
            
            {/* Renderizar seleção atual (enquanto arrasta) */}
            {currentSelection && isSelecting && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
                style={{
                  left: currentSelection.x,
                  top: currentSelection.y,
                  width: currentSelection.width,
                  height: currentSelection.height,
                }}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Lista de seleções */}
      {selections.length > 0 && (
        <div className="border-t bg-gray-50 p-4">
          <h4 className="text-sm font-medium mb-2">Áreas Selecionadas ({selections.length})</h4>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {selections.map(selection => (
              <div 
                key={selection.id} 
                className="flex items-center justify-between bg-white p-2 rounded text-xs"
              >
                <span>
                  Página {selection.pageNumber}: {Math.round(selection.width)}×{Math.round(selection.height)}px
                </span>
                <button
                  onClick={() => removeSelection(selection.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}