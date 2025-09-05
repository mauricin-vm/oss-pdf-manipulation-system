//importar bibliotecas e funções
import { PDFDocument } from 'pdf-lib';

//definir classe
export class PDFService {
  private parseExcludedPages(excludedPagesStr: string): number[] {
    if (!excludedPagesStr.trim()) return [];
    
    const excluded: number[] = [];
    const parts = excludedPagesStr.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            excluded.push(i);
          }
        }
      } else {
        const num = parseInt(trimmed);
        if (!isNaN(num)) {
          excluded.push(num);
        }
      }
    }
    
    return [...new Set(excluded)].sort((a, b) => a - b);
  }

  async extractPages(pdfBuffer: Buffer, startPage: number, endPage: number): Promise<Buffer> {
    return this.extractPagesWithExclusions(pdfBuffer, startPage, endPage, '');
  }

  async extractPagesWithExclusions(pdfBuffer: Buffer, startPage: number, endPage: number, excludedPagesStr: string = ''): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const newPdf = await PDFDocument.create();
      const totalPages = pdfDoc.getPageCount();
      const startIndex = startPage - 1;
      const endIndex = endPage - 1;
      
      if (startIndex < 0) throw new Error(`Página inicial ${startPage} é inválida. Deve ser >= 1!`);
      if (endIndex >= totalPages) throw new Error(`Página final ${endPage} é inválida. O documento tem apenas ${totalPages} páginas!`);
      if (startIndex > endIndex) throw new Error(`Página inicial (${startPage}) não pode ser maior que página final (${endPage})!`);
      
      const excludedPages = this.parseExcludedPages(excludedPagesStr);
      const pagesToInclude: number[] = [];
      
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        if (!excludedPages.includes(pageNum)) {
          pagesToInclude.push(pageNum - 1); // Convert to 0-based index
        }
      }
      
      if (pagesToInclude.length === 0) {
        throw new Error(`Nenhuma página será incluída após aplicar as exclusões.`);
      }
      
      const pages = await newPdf.copyPages(pdfDoc, pagesToInclude);
      pages.forEach((page) => newPdf.addPage(page));
      return Buffer.from(await newPdf.save());
    } catch (error) {
      console.error(`Erro ao extrair páginas:`, error);
      throw new Error(`Falha na extração de páginas do PDF`);
    };
  };

  async mergePdfs(acordaoBuffer: Buffer, votoVencedorBuffer: Buffer): Promise<Buffer> {
    try {
      const mergedPdf = await PDFDocument.create();
      const acordaoPdf = await PDFDocument.load(acordaoBuffer);
      const acordaoPages = await mergedPdf.copyPages(acordaoPdf, acordaoPdf.getPageIndices());
      acordaoPages.forEach((page) => mergedPdf.addPage(page));
      const votoPdf = await PDFDocument.load(votoVencedorBuffer);
      const votoPages = await mergedPdf.copyPages(votoPdf, votoPdf.getPageIndices());
      votoPages.forEach((page) => mergedPdf.addPage(page));
      return Buffer.from(await mergedPdf.save());
    } catch (error) {
      console.error(`Erro ao mesclar PDFs:`, error);
      throw new Error(`Falha na mesclagem dos arquivos PDF`);
    };
  };
};