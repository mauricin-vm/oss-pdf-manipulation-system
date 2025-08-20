//importar bibliotecas e funções
import './globals.css';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

//definir metadados
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
export const metadata: Metadata = { title: 'JURFIS - PDFs', description: 'Sistema de processamento de PDFs' };

//função principal
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={`pt-BR`}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
};