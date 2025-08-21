'use client'

//importar bibliotecas e funções
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

//função principal
interface FileUploadProps {
  onFileSelect: (file: File) => void,
  selectedFile: File | null
};
export function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {

  //definir referências
  const fileInputRef = useRef<HTMLInputElement>(null)

  //funções de gerenciamento de upload de arquivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === `application/pdf`) onFileSelect(file);
    else alert(`Por favor, selecione apenas arquivos PDF.`);
  };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === `application/pdf`) onFileSelect(file);
    else alert(`Por favor, selecione apenas arquivos PDF.`);
  };
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => event.preventDefault();

  //retorno da função
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 py-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="text-green-600 font-medium">
                  ✓ Arquivo selecionado
                </div>
                <div className="text-sm text-gray-600">
                  {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  Alterar arquivo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Clique para selecionar
                  </span>{' '}
                  ou arraste o arquivo PDF aqui
                </div>
                <div className="text-xs text-gray-500">
                  Apenas arquivos PDF são aceitos
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};