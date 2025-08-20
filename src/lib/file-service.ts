//importar bibliotecas e funções
import * as fs from 'fs';
import * as path from 'path';

//definir classe
export class FileService {
  private accordsDirectory: string

  constructor(customDirectory?: string) {
    this.accordsDirectory = customDirectory || path.join(process.cwd(), `accordes`);
    if (!fs.existsSync(this.accordsDirectory)) fs.mkdirSync(this.accordsDirectory, { recursive: true });
  };

  async findAcordaoFile(acordaoFileName: string): Promise<Buffer | null> {
    try {
      const files = fs.readdirSync(this.accordsDirectory)
      const searchPatterns = [
        acordaoFileName,
        `${acordaoFileName}.pdf`,
        acordaoFileName.replace(/\s+/g, ``),
        acordaoFileName.replace(/\s+/g, ``).toLowerCase(),
        acordaoFileName.replace(/\s+/g, `_`),
        acordaoFileName.replace(/\s+/g, `-`)
      ];
      let matchedFile: string | null = null
      for (const pattern of searchPatterns) {
        const exactMatch = files.find(file => file.toLowerCase() === pattern.toLowerCase() || file.toLowerCase() === `${pattern.toLowerCase()}.pdf`);
        if (exactMatch) {
          matchedFile = exactMatch;
          break;
        };
      };

      if (!matchedFile) {
        const acordaoNumber = acordaoFileName.match(/Acórdão\s+([^\s]+)/i)?.[1];
        const rvNumber = acordaoFileName.match(/RV\s+([^\s]+)/i)?.[1];
        if (rvNumber) matchedFile = files.find(file => file.toLowerCase().includes(`rv`) && file.toLowerCase().includes(rvNumber.toLowerCase()) && file.toLowerCase().endsWith(`.pdf`)) || null;
        if (!matchedFile && acordaoNumber) matchedFile = files.find(file => file.toLowerCase().includes(acordaoNumber.toLowerCase()) && file.toLowerCase().endsWith(`.pdf`)) || null;
        if (!matchedFile) {
          const formatoCompletoEsperado = `RV ${rvNumber || 'XXXX-XXXX'}.pdf`
          const formatoEsperado = `Acórdão ${acordaoNumber || 'XXXX-XXXX'} RV ${rvNumber || 'XXXX-XXXX'}.pdf`
          throw new Error(`Acórdão não encontrado na pasta selecionada. O arquivo deve estar no formato "${formatoEsperado}" ou "${formatoCompletoEsperado}"`)
        };
      };

      const filePath = path.join(this.accordsDirectory, matchedFile);
      if (!fs.existsSync(filePath)) return null;
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error(`Erro ao buscar arquivo de acórdão:`, error);
      return null;
    };
  };
};