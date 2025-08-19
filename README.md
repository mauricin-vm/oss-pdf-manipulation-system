# Sistema de Processamento de PDFs

Sistema desenvolvido para processar arquivos PDF de votos vencedores, extrair páginas específicas e juntar com acórdãos completos.

## 🚀 Funcionalidades

- **Upload de PDFs**: Interface intuitiva para upload de arquivos PDF
- **Seleção de Páginas**: Especifique o intervalo de páginas do voto vencedor
- **Busca Automática**: Localiza automaticamente o acórdão completo baseado no número do acórdão e RV
- **Junção de Arquivos**: Mescla o acórdão completo com as páginas do voto vencedor
- **Download Automático**: Gera e baixa o PDF final mesclado

## 📋 Pré-requisitos

- Node.js 18+ 
- NPM ou Yarn

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd anonymization-system
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Edite o arquivo `.env.local` se necessário:
```env
ACCORDES_DIRECTORY=./accordes
```

5. Crie a pasta para os acórdãos:
```bash
mkdir accordes
```

## 🚦 Como usar

### 1. Executar a aplicação
```bash
npm run dev
```

### 2. Acessar a interface
Abra o navegador em `http://localhost:3000`

### 3. Preparar os acórdãos completos
- Coloque os arquivos PDF dos acórdãos completos na pasta `accordes/`
- Nomeie os arquivos seguindo o padrão: `Acórdão XXXX-XXXX RV XXXX-XXXX.pdf`

### 4. Processar um voto vencedor
1. Faça upload do PDF que contém o voto vencedor
2. Selecione o intervalo de páginas do voto (ex: página 15 até 25)
3. Informe o número do acórdão (ex: 1234-2024)
4. Informe o número RV (ex: 5678-2024) 
5. Clique em "Processar PDF"

### 5. Resultado
- O sistema irá:
  - Extrair as páginas especificadas do upload
  - Localizar o acórdão completo na pasta `accordes/`
  - Juntar acórdão + voto vencedor
  - Gerar download do PDF final

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── api/process-pdf/     # API endpoint principal
│   ├── globals.css          # Estilos globais
│   ├── layout.tsx           # Layout da aplicação
│   └── page.tsx            # Página principal
├── components/
│   ├── ui/                 # Componentes shadcn/ui
│   ├── FileUpload.tsx      # Componente de upload
│   └── PageRangeSelector.tsx # Seletor de páginas
└── lib/
    ├── file-service.ts     # Serviço de arquivos
    ├── gemini-service.ts   # Integração com Gemini AI
    └── pdf-service.ts      # Manipulação de PDFs
```

## ⚙️ Configurações Avançadas

### Configuração do Gemini AI
1. Acesse https://aistudio.google.com/app/apikey
2. Crie uma nova API key
3. Configure no arquivo `.env.local`

### Personalização da Anonimização
Edite o arquivo `src/lib/gemini-service.ts` para ajustar:
- Tipos de dados a serem anonimizados
- Padrões de substituição
- Regras específicas de proteção

### Configuração de Diretórios
Altere a variável `ACCORDES_DIRECTORY` no `.env.local` para apontar para sua pasta de acórdãos.

## 🔒 Dados Anonimizados

O sistema anonimiza automaticamente:

**Dados Pessoais:**
- Nomes de pessoas físicas
- CPF, RG, documentos pessoais
- Endereços residenciais
- Telefones e e-mails pessoais
- Datas de nascimento

**Dados Fiscais:**
- CNPJs (opcionalmente)
- Valores monetários específicos
- Contas bancárias
- Números de cartões
- Inscrições estaduais/municipais

**Dados Preservados:**
- Nomes de empresas e razões sociais
- Números de processos judiciais
- Datas de decisões
- Números de acórdãos e RVs
- Fundamentos legais
- Argumentos jurídicos
- Nomes de magistrados e servidores

## 🐛 Solução de Problemas

### Erro: "Acórdão não encontrado"
- Verifique se o arquivo está na pasta `accordes/`
- Confirme se o nome segue o padrão correto
- Verifique se o número do acórdão e RV estão corretos

### Erro: "Falha na anonimização"
- Verifique se a API key do Gemini está configurada
- Confirme se há conexão com a internet
- Verifique os logs do console para mais detalhes

### Erro de upload
- Confirme que o arquivo é um PDF válido
- Verifique se o arquivo não excede 50MB
- Tente com um arquivo menor

## 📄 Licença

Este projeto está licenciado sob a MIT License.

## 🤝 Contribuições

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para suporte técnico ou dúvidas sobre o sistema, abra uma issue no repositório do projeto.
