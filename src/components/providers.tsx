'use client'

//importar bibliotecas e funções
import { SessionProvider } from 'next-auth/react';

//função principal
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
};