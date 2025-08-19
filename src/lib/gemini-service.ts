import { GoogleGenerativeAI } from '@google/generative-ai'

export class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não está configurada nas variáveis de ambiente')
    }

    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  async anonymizeTextChunk(textChunk: string): Promise<string> {
    try {
      const prompt = `
Você é um especialista em anonimização de documentos jurídicos conforme LGPD e sigilo fiscal.

INSTRUÇÕES RIGOROSAS:

**ANONIMIZAR OBRIGATORIAMENTE:**
• Nomes de pessoas físicas → [PESSOA FÍSICA X]
• CPF (XXX.XXX.XXX-XX) → [CPF ANONIMIZADO]  
• RG/Identidade → [DOCUMENTO ANONIMIZADO]
• Endereços completos → [ENDEREÇO ANONIMIZADO]
• Telefones → [TELEFONE ANONIMIZADO]
• E-mails pessoais → [EMAIL ANONIMIZADO]
• Dados bancários → [DADOS BANCÁRIOS ANONIMIZADOS]
• Valores monetários específicos → [VALOR ANONIMIZADO]
• Datas de nascimento → [DATA NASCIMENTO ANONIMIZADA]

**PRESERVAR OBRIGATORIAMENTE:**
• Nomes de empresas e razões sociais
• Números de processos judiciais  
• Datas de decisões judiciais
• Números de acórdãos e RVs
• Nomes de magistrados, desembargadores e juízes
• Nomes de advogados (OAB)
• Fundamentos legais e jurisprudência
• Argumentos jurídicos
• Estrutura do documento

**REGRAS:**
- Use numeração sequencial para pessoas ([PESSOA FÍSICA 1], [PESSOA FÍSICA 2])
- Preserve toda formatação e estrutura
- Mantenha parágrafos e quebras de linha
- Seja consistente nas substituições

TEXTO PARA ANONIMIZAR:
${textChunk}

IMPORTANTE: Retorne APENAS o texto anonimizado, preservando toda a formatação original:
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()

    } catch (error) {
      console.error('Erro na anonimização do chunk:', error)
      // Fallback: anonimização manual básica
      return this.manualAnonymization(textChunk)
    }
  }

  private manualAnonymization(text: string): string {
    // Fallback de anonimização manual se a IA falhar
    return text
      .replace(/\b[A-ZÁÊÍÓÚÂÔÇ][a-záêíóúâôçãõ]+\s+[A-ZÁÊÍÓÚÂÔÇ][a-záêíóúâôçãõ]+(?:\s+[A-ZÁÊÍÓÚÂÔÇ][a-záêíóúâôçãõ]+)*\b/g, '[PESSOA FÍSICA ANONIMIZADA]')
      .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[CPF ANONIMIZADO]')
      .replace(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g, '[CNPJ ANONIMIZADO]')
      .replace(/R\$\s*\d+(?:\.\d{3})*(?:,\d{2})?/g, '[VALOR ANONIMIZADO]')
      .replace(/\b\d{2}\/\d{2}\/\d{4}\b/g, '[DATA ANONIMIZADA]')
      .replace(/\(\d{2}\)\s*\d{4,5}-\d{4}/g, '[TELEFONE ANONIMIZADO]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL ANONIMIZADO]')
  }

  async processTextInChunks(fullText: string, chunkSize: number = 2000): Promise<string> {
    console.log(`🔄 PROCESSAMENTO EM CHUNKS - Texto: ${fullText.length} caracteres | Tamanho do chunk: ${chunkSize}`)

    const chunks = this.splitTextIntoChunks(fullText, chunkSize)
    const anonymizedChunks: string[] = []

    console.log(`📊 Total de chunks para processar: ${chunks.length}`)

    for (let i = 0; i < chunks.length; i++) {
      console.log(`\n🤖 Processando chunk ${i + 1}/${chunks.length} (${chunks[i].length} caracteres)`)
      console.log(`📝 Trecho do chunk: "${chunks[i].substring(0, 100)}..."`)

      try {
        const startTime = Date.now()
        const anonymizedChunk = await this.anonymizeTextChunk(chunks[i])
        const endTime = Date.now()

        console.log(`✅ Chunk ${i + 1} anonimizado com sucesso em ${endTime - startTime}ms`)
        console.log(`📝 Resultado: "${anonymizedChunk.substring(0, 100)}..."`)
        console.log(`📊 Tamanho: ${chunks[i].length} → ${anonymizedChunk.length} caracteres`)

        anonymizedChunks.push(anonymizedChunk)

        // Pequena pausa para evitar rate limiting
        if (i < chunks.length - 1) {
          console.log('⏳ Aguardando 500ms antes do próximo chunk...')
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error(`❌ Erro no chunk ${i + 1}:`, error)
        console.log(`🔄 Usando chunk original como fallback`)
        // Em caso de erro, usar o chunk original
        anonymizedChunks.push(chunks[i])
      }
    }

    const finalText = anonymizedChunks.join('')
    console.log(`\n✅ PROCESSAMENTO CONCLUÍDO - ${finalText.length} caracteres finais`)

    return finalText
  }

  private splitTextIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = []
    let startIndex = 0

    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + chunkSize, text.length)

      // Tentar quebrar em uma quebra de linha para não cortar frases
      if (endIndex < text.length) {
        const lastNewline = text.lastIndexOf('\n', endIndex)
        const lastPeriod = text.lastIndexOf('.', endIndex)
        const lastSpace = text.lastIndexOf(' ', endIndex)

        // Usar a melhor quebra disponível
        if (lastNewline > startIndex + chunkSize * 0.8) {
          endIndex = lastNewline + 1
        } else if (lastPeriod > startIndex + chunkSize * 0.8) {
          endIndex = lastPeriod + 1
        } else if (lastSpace > startIndex + chunkSize * 0.8) {
          endIndex = lastSpace + 1
        }
      }

      chunks.push(text.slice(startIndex, endIndex))
      startIndex = endIndex
    }

    return chunks
  }
}