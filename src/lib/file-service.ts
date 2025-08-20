import * as fs from 'fs'
import * as path from 'path'

export class FileService {
  private accordsDirectory: string

  constructor(customDirectory?: string) {
    // Pasta onde ficam os acórdãos completos
    this.accordsDirectory = customDirectory || process.env.ACCORDES_DIRECTORY || path.join(process.cwd(), 'accordes')

    // Criar diretório se não existir
    if (!fs.existsSync(this.accordsDirectory)) {
      fs.mkdirSync(this.accordsDirectory, { recursive: true })
      console.log(`Diretório criado: ${this.accordsDirectory}`)
    }
  }

  async findAcordaoFile(acordaoFileName: string): Promise<Buffer | null> {
    try {
      // Buscar arquivos que contenham o padrão do acórdão
      const files = fs.readdirSync(this.accordsDirectory)

      // Padrões de busca mais flexíveis
      const searchPatterns = [
        acordaoFileName,
        `${acordaoFileName}.pdf`,
        acordaoFileName.replace(/\s+/g, ''),
        acordaoFileName.replace(/\s+/g, '').toLowerCase(),
        acordaoFileName.replace(/\s+/g, '_'),
        acordaoFileName.replace(/\s+/g, '-')
      ]

      let matchedFile: string | null = null

      // Busca exata primeiro
      for (const pattern of searchPatterns) {
        const exactMatch = files.find(file =>
          file.toLowerCase() === pattern.toLowerCase() ||
          file.toLowerCase() === `${pattern.toLowerCase()}.pdf`
        )
        if (exactMatch) {
          matchedFile = exactMatch
          break
        }
      }

      // Se não encontrou busca exata, tenta busca parcial
      if (!matchedFile) {
        const acordaoNumber = acordaoFileName.match(/Acórdão\s+([^\s]+)/i)?.[1]
        const rvNumber = acordaoFileName.match(/RV\s+([^\s]+)/i)?.[1]

        if (rvNumber) {
          // Busca apenas pelo RV se não encontrar o acórdão completo
          matchedFile = files.find(file =>
            file.toLowerCase().includes(`rv`) &&
            file.toLowerCase().includes(rvNumber.toLowerCase()) &&
            file.toLowerCase().endsWith('.pdf')
          ) || null
        }

        // Se ainda não encontrou, busca apenas pelo número do acórdão
        if (!matchedFile && acordaoNumber) {
          matchedFile = files.find(file =>
            file.toLowerCase().includes(acordaoNumber.toLowerCase()) &&
            file.toLowerCase().endsWith('.pdf')
          ) || null
        }

        // Se ainda não encontrou, lançar erro com mensagem específica
        if (!matchedFile) {
          console.error(`Arquivo não encontrado: ${acordaoFileName}`)
          console.log('Arquivos disponíveis:', files)
          console.log(`Diretório de busca: ${this.accordsDirectory}`)

          const formatoCompletoEsperado = `RV ${rvNumber || 'XXXX-XXXX'}.pdf`
          const formatoEsperado = `Acórdão ${acordaoNumber || 'XXXX-XXXX'} RV ${rvNumber || 'XXXX-XXXX'}.pdf`
          throw new Error(`Acórdão não encontrado na pasta selecionada. O arquivo deve estar no formato "${formatoEsperado}" ou "${formatoCompletoEsperado}"`)
        }
      }

      const filePath = path.join(this.accordsDirectory, matchedFile)

      if (!fs.existsSync(filePath)) {
        console.error(`Arquivo não existe: ${filePath}`)
        return null
      }

      console.log(`Arquivo encontrado: ${matchedFile}`)
      return fs.readFileSync(filePath)

    } catch (error) {
      console.error('Erro ao buscar arquivo de acórdão:', error)
      return null
    }
  }
}