'use client'

//importar bibliotecas e funções
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

//função principal
interface PageRangeSelectorProps {
  startPage: number,
  endPage: number,
  onStartPageChange: (page: number) => void,
  onEndPageChange: (page: number) => void,
  totalPages?: number | null,
  excludedPages: string,
  onExcludedPagesChange: (pages: string) => void
};
export function PageRangeSelector({ startPage, endPage, onStartPageChange, onEndPageChange, totalPages, excludedPages, onExcludedPagesChange }: PageRangeSelectorProps) {

  //funções de gerenciamento do intervalo de páginas
  const handleStartPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^0-9]/g, '');
    if (value === '') {
      onStartPageChange(0);
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onStartPageChange(numValue);
      if (numValue > endPage) onEndPageChange(numValue);
    }
  };
  const handleEndPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^0-9]/g, '');
    if (value === '') {
      onEndPageChange(0);
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      onEndPageChange(numValue);
    }
  };
  const handleExcludedPagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/[^0-9,-\s]/g, '');
    onExcludedPagesChange(value);
  };

  //retorno da função
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startPage" className="text-sm">Página Inicial</Label>
          <Input
            id="startPage"
            type="text"
            value={startPage === 0 ? '' : startPage.toString()}
            onChange={handleStartPageChange}
            placeholder="1"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endPage" className="text-sm">
            Página Final {totalPages && `(máx: ${totalPages})`}
          </Label>
          <Input
            id="endPage"
            type="text"
            value={endPage === 0 ? '' : endPage.toString()}
            onChange={handleEndPageChange}
            placeholder={totalPages?.toString() || "1"}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="space-y-2 mt-4">
        <Label htmlFor="excludedPages" className="text-sm">Páginas a Excluir (opcional)</Label>
        <Input
          id="excludedPages"
          type="text"
          value={excludedPages}
          onChange={handleExcludedPagesChange}
          placeholder="Ex: 3, 5, 7-9"
          autoComplete="off"
        />
      </div>
      <div className="text-xs text-gray-500">
        Selecione o intervalo de páginas que contém o documento para ser extraído e processado.
        {totalPages && ` O PDF possui ${totalPages} página${totalPages !== 1 ? 's' : ''} no total.`}
      </div>
    </div>
  );
};