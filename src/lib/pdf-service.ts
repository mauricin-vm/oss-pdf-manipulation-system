import { PDFDocument, rgb } from 'pdf-lib'
import { OCRService } from './ocr-service'

export class PDFService {
  async extractPages(pdfBuffer: Buffer, startPage: number, endPage: number): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const newPdf = await PDFDocument.create()
      const totalPages = pdfDoc.getPageCount()

      console.log(`PDF tem ${totalPages} páginas. Solicitado: páginas ${startPage} a ${endPage}`)

      // Ajustar para índices baseados em 0
      const startIndex = startPage - 1
      const endIndex = endPage - 1

      // Verificar se as páginas existem
      if (startIndex < 0) {
        throw new Error(`Página inicial ${startPage} é inválida. Deve ser >= 1`)
      }

      if (endIndex >= totalPages) {
        throw new Error(`Página final ${endPage} é inválida. O documento tem apenas ${totalPages} páginas`)
      }

      if (startIndex > endIndex) {
        throw new Error(`Página inicial (${startPage}) não pode ser maior que página final (${endPage})`)
      }

      // Copiar páginas
      const pages = await newPdf.copyPages(pdfDoc, Array.from(
        { length: endIndex - startIndex + 1 },
        (_, i) => startIndex + i
      ))

      pages.forEach((page) => newPdf.addPage(page))

      return Buffer.from(await newPdf.save())
    } catch (error) {
      console.error('Erro ao extrair páginas:', error)
      throw new Error('Falha na extração de páginas do PDF')
    }
  }

  async mergePdfs(acordaoBuffer: Buffer, votoVencedorBuffer: Buffer): Promise<Buffer> {
    try {
      const mergedPdf = await PDFDocument.create()

      // Carregar PDF do acórdão completo
      const acordaoPdf = await PDFDocument.load(acordaoBuffer)
      const acordaoPages = await mergedPdf.copyPages(acordaoPdf, acordaoPdf.getPageIndices())

      // Adicionar todas as páginas do acórdão
      acordaoPages.forEach((page) => mergedPdf.addPage(page))

      // Carregar PDF do voto vencedor
      const votoPdf = await PDFDocument.load(votoVencedorBuffer)
      const votoPages = await mergedPdf.copyPages(votoPdf, votoPdf.getPageIndices())

      // Adicionar todas as páginas do voto vencedor
      votoPages.forEach((page) => mergedPdf.addPage(page))

      return Buffer.from(await mergedPdf.save())
    } catch (error) {
      console.error('Erro ao mesclar PDFs:', error)
      throw new Error('Falha na mesclagem dos arquivos PDF')
    }
  }

  async extractTextFromPdf(pdfBuffer: Buffer): Promise<string | null> {
    console.log('🔍 Tentando extrair texto do PDF...')

    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer)
      const pageCount = pdfDoc.getPageCount()

      console.log(`📄 PDF carregado com ${pageCount} páginas`)

      // Usar o novo OCRService com pdf-parse e tesseract
      const ocrService = new OCRService()
      console.log('🚀 Usando extração de texto local (pdf-parse + tesseract)...')

      const extractedText = await ocrService.extractTextFromPdf(pdfBuffer, Math.min(pageCount, 10))

      if (extractedText && extractedText.trim().length > 0) {
        console.log(`✅ Texto extraído com sucesso: ${extractedText.length} caracteres`)
        return extractedText
      } else {
        console.log('❌ Não foi possível extrair texto do PDF')
        return null
      }

    } catch (error) {
      console.error('❌ Erro ao processar PDF:', error)
      return null
    }
  }



  async generatePdfFromText(text: string): Promise<Buffer> {
    try {
      console.log('Gerando PDF a partir do texto anonimizado...')

      const pdfDoc = await PDFDocument.create()

      // Configurações da página A4
      const pageWidth = 595.28
      const pageHeight = 841.89
      const margin = 50
      const fontSize = 10
      const lineHeight = 14
      const maxCharsPerLine = 85

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
      let yPosition = pageHeight - margin

      // Adicionar cabeçalho
      currentPage.drawText('DOCUMENTO ANONIMIZADO - CONFORME LGPD', {
        x: margin,
        y: yPosition,
        size: 12,
        color: rgb(0, 0, 0)
      })
      yPosition -= 25

      currentPage.drawText(`Processado em: ${new Date().toLocaleString('pt-BR')}`, {
        x: margin,
        y: yPosition,
        size: 8,
        color: rgb(0.6, 0.6, 0.6)
      })
      yPosition -= 30

      // Processar o texto linha por linha
      const lines = text.split('\n')

      for (const line of lines) {
        // Verificar se precisa de nova página
        if (yPosition < margin + lineHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight])
          yPosition = pageHeight - margin
        }

        if (line.trim() === '') {
          yPosition -= lineHeight / 2
          continue
        }

        // Quebrar linha se muito longa
        if (line.length > maxCharsPerLine) {
          const words = line.split(' ')
          let currentLine = ''

          for (const word of words) {
            if ((currentLine + word + ' ').length > maxCharsPerLine) {
              if (currentLine.trim()) {
                if (yPosition < margin + lineHeight) {
                  currentPage = pdfDoc.addPage([pageWidth, pageHeight])
                  yPosition = pageHeight - margin
                }

                try {
                  currentPage.drawText(currentLine.trim(), {
                    x: margin,
                    y: yPosition,
                    size: fontSize,
                    color: rgb(0, 0, 0)
                  })
                  yPosition -= lineHeight
                } catch (drawError) {
                  console.warn('Erro ao desenhar linha:', drawError)
                }
              }
              currentLine = word + ' '
            } else {
              currentLine += word + ' '
            }
          }

          // Adicionar linha restante
          if (currentLine.trim()) {
            if (yPosition < margin + lineHeight) {
              currentPage = pdfDoc.addPage([pageWidth, pageHeight])
              yPosition = pageHeight - margin
            }

            try {
              currentPage.drawText(currentLine.trim(), {
                x: margin,
                y: yPosition,
                size: fontSize,
                color: rgb(0, 0, 0)
              })
              yPosition -= lineHeight
            } catch (drawError) {
              console.warn('Erro ao desenhar linha:', drawError)
            }
          }
        } else {
          // Linha normal
          try {
            currentPage.drawText(line, {
              x: margin,
              y: yPosition,
              size: fontSize,
              color: rgb(0, 0, 0)
            })
            yPosition -= lineHeight
          } catch (drawError) {
            console.warn('Erro ao desenhar linha:', drawError)
            // Tentar com caracteres limpos
            const cleanLine = line.replace(/[^\x20-\x7E\u00C0-\u024F\u00D1\u00F1]/g, '?')
            try {
              currentPage.drawText(cleanLine, {
                x: margin,
                y: yPosition,
                size: fontSize,
                color: rgb(0, 0, 0)
              })
              yPosition -= lineHeight
            } catch (finalError) {
              console.error('Erro final ao desenhar linha')
              yPosition -= lineHeight
            }
          }
        }
      }

      console.log('PDF gerado com sucesso')
      return Buffer.from(await pdfDoc.save())
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      throw new Error('Falha na geração do PDF final')
    }
  }

}