'use client'

//importar bibliotecas e funções
import { Document, Page, pdfjs } from 'react-pdf';
import { useState, useRef, useCallback } from 'react';

//configurar worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

//função principal
interface PDFPageProxy {
  originalWidth: number,
  originalHeight: number
};
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
interface PdfViewerProps {
  pdfUrl: string,
  onSelectionChange: (selections: SelectionArea[]) => void,
  disabled?: boolean
};
export default function PdfViewer({ pdfUrl, onSelectionChange, disabled = false }: PdfViewerProps) {

  //definir constantes
  const [numPages, setNumPages] = useState<number>(0)
  const [selections, setSelections] = useState<SelectionArea[]>([])
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number, pageNumber: number } | null>(null)
  const [currentSelection, setCurrentSelection] = useState<{ x: number, y: number, width: number, height: number, pageNumber: number } | null>(null)
  const [scale, setScale] = useState<number>(1.0)
  const [pageSizes, setPageSizes] = useState<{ [key: number]: { width: number, height: number } }>({})
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  //definir referências
  const containerRef = useRef<HTMLDivElement>(null)

  //funções de gerenciamento do visualizador
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => setNumPages(numPages);
  const onPageLoadSuccess = (page: PDFPageProxy, pageNumber: number) => {
    setPageSizes(prev => ({
      ...prev,
      [pageNumber]: { width: page.originalWidth, height: page.originalHeight }
    }));
  };
  const setPageRef = (pageNumber: number, ref: HTMLDivElement | null) => {
    pageRefs.current[pageNumber] = ref;
  };

  const handleMouseDown = useCallback((event: React.MouseEvent, pageNumber: number) => {
    const pageRef = pageRefs.current[pageNumber];
    const pageSize = pageSizes[pageNumber];
    if (!pageRef || !pageSize || disabled) return;
    const rect = pageRef.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setIsSelecting(true);
    setSelectionStart({ x, y, pageNumber });
    setCurrentSelection({ x, y, width: 0, height: 0, pageNumber });
  }, [pageSizes, disabled]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isSelecting || !selectionStart) return;
    const pageRef = pageRefs.current[selectionStart.pageNumber];
    if (!pageRef) return;
    const rect = pageRef.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    const width = currentX - selectionStart.x;
    const height = currentY - selectionStart.y;
    setCurrentSelection({
      x: width >= 0 ? selectionStart.x : currentX,
      y: height >= 0 ? selectionStart.y : currentY,
      width: Math.abs(width),
      height: Math.abs(height),
      pageNumber: selectionStart.pageNumber
    });
  }, [isSelecting, selectionStart]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !currentSelection) return;
    const pageSize = pageSizes[currentSelection.pageNumber];
    if (!pageSize) return;
    if (currentSelection.width > 5 && currentSelection.height > 5) {
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
        pageNumber: currentSelection.pageNumber,
        pageWidth: pageSize.width,
        pageHeight: pageSize.height,
        scale: scale
      };
      const updatedSelections = [...selections, newSelection];
      setSelections(updatedSelections);
      onSelectionChange(updatedSelections);
    };
    setIsSelecting(false);
    setSelectionStart(null);
    setCurrentSelection(null);
  }, [isSelecting, currentSelection, selections, onSelectionChange, scale, pageSizes]);

  const clearSelections = () => {
    setSelections([]);
    onSelectionChange([]);
  };
  const removeSelection = (id: string) => {
    const updatedSelections = selections.filter(s => s.id !== id);
    setSelections(updatedSelections);
    onSelectionChange(updatedSelections);
  };
  const handleZoomIn = () => setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  const handleZoomOut = () => setScale(prevScale => Math.max(prevScale - 0.2, 0.5));

  //retorno da função
  return (
    <div className="h-full flex flex-col">

      {/* Controles de zoom */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">

        {/* Controles de zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5 || disabled}
            className="w-8 h-8 bg-gray-900 text-white rounded text-sm disabled:bg-gray-300 flex items-center justify-center cursor-pointer"
          >
            -
          </button>

          <span className="text-xs font-medium text-center">
            {Math.round(scale * 100)}
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0 || disabled}
            className="w-8 h-8 bg-gray-900 text-white rounded text-sm disabled:bg-gray-300 flex items-center justify-center cursor-pointer"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearSelections}
            disabled={disabled}
            className="h-8 px-3 py-1 bg-red-500 text-white rounded text-sm disabled:bg-gray-300 cursor-pointer"
          >
            Limpar Todas
          </button>
        </div>
      </div>

      {/* Visualizador do PDF */}
      <div className="flex-1 overflow-auto" ref={containerRef}>
        <div className="flex flex-col items-center p-4 space-y-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            className="shadow-lg"
          >
            {Array.from(new Array(numPages), (el, index) => {
              const pageNumber = index + 1;
              return (
                <div key={pageNumber} className="mb-4 pb-4 border-b-3 border-dashed border-gray-300 last:border-b-0">
                  <div className="text-center mb-2">
                    <span className="text-sm font-medium bg-gray-900 text-white px-3 py-1 rounded">
                      Página {pageNumber}
                    </span>
                  </div>
                  <div
                    ref={(ref) => setPageRef(pageNumber, ref)}
                    className={`relative ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
                    onMouseDown={(e) => handleMouseDown(e, pageNumber)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      onLoadSuccess={(page) => onPageLoadSuccess(page, pageNumber)}
                    />

                    {/* Renderizar seleções da página */}
                    {selections
                      .filter(selection => selection.pageNumber === pageNumber)
                      .map(selection => (
                        <div
                          key={selection.id}
                          className={`absolute border-2 border-red-500 bg-red-200 bg-opacity-30 group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          style={{
                            left: selection.x * scale,
                            top: selection.y * scale,
                            width: selection.width * scale,
                            height: selection.height * scale,
                          }}
                          onClick={() => !disabled && removeSelection(selection.id)}
                        >
                          <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            Clique para remover
                          </div>
                        </div>
                      ))}

                    {/* Renderizar seleção atual (enquanto arrasta) */}
                    {currentSelection && isSelecting && currentSelection.pageNumber === pageNumber && (
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
              );
            })}
          </Document>
        </div>
      </div>

      {/* Lista de seleções - sempre visível */}
      <div className="border-t bg-gray-50 p-4">
        <h4 className="text-sm font-medium mb-2">Áreas Selecionadas ({selections.length})</h4>
        <div className="max-h-24 overflow-y-auto space-y-1">
          {selections.length > 0 ? (
            selections.map(selection => (
              <div
                key={selection.id}
                className="flex items-center justify-between bg-white p-2 rounded text-xs"
              >
                <span>
                  Página {selection.pageNumber}: {Math.round(selection.width)}×{Math.round(selection.height)}px
                </span>
                <button
                  onClick={() => removeSelection(selection.id)}
                  disabled={disabled}
                  className="text-red-500 hover:text-red-700 cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 italic">
              Nenhuma área selecionada. Clique e arraste no PDF para marcar áreas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};