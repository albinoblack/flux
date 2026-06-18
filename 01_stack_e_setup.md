# 01 — Stack e setup

## Stack técnica

- Next.js 14, App Router
- TypeScript
- Tailwind CSS
- shadcn/ui para componentes (button, input, dialog, table, select, toast, etc.)
- Recharts para gráficos
- Prisma como ORM
- PostgreSQL via Neon (banco serverless em nuvem) — nunca usar SQLite, nem em dev local
- date-fns para manipulação de datas
- xlsx (SheetJS) para parsear o arquivo Excel no módulo de import
- papaparse para parsear CSV no módulo de import de extrato

## Banco de dados (Neon)

1. Criar conta em neon.tech, criar um projeto novo
2. Copiar a connection string fornecida
3. Colocar em `.env.local`:

```
<!-- DATABASE_URL="postgresql://usuario:senha@host/dbname?sslmode=require" -->
DATABASE_URL="postgresql://neondb_owner:npg_it7ZzXbJj1sY@ep-broad-band-ac95175m.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

4. `schema.prisma` deve declarar:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

## Prisma Client singleton

Para evitar esgotar conexões no ambiente serverless da Vercel, instanciar o
Prisma Client como singleton, padrão recomendado pela própria Vercel:

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## Comandos locais

```bash
npm install
cp .env.example .env.local   # preencher DATABASE_URL
npx prisma generate
npx prisma db push
npm run dev
```

Não há seed automático — o histórico é populado pelo usuário através da tela
de import da planilha (`/importar/planilha`), descrita no arquivo 03.

## Deploy (Vercel)

1. Criar projeto na Vercel conectado ao repositório GitHub
2. Em Settings → Environment Variables, adicionar `DATABASE_URL` com a
   connection string do Neon
3. Push para a branch principal dispara deploy automático
4. Após o primeiro deploy, rodar `npx prisma db push` apontando para o banco
   de produção (ou configurar isso como parte do build step)

## Requisitos gerais de implementação

- Server Actions do Next.js 14 para todas as mutações (criar, editar,
  excluir) — evitar API routes REST manuais quando Server Actions resolvem
- Sem autenticação — é um sistema de uso pessoal/familiar, sem múltiplos
  usuários
- `loading.tsx` em cada rota principal para aproveitar Suspense boundaries
  do App Router
- Toda a interface em português brasileiro, incluindo mensagens de erro,
  labels, placeholders e textos de confirmação
- Formatação de moeda sempre via `Intl.NumberFormat('pt-BR', { style:
  'currency', currency: 'BRL' })`
- Listas de cartões e de buckets (categorias de orçamento) nunca devem ser
  hardcoded no código — sempre vêm das tabelas `ConfiguracaoCartao` e
  `ConfiguracaoBucket` (ver schema no arquivo 02), porque o usuário pode
  trocar de banco, adicionar cartão novo, ou ajustar os percentuais do
  orçamento ao longo do tempo
