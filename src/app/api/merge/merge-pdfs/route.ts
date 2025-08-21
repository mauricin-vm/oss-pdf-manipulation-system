//importar bibliotecas e funções
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

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
    const fileOrders: { [key: string]: number } = {};
    formData.forEach((value, key) => {
      if (key === `fileOrder`) {
        const orderIndex = parseInt(value as string);
        fileOrders[`file_${files.length}`] = orderIndex;
      };
    });
    const fileEntries = formData.getAll(`files`) as File[];

    for (let i = 0; i < fileEntries.length; i++) {
      const file = fileEntries[i];
      if (file && file.type === `application/pdf`) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const pages = pdfDoc.getPageCount();
          files.push({ file, order: fileOrders[`file_${i}`] || i, pages, size: file.size });
        } catch (error) {
          console.warn(`Erro ao processar ${file.name}:`, error);
          files.push({ file, order: fileOrders[`file_${i}`] || i, size: file.size });
        };
      };
    };
    if (files.length === 0) return NextResponse.json({ error: `Nenhum arquivo PDF válido encontrado` }, { status: 400 });
    files.sort((a, b) => a.order - b.order)

    const mergedFiles: Uint8Array[] = [];
    let currentPdf = await PDFDocument.create();
    let currentSize = 0;
    let currentFileIndex = 0;
    for (const fileInfo of files) {
      try {
        const arrayBuffer = await fileInfo.file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuffer);
        const pageCount = sourcePdf.getPageCount();

        if (maxSizePerFile === 0) {
          const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
          const pagesToCopy = await currentPdf.copyPages(sourcePdf, pageIndices);
          pagesToCopy.forEach(page => currentPdf.addPage(page));
        } else {
          for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
            const tempPdf = await PDFDocument.create();
            const [tempPage] = await tempPdf.copyPages(sourcePdf, [pageIndex]);
            tempPdf.addPage(tempPage);
            const tempPdfBytes = await tempPdf.save();
            const pageSize = tempPdfBytes.length;

            if (currentSize + pageSize > maxSizePerFile && currentPdf.getPageCount() > 0) {
              const currentPdfBytes = await currentPdf.save();
              mergedFiles.push(new Uint8Array(currentPdfBytes));
              currentPdf = await PDFDocument.create();
              currentSize = 0;
              currentFileIndex++;
            };

            const [pageToAdd] = await currentPdf.copyPages(sourcePdf, [pageIndex]);
            currentPdf.addPage(pageToAdd);
            currentSize += pageSize;
            if (currentSize > maxSizePerFile && currentPdf.getPageCount() === 1) {
              const currentPdfBytes = await currentPdf.save();
              mergedFiles.push(new Uint8Array(currentPdfBytes));

              currentPdf = await PDFDocument.create();
              currentSize = 0;
              currentFileIndex++;
            };
          };
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
      return new NextResponse(mergedFiles[0], { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="PDF_Mesclado.pdf"' } })
    } else {
      const base64Files = mergedFiles.map(pdfBytes => Buffer.from(pdfBytes).toString(`base64`));
      return NextResponse.json({ message: `${mergedFiles.length} arquivos PDF foram gerados respeitando o limite de tamanho`, files: base64Files, count: mergedFiles.length });
    };
  } catch (error) {
    console.error(`Erro na mesclagem de PDFs:`, error);
    return NextResponse.json({ error: `Erro interno do servidor na mesclagem de PDFs` }, { status: 500 });
  };
};