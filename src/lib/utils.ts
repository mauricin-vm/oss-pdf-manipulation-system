//importar bibliotecas e funções
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

//função principal
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
};