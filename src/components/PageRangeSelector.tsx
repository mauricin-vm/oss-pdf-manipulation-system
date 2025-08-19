'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PageRangeSelectorProps {
  startPage: number
  endPage: number
  onStartPageChange: (page: number) => void
  onEndPageChange: (page: number) => void
}

export function PageRangeSelector({
  startPage,
  endPage,
  onStartPageChange,
  onEndPageChange
}: PageRangeSelectorProps) {
  const handleStartPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 1
    if (value > 0) {
      onStartPageChange(value)
      if (value > endPage) {
        onEndPageChange(value)
      }
    }
  }

  const handleEndPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 1
    if (value >= startPage && value > 0) {
      onEndPageChange(value)
    }
  }

  return (
    <div className="space-y-4">
      <Label>Intervalo de Páginas do Voto Vencedor</Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startPage" className="text-sm">Página Inicial</Label>
          <Input
            id="startPage"
            type="number"
            min="1"
            value={startPage}
            onChange={handleStartPageChange}
            placeholder="1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endPage" className="text-sm">Página Final</Label>
          <Input
            id="endPage"
            type="number"
            min={startPage}
            value={endPage}
            onChange={handleEndPageChange}
            placeholder="1"
          />
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Selecione o intervalo de páginas que contém o voto vencedor para ser extraído e processado.
      </div>
    </div>
  )
}