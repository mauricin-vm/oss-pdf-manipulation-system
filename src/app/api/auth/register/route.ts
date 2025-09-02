//importar bibliotecas e funções
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

//definir prisma
const prisma = new PrismaClient();

//função principal
export async function POST(request: NextRequest) {
  try {

    //receber dados do usuário
    const { email, password, name, secretCode } = await request.json();
    if (!email || !password || !secretCode) return NextResponse.json({ error: `O email, a senha e o código secreto são obrigatórios!` }, { status: 400 });

    //verificar se o código secreto é válido
    const envSecretCode = process.env.REGISTRATION_SECRET_CODE;
    if (!envSecretCode || secretCode !== envSecretCode) return NextResponse.json({ error: `Código secreto inválido!` }, { status: 403 });

    //verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return NextResponse.json({ error: `Usuário já existe!` }, { status: 400 });

    //criar usuário
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, password: hashedPassword, name: name || null } });

    //retornar resposta
    return NextResponse.json({ message: `Usuário criado com sucesso!`, user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });

  } catch (error) {
    console.error(`Erro ao criar usuário:`, error);
    return NextResponse.json({ error: `Erro interno do servidor!` }, { status: 500 });
  };
};