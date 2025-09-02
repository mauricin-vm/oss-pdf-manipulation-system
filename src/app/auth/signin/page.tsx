'use client'

//importar bibliotecas e funções
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

//função principal
export default function SignIn() {

  //definir os componentes
  const router = useRouter();
  const [error, setError] = useState(``);
  const [email, setEmail] = useState(``);
  const [password, setPassword] = useState(``);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ email: ``, password: ``, name: ``, secretCode: `` });

  //funções para gerenciamento do formulário
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(``);

    try {
      const result = await signIn(`credentials`, { email, password, redirect: false });
      if (result?.error) setError(`Credenciais inválidas!`);
      else router.push(`/chat`);
    } catch (error) {
      setError(`Erro ao fazer login!`);
    } finally {
      setIsLoading(false);
    };
  };
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(``);

    const nameParts = registerData.name.trim().split(` `).filter(part => part.length > 0)
    if (nameParts.length < 2) {
      setError(`Por favor, digite seu nome completo (nome e sobrenome)!`);
      setIsLoading(false);
      return;
    };

    try {
      const response = await fetch(`/api/auth/register`, { method: `POST`, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registerData) });
      const data = await response.json();
      if (!response.ok) return setError(data.error || `Erro ao criar conta!`);
      setError(``);
      setShowRegister(false);
      setRegisterData({ email: ``, password: ``, name: ``, secretCode: `` });
      alert(`Conta criada com sucesso! Faça login para acessar o chat!`);
    } catch (error) {
      setError(`Erro ao criar conta!`);
    } finally {
      setIsLoading(false);
    };
  };

  //retorno da função principal
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-6">

        {/* cabeçalho do card */}
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm cursor-pointer">
              ← Voltar ao Menu
            </Link>
          </div>
          <CardTitle>{showRegister ? "Criar Nova Conta" : "Login"}</CardTitle>
          <CardDescription>
            {showRegister
              ? "Preencha os dados para criar uma nova conta"
              : "Entre com suas credenciais para acessar o chat"
            }
          </CardDescription>
        </CardHeader>

        {/* conteúdo do card */}
        <CardContent>
          {!showRegister ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowRegister(true)}
                  className="text-sm cursor-pointer"
                >
                  Criar nova conta
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Nome Completo</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Digite seu nome e sobrenome"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secret-code">Código Secreto</Label>
                <Input
                  id="secret-code"
                  type="password"
                  value={registerData.secretCode}
                  onChange={(e) => setRegisterData({ ...registerData, secretCode: e.target.value })}
                  placeholder="Digite o código secreto"
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRegister(false);
                    setError(``);
                    setRegisterData({ email: ``, password: ``, name: ``, secretCode: `` });
                  }}
                  className="flex-1 cursor-pointer"
                >
                  Voltar
                </Button>
                <Button type="submit" className="flex-1 cursor-pointer" disabled={isLoading}>
                  {isLoading ? "Criando..." : "Criar Conta"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};