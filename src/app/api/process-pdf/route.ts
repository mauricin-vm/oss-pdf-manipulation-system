import { NextRequest, NextResponse } from 'next/server'
import { PDFService } from '@/lib/pdf-service'
import { FileService } from '@/lib/file-service'
import * as path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const file = formData.get('file') as File
    const startPage = parseInt(formData.get('startPage') as string)
    const endPage = parseInt(formData.get('endPage') as string)
    const acordaoNumber = formData.get('acordaoNumber') as string
    const rvNumber = formData.get('rvNumber') as string
    const inputDirectory = formData.get('inputDirectory') as string

    if (!file || !acordaoNumber || !rvNumber) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    const pdfService = new PDFService()
    // Usar diretório personalizado se fornecido
    let accordsPath: string | undefined
    if (inputDirectory) {
      let resolvedPath = inputDirectory
      
      // Resolver variáveis de ambiente do Windows
      if (resolvedPath.includes('%USERNAME%')) {
        const username = process.env.USERNAME || process.env.USER || 'Usuario'
        resolvedPath = resolvedPath.replace('%USERNAME%', username)
      }
      
      // Se o caminho é absoluto (Windows: C:\ ou Linux: /), usar diretamente
      if (path.isAbsolute(resolvedPath)) {
        accordsPath = resolvedPath
      } else {
        // Se é relativo, juntar com o diretório do projeto
        accordsPath = path.join(process.cwd(), resolvedPath)
      }
    }
    const fileService = new FileService(accordsPath)

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

    let acordaoBuffer: Buffer | null = null
    try {
      acordaoBuffer = await fileService.findAcordaoFile(acordaoFileName)
    } catch (error: any) {
      // Retornar erro específico para mostrar na interface
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    if (!acordaoBuffer) {
      return NextResponse.json(
        { error: `Acórdão não encontrado na pasta selecionada. O arquivo deve estar no formato "RV ${rvNumber}.pdf" ou "Acórdão ${acordaoNumber} RV ${rvNumber}.pdf"` },
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