//importar bibliotecas e funções
import * as path from 'path';
import { PDFService } from '@/lib/pdf-service';
import { FileService } from '@/lib/file-service';
import { NextRequest, NextResponse } from 'next/server';

//função principal
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get(`file`) as File;
    const startPage = parseInt(formData.get(`startPage`) as string);
    const endPage = parseInt(formData.get(`endPage`) as string);
    const acordaoNumber = formData.get(`acordaoNumber`) as string;
    const rvNumber = formData.get(`rvNumber`) as string;
    const inputDirectory = formData.get(`inputDirectory`) as string;
    if (!file || !acordaoNumber || !rvNumber) return NextResponse.json({ error: `Dados obrigatórios não fornecidos!` }, { status: 400 })

    const pdfService = new PDFService();
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

    const extractedPagesBuffer = await pdfService.extractPages(Buffer.from(await file.arrayBuffer()), startPage, endPage);
    const acordaoFileName = `Acórdão ${acordaoNumber} RV ${rvNumber}`;
    let acordaoBuffer: Buffer | null = null;
    try {
      acordaoBuffer = await fileService.findAcordaoFile(acordaoFileName);
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    };
    if (!acordaoBuffer) return NextResponse.json({ error: `Acórdão não encontrado na pasta selecionada. O arquivo deve estar no formato "RV ${rvNumber}.pdf" ou "Acórdão ${acordaoNumber} RV ${rvNumber}.pdf"` }, { status: 404 });
    const mergedPdfBuffer = await pdfService.mergePdfs(acordaoBuffer, extractedPagesBuffer)

    return new NextResponse(new Uint8Array(mergedPdfBuffer), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="Acórdão ${acordaoNumber} RV ${rvNumber} - Mesclado.pdf"` } });

  } catch (error) {
    console.error(`Erro no processamento:`, error);
    const errorMessage = error instanceof Error ? error.message : `Erro interno no processamento do arquivo`;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  };
};