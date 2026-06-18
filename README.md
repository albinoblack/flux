# Flux

Aplicação de controle financeiro pessoal baseada na especificação de importação de planilha Excel e lançamentos diários.

## O que foi implementado

- Projeto Next.js 14 com TypeScript e Tailwind CSS
- Schema Prisma completo conforme especificação
- Parser de importação de planilhas Excel (`xlsx`) capaz de reconhecer abas de mês e a aba de mapeamento de dívidas
- Página de upload de planilha com preview de importação
- Testes unitários para `parseNomeAba`, `parseMoney` e `parseExcelDate`

## Como usar

1. Instale dependências:
   ```bash
   npm install
   ```
2. Configure a variável `DATABASE_URL` em `.env.local` se quiser usar o banco Prisma.
3. Gere o client Prisma:
   ```bash
   npm run prisma:generate
   ```
4. Execute o projeto:
   ```bash
   npm run dev
   ```
5. Acesse `http://localhost:3000` e vá para `/importar/planilha`.

## Testes

```bash
npm run test
```

## Observação

A planilha de exemplo está em `exemplo-planilha/Planilha_de_Controle_de_Gastos_-_2026_v2.xlsx`.
