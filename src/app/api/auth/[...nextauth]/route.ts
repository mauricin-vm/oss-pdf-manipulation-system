//importar bibliotecas e funções
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

//exportar handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };