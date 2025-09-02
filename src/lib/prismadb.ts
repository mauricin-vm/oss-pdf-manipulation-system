//importar bibliotecas e funções
import { PrismaClient } from '@prisma/client';

//definir configuração do prisma
declare global { var prisma: PrismaClient | undefined };
const client = globalThis.prisma || new PrismaClient();
if (process.env.NODE_ENV !== `production`) globalThis.prisma = client;
export default client;