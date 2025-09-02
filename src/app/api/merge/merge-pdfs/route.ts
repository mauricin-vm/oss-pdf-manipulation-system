//importar bibliotecas e funções
import { PDFDocument } from 'pdf-lib';
import { NextRequest, NextResponse } from 'next/server';

//função principal
interface FileInfo {
  file: File,
  order: number,
  pages?: number,
  size: number
};
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const maxSizePerFileStr = formData.get(`maxSizePerFile`) as string;
    const maxSizePerFile = maxSizePerFileStr ? parseInt(maxSizePerFileStr) : 0;
    const files: FileInfo[] = [];
    const fileOrders: number[] = [];

    formData.getAll(`fileOrder`).forEach((value) => {
      fileOrders.push(parseInt(value as string));
    });

    const fileEntries = formData.getAll(`files`) as File[];
    for (let i = 0; i < fileEntries.length; i++) {
      const file = fileEntries[i];
      if (file && file.type === `application/pdf`) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const pages = pdfDoc.getPageCount();
          files.push({ file, order: fileOrders[i] || i, pages, size: file.size });
        } catch (error) {
          console.warn(`Erro ao processar ${file.name}:`, error);
          files.push({ file, order: fileOrders[i] || i, size: file.size });
        };
      };
    };
    if (files.length === 0) return NextResponse.json({ error: `Nenhum arquivo PDF válido encontrado` }, { status: 400 });
    files.sort((a, b) => a.order - b.order)

    const mergedFiles: Uint8Array[] = [];
    let currentPdf = await PDFDocument.create();

    for (const fileInfo of files) {
      try {
        const arrayBuffer = await fileInfo.file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuffer);
        const pageCount = sourcePdf.getPageCount();
        const pageIndices = Array.from({ length: pageCount }, (_, i) => i);

        if (maxSizePerFile === 0) {
          const pagesToCopy = await currentPdf.copyPages(sourcePdf, pageIndices);
          pagesToCopy.forEach(page => currentPdf.addPage(page));
        } else {
          const tempPdf = await PDFDocument.create();
          const tempPages = await tempPdf.copyPages(sourcePdf, pageIndices);
          tempPages.forEach(page => tempPdf.addPage(page));
          const tempPdfBytes = await tempPdf.save();

          if (currentPdf.getPageCount() > 0) {
            const currentPdfBytes = await currentPdf.save();
            if (currentPdfBytes.length + tempPdfBytes.length > maxSizePerFile) {
              mergedFiles.push(new Uint8Array(currentPdfBytes));
              currentPdf = await PDFDocument.create();
            };
          };
          const pagesToAdd = await currentPdf.copyPages(sourcePdf, pageIndices);
          pagesToAdd.forEach(page => currentPdf.addPage(page));
        };

      } catch (error) {
        console.error(`Erro ao processar arquivo ${fileInfo.file.name}:`, error);
        return NextResponse.json({ error: `Erro ao processar arquivo ${fileInfo.file.name}` }, { status: 500 });
      };
    };

    if (currentPdf.getPageCount() > 0) {
      const finalPdfBytes = await currentPdf.save();
      mergedFiles.push(new Uint8Array(finalPdfBytes));
    };

    if (mergedFiles.length === 0) return NextResponse.json({ error: `Nenhum PDF foi gerado` }, { status: 500 });
    if (mergedFiles.length === 1) {
      const blob = new Blob([mergedFiles[0].slice()], { type: `application/pdf` });
      return new NextResponse(blob, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="PDF_Mesclado.pdf"'
        }
      });
    } else {
      const base64Files = mergedFiles.map(pdfBytes => Buffer.from(pdfBytes).toString(`base64`));
      return NextResponse.json({ message: `${mergedFiles.length} arquivos PDF foram gerados respeitando o limite de tamanho`, files: base64Files, count: mergedFiles.length });
    };
  } catch (error) {
    console.error(`Erro na mesclagem de PDFs:`, error);
    return NextResponse.json({ error: `Erro interno do servidor na mesclagem de PDFs` }, { status: 500 });
  };
};