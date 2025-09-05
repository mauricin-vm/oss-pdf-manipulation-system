//importar bibliotecas e funções
import * as path from 'path';
import { PDFService } from '@/app/(routes)/anonimizar/hooks/pdf-service';
import { FileService } from '@/app/(routes)/anonimizar/hooks/file-service';
import { NextRequest, NextResponse } from 'next/server';

//função principal
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get(`file`) as File;
    const startPage = parseInt(formData.get(`startPage`) as string);
    const endPage = parseInt(formData.get(`endPage`) as string);
    const excludedPages = formData.get(`excludedPages`) as string || '';
    const acordaoNumber = formData.get(`acordaoNumber`) as string;
    const rvNumber = formData.get(`rvNumber`) as string;
    const inputDirectory = formData.get(`inputDirectory`) as string;
    const ignoreAcordaoMerge = formData.get(`ignoreAcordaoMerge`) === `true`;
    if (!file) return NextResponse.json({ error: `Arquivo não fornecido!` }, { status: 400 });
    if (!ignoreAcordaoMerge && (!acordaoNumber || !rvNumber)) return NextResponse.json({ error: `Acórdão e RV são obrigatórios quando não ignorar mesclagem!` }, { status: 400 });

    const pdfService = new PDFService();
    const extractedPagesBuffer = await pdfService.extractPagesWithExclusions(Buffer.from(await file.arrayBuffer()), startPage, endPage, excludedPages);
    let finalPdfBuffer: Buffer;
    if (ignoreAcordaoMerge) {
      finalPdfBuffer = extractedPagesBuffer;
    } else {
      let accordsPath: string | undefined;
      if (inputDirectory) {
        let resolvedPath = inputDirectory;
        if (resolvedPath.includes(`%USERNAME%`)) {
          const username = process.env.USERNAME || process.env.USER || `Usuario`;
          resolvedPath = resolvedPath.replace(`%USERNAME%`, username);
        };

        if (path.isAbsolute(resolvedPath)) accordsPath = resolvedPath;
        else accordsPath = path.join(process.cwd(), resolvedPath);
      };
      const fileService = new FileService(accordsPath);

      const acordaoFileName = `Acórdão ${acordaoNumber} RV ${rvNumber}`;
      let acordaoBuffer: Buffer | null = null;
      try {
        acordaoBuffer = await fileService.findAcordaoFile(acordaoFileName);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : `Erro desconhecido`;
        return NextResponse.json({ error: errorMessage }, { status: 404 });
      };
      if (!acordaoBuffer) return NextResponse.json({ error: `Acórdão não encontrado na pasta selecionada. O arquivo deve estar no formato "RV ${rvNumber}.pdf" ou "Acórdão ${acordaoNumber} RV ${rvNumber}.pdf"` }, { status: 404 });
      finalPdfBuffer = await pdfService.mergePdfs(acordaoBuffer, extractedPagesBuffer);
    };
    const filename = ignoreAcordaoMerge ? `Documento Mesclado.pdf` : `Acórdão ${acordaoNumber} RV ${rvNumber} - Mesclado.pdf`;

    return new NextResponse(new Uint8Array(finalPdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error(`Erro no processamento:`, error);
    const errorMessage = error instanceof Error ? error.message : `Erro interno no processamento do arquivo`;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  };
};