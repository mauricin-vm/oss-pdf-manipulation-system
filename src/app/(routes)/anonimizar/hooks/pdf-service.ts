//importar bibliotecas e funções
import { PDFDocument } from 'pdf-lib';

//definir classe
export class PDFService {
  async extractPages(pdfBuffer: Buffer, startPage: number, endPage: number): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const newPdf = await PDFDocument.create();
      const totalPages = pdfDoc.getPageCount();
      const startIndex = startPage - 1;
      const endIndex = endPage - 1;
      if (startIndex < 0) throw new Error(`Página inicial ${startPage} é inválida. Deve ser >= 1!`);
      if (endIndex >= totalPages) throw new Error(`Página final ${endPage} é inválida. O documento tem apenas ${totalPages} páginas!`);
      if (startIndex > endIndex) throw new Error(`Página inicial (${startPage}) não pode ser maior que página final (${endPage})!`);
      const pages = await newPdf.copyPages(pdfDoc, Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i));
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