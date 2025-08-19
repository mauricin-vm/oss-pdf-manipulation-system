import { NextRequest, NextResponse } from 'next/server'
import { PDFService } from '@/lib/pdf-service'
import { FileService } from '@/lib/file-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const file = formData.get('file') as File
    const startPage = parseInt(formData.get('startPage') as string)
    const endPage = parseInt(formData.get('endPage') as string)
    const acordaoNumber = formData.get('acordaoNumber') as string
    const rvNumber = formData.get('rvNumber') as string

    if (!file || !acordaoNumber || !rvNumber) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    const pdfService = new PDFService()
    const fileService = new FileService()

    // Etapa 1: Extrair páginas do voto vencedor
    console.log('Extraindo páginas do voto vencedor...')
    const extractedPagesBuffer = await pdfService.extractPages(
      Buffer.from(await file.arrayBuffer()),
      startPage,
      endPage
    )

    // Etapa 2: Buscar acórdão completo na pasta
    console.log('Buscando acórdão completo...')
    const acordaoFileName = `Acórdão ${acordaoNumber} RV ${rvNumber}`
    const acordaoBuffer = await fileService.findAcordaoFile(acordaoFileName)

    if (!acordaoBuffer) {
      return NextResponse.json(
        { error: 'Acórdão não encontrado na pasta especificada' },
        { status: 404 }
      )
    }

    // Etapa 3: Juntar acórdão + voto vencedor
    console.log('Juntando arquivos...')
    const mergedPdfBuffer = await pdfService.mergePdfs(acordaoBuffer, extractedPagesBuffer)

    // Para agora, retornar apenas o PDF mesclado (que funcionava)
    console.log('PDF processado com sucesso!')

    return new NextResponse(new Uint8Array(mergedPdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Acordao-${acordaoNumber}-RV-${rvNumber}.pdf"`
      }
    })

  } catch (error) {
    console.error('Erro no processamento:', error)
    
    // Retornar mensagem de erro mais específica
    const errorMessage = error instanceof Error ? error.message : 'Erro interno no processamento do arquivo'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}