'use client'

//importar bibliotecas e funções
import { getDocument } from 'pdfjs-dist';
import { useState, useCallback } from 'react';

//função principal
interface PdfInfo {
  totalPages: number | null,
  isValid: boolean,
  error: string | null
};
export function usePdfProcessor() {

  //definir as constantes
  const [pdfInfo, setPdfInfo] = useState<PdfInfo>({ totalPages: null, isValid: false, error: null });

  //funções para o processamento do pdf
  const processPdf = useCallback(async (file: File): Promise<PdfInfo> => {
    try {
      setPdfInfo({ totalPages: null, isValid: false, error: null });
      if (file.type !== `application/pdf`) {
        const error = `Arquivo deve ser um PDF válido!`;
        setPdfInfo({ totalPages: null, isValid: false, error });
        return { totalPages: null, isValid: false, error };
      };

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;
      if (totalPages <= 0) {
        const error = `PDF não possui páginas válidas!`;
        setPdfInfo({ totalPages: null, isValid: false, error });
        return { totalPages: null, isValid: false, error };
      };

      const result = { totalPages, isValid: true, error: null };
      setPdfInfo(result);
      return result;
    } catch (error) {
      console.error(`Erro ao processar PDF:`, error);
      const errorMessage = `Erro ao ler o PDF. Verifique se o arquivo não está corrompido!`;
      const result = { totalPages: null, isValid: false, error: errorMessage };
      setPdfInfo(result);
      return result;
    };
  }, []);
  const reset = useCallback(() => {
    setPdfInfo({ totalPages: null, isValid: false, error: null });
  }, []);

  //retorno da função principal
  return { pdfInfo, processPdf, reset };
};