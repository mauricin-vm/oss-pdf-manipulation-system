import * as fs from 'fs'
import * as path from 'path'

export class FileService {
  private accordsDirectory: string

  constructor() {
    // Pasta onde ficam os acórdãos completos
    this.accordsDirectory = process.env.ACCORDES_DIRECTORY || path.join(process.cwd(), 'accordes')
    
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
      }

      if (!matchedFile) {
        console.error(`Arquivo não encontrado: ${acordaoFileName}`)
        console.log('Arquivos disponíveis:', files)
        return null
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

  async listAvailableAccordes(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.accordsDirectory)) {
        return []
      }

      const files = fs.readdirSync(this.accordsDirectory)
      return files.filter(file => file.toLowerCase().endsWith('.pdf'))
      
    } catch (error) {
      console.error('Erro ao listar acórdãos:', error)
      return []
    }
  }

  async saveProcessedFile(fileName: string, buffer: Buffer): Promise<string> {
    try {
      const outputDir = path.join(process.cwd(), 'output')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      const filePath = path.join(outputDir, fileName)
      fs.writeFileSync(filePath, buffer)
      
      console.log(`Arquivo salvo: ${filePath}`)
      return filePath
      
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error)
      throw new Error('Falha ao salvar arquivo processado')
    }
  }

  getAccordsDirectory(): string {
    return this.accordsDirectory
  }
}