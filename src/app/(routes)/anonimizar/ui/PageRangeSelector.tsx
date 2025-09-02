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
  totalPages?: number | null
};
export function PageRangeSelector({ startPage, endPage, onStartPageChange, onEndPageChange, totalPages }: PageRangeSelectorProps) {

  //funções de gerenciamento do intervalo de páginas
  const handleStartPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 1;
    if (value > 0) {
      onStartPageChange(value)
      if (value > endPage) onEndPageChange(value);
    };
  };
  const handleEndPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 1;
    if (value >= startPage && value > 0) onEndPageChange(value);
  };

  //retorno da função
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startPage" className="text-sm">Página Inicial</Label>
          <Input
            id="startPage"
            type="number"
            min="1"
            max={totalPages || undefined}
            value={startPage}
            onChange={handleStartPageChange}
            placeholder="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endPage" className="text-sm">
            Página Final {totalPages && `(máx: ${totalPages})`}
          </Label>
          <Input
            id="endPage"
            type="number"
            min={startPage}
            max={totalPages || undefined}
            value={endPage}
            onChange={handleEndPageChange}
            placeholder={totalPages?.toString() || "1"}
          />
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Selecione o intervalo de páginas que contém o documento para ser extraído e processado.
        {totalPages && ` O PDF possui ${totalPages} página${totalPages !== 1 ? 's' : ''} no total.`}
      </div>
    </div>
  );
};