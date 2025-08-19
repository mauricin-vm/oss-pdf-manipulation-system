import { createWorker } from 'tesseract.js'
import { fromPath } from 'pdf2pic'
import fs from 'fs'
import path from 'path'

export class OCRService {

  constructor() {
    console.log('OCRService inicializado com pdf-parse e tesseract.js')
  }

  async extractTextFromPdf(pdfBuffer: Buffer, maxPages: number = 10): Promise<string | null> {
    console.log('=== INICIANDO EXTRAÇÃO DE TEXTO ===')
    console.log(`Tamanho do PDF: ${pdfBuffer.length} bytes`)

    try {
      // Primeiro tenta extrair texto diretamente do PDF (para PDFs com texto selecionável)
      console.log('🔍 Tentativa 1: Extração direta de texto do PDF...')
      const directText = await this.extractDirectTextFromPdf(pdfBuffer)

      if (directText && directText.trim().length > 100) {
        console.log(`✅ SUCESSO - Texto extraído diretamente: ${directText.length} caracteres`)
        console.log('📝 Primeiros 200 caracteres:', directText.substring(0, 200))
        return directText
      } else {
        console.log('⚠️ Pouco ou nenhum texto encontrado na extração direta')
        console.log(`Texto encontrado: ${directText?.length || 0} caracteres`)
      }

      // Se não conseguiu extrair texto diretamente, usa OCR
      console.log('🔍 Tentativa 2: Usando OCR nas imagens das páginas...')
      const ocrText = await this.extractTextWithOCR(pdfBuffer, maxPages)

      if (ocrText && ocrText.trim().length > 0) {
        console.log(`✅ SUCESSO - Texto extraído via OCR: ${ocrText.length} caracteres`)
        console.log('📝 Primeiros 200 caracteres:', ocrText.substring(0, 200))
        return ocrText
      } else {
        console.log('❌ OCR não conseguiu extrair texto')
      }

    } catch (error) {
      console.error('❌ ERRO na extração de texto:', error)
    }

    console.log('❌ FALHA COMPLETA - Nenhum texto foi extraído')
    return null
  }

  private async extractDirectTextFromPdf(pdfBuffer: Buffer): Promise<string | null> {
    try {
      console.log('Executando pdf-parse...')

      // Import dinâmico para evitar problemas no build
      const pdfParse = (await import('pdf-parse')).default
      const data = await pdfParse(pdfBuffer)

      console.log(`PDF info - Páginas: ${data.numpages}, Texto: ${data.text.length} chars`)

      if (data.text && data.text.trim().length > 0) {
        return data.text
      }

      return null
    } catch (error) {
      console.error('Erro no pdf-parse:', error)
      return null
    }
  }

  private async extractTextWithOCR(pdfBuffer: Buffer, maxPages: number): Promise<string | null> {
    const tempDir = path.join(process.cwd(), 'temp_ocr')
    const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`)

    try {
      // Criar diretório temporário se não existir
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      // Salvar PDF temporário
      fs.writeFileSync(tempPdfPath, pdfBuffer)
      console.log(`PDF salvo temporariamente em: ${tempPdfPath}`)

      // Configurar conversão PDF para imagens
      const convert = fromPath(tempPdfPath, {
        density: 200,
        saveFilename: "page",
        savePath: tempDir,
        format: "png",
        width: 2000,
        height: 2000
      })

      let allText = ''
      const pagesToProcess = Math.min(maxPages, 5) // Limitar para teste

      console.log(`🔄 Processando ${pagesToProcess} páginas com OCR...`)

      // Inicializar worker do Tesseract
      const worker = await createWorker(['por', 'eng'])

      // Processar cada página
      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        try {
          console.log(`📄 Processando página ${pageNum}/${pagesToProcess}...`)

          // Converter página para imagem
          const result = await convert(pageNum, { responseType: "buffer" })

          if (result.buffer) {
            console.log(`Imagem da página ${pageNum} gerada: ${result.buffer.length} bytes`)

            // Aplicar OCR com Tesseract
            const { data: { text } } = await worker.recognize(result.buffer)

            if (text && text.trim().length > 0) {
              console.log(`📝 Página ${pageNum}: ${text.length} caracteres extraídos`)
              allText += `\n--- PÁGINA ${pageNum} ---\n${text.trim()}\n`
            } else {
              console.warn(`⚠️ Página ${pageNum}: Nenhum texto encontrado`)
            }
          } else {
            console.warn(`⚠️ Página ${pageNum}: Falha na conversão para imagem`)
          }

        } catch (pageError) {
          console.warn(`❌ Erro ao processar página ${pageNum}:`, pageError)
          allText += `\n--- PÁGINA ${pageNum} ---\n[Erro ao processar esta página]\n`
        }
      }

      // Fechar worker
      await worker.terminate()

      if (allText.trim().length > 0) {
        console.log(`✅ OCR concluído: ${allText.length} caracteres extraídos`)
        return allText
      } else {
        console.log('❌ OCR não conseguiu extrair texto de nenhuma página')
        return null
      }

    } catch (error) {
      console.error('❌ Erro no processo de OCR:', error)
      return null
    } finally {
      // Limpar arquivos temporários
      this.cleanupTempFiles(tempDir)
    }
  }

  private cleanupTempFiles(tempDir: string): void {
    try {
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir)
        console.log(`🧹 Limpando ${files.length} arquivos temporários...`)

        files.forEach(file => {
          const filePath = path.join(tempDir, file)
          try {
            fs.unlinkSync(filePath)
          } catch (err) {
            console.warn(`⚠️ Erro ao remover arquivo temporário ${filePath}:`, err)
          }
        })

        // Tentar remover o diretório
        try {
          fs.rmdirSync(tempDir)
          console.log('✅ Diretório temporário removido')
        } catch (err) {
          console.warn('⚠️ Erro ao remover diretório temporário:', err)
        }
      }
    } catch (error) {
      console.warn('⚠️ Erro na limpeza dos arquivos temporários:', error)
    }
  }
}