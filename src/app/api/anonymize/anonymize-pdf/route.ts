//importar bibliotecas e funções
import { PDFDocument } from 'pdf-lib';
import { NextRequest, NextResponse } from 'next/server';

//função principal
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const acordaoNumber = formData.get(`acordaoNumber`) as string;
    const rvNumber = formData.get(`rvNumber`) as string;
    const pageKeys = Array.from(formData.keys()).filter(k => k.startsWith(`page_`));
    if (!pageKeys.length) return NextResponse.json({ error: `Nenhuma página enviada!` }, { status: 400 });

    const pdfDoc = await PDFDocument.create();
    for (const key of pageKeys) {
      const file = formData.get(key) as File;
      if (!file) continue;
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const image = await pdfDoc.embedPng(uint8Array);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    };
    const pdfBytes = await pdfDoc.save();
    const filename = `Acórdão ${acordaoNumber} RV ${rvNumber} - Anonimizado.pdf`;

    // Criar uma cópia do buffer usando slice()
    const blob = new Blob([pdfBytes.slice()], { type: `application/pdf` });
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: `Erro interno!` }, { status: 500 });
  };
};