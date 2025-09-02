-- Script SQL para criar as tabelas de autenticação do chat
-- Schema: jurfis
-- Execute este script no DBeaver para criar as tabelas manualmente

-- Tabela de usuários
CREATE TABLE jurfis."Chat_User" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    "emailVerified" TIMESTAMP,
    image TEXT,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tabela de contas (para providers OAuth, se necessário no futuro)
CREATE TABLE jurfis."Chat_Account" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    FOREIGN KEY ("userId") REFERENCES jurfis."Chat_User"(id) ON DELETE CASCADE,
    UNIQUE(provider, "providerAccountId")
);

-- Tabela de sessões
CREATE TABLE jurfis."Chat_Session" (
    id TEXT PRIMARY KEY,
    "sessionToken" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    expires TIMESTAMP NOT NULL,
    FOREIGN KEY ("userId") REFERENCES jurfis."Chat_User"(id) ON DELETE CASCADE
);

-- Tabela de tokens de verificação
CREATE TABLE jurfis."Chat_VerificationToken" (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMP NOT NULL,
    UNIQUE(identifier, token)
);

-- Índices para otimização
CREATE INDEX idx_chat_user_email ON jurfis."Chat_User"(email);
CREATE INDEX idx_chat_session_token ON jurfis."Chat_Session"("sessionToken");
CREATE INDEX idx_chat_account_user ON jurfis."Chat_Account"("userId");
CREATE INDEX idx_chat_session_user ON jurfis."Chat_Session"("userId");

-- Comentários para documentação
COMMENT ON TABLE jurfis."Chat_User" IS 'Usuários do sistema de chat';
COMMENT ON TABLE jurfis."Chat_Account" IS 'Contas de provedores de autenticação (NextAuth)';
COMMENT ON TABLE jurfis."Chat_Session" IS 'Sessões ativas de usuários';
COMMENT ON TABLE jurfis."Chat_VerificationToken" IS 'Tokens de verificação para autenticação';

COMMENT ON COLUMN jurfis."Chat_User".id IS 'ID único do usuário (CUID)';
COMMENT ON COLUMN jurfis."Chat_User".email IS 'Email do usuário (único)';
COMMENT ON COLUMN jurfis."Chat_User".password IS 'Senha criptografada com bcrypt';
COMMENT ON COLUMN jurfis."Chat_User"."createdAt" IS 'Data de criação do usuário';
COMMENT ON COLUMN jurfis."Chat_User"."updatedAt" IS 'Data de última atualização';