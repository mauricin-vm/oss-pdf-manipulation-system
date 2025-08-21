//declaração do módulo pdfjs-dist
declare module 'pdfjs-dist/build/pdf' {
  interface PDFJSLib {
    getDocument: (source: string | URL | ArrayBuffer | { data: Uint8Array | ArrayBuffer }) => PDFDocumentLoadingTask;
    GlobalWorkerOptions: {
      workerSrc: string
    };
    version: string
  };

  interface PDFDocumentLoadingTask {
    promise: Promise<PDFDocumentProxy>
  };

  interface PDFDocumentProxy {
    numPages: number,
    getPage: (pageNumber: number) => Promise<PDFPageProxy>
  };

  interface PDFPageProxy {
    getViewport: (options: { scale: number }) => PDFViewport,
    render: (options: { canvasContext: CanvasRenderingContext2D; viewport: PDFViewport }) => { promise: Promise<void> }
  };

  interface PDFViewport {
    width: number,
    height: number
  };

  const pdfjsLib: PDFJSLib;
  export = pdfjsLib;
};