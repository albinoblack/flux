# 02 — Schema Prisma completo

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model MesFinanceiro {
  id           String   @id @default(cuid())
  ano          Int
  mes          Int
  rendaLiquida Float
  observacoes  String?
  criadoEm     DateTime @default(now())

  buckets     Bucket[]
  cartoes     LancamentoCartao[]
  lancamentos LancamentoDiario[]

  @@unique([ano, mes])
}

model Bucket {
  id         String        @id @default(cuid())
  mesId      String
  mes        MesFinanceiro @relation(fields: [mesId], references: [id], onDelete: Cascade)
  nome       String
  percentual Float
  meta       Float
  gasto      Float         @default(0)
}

model LancamentoCartao {
  id        String        @id @default(cuid())
  mesId     String
  mes       MesFinanceiro @relation(fields: [mesId], references: [id], onDelete: Cascade)
  cartao    String
  valor     Float
  data      DateTime?
  descricao String?
  origem    String        @default("manual") // "manual" | "import_planilha" | "import_ofx" | "import_csv"
}

// Lançamentos do dia a dia: débito, Pix, ou avulsos de cartão lançados na hora
model LancamentoDiario {
  id            String        @id @default(cuid())
  mesId         String
  mes           MesFinanceiro @relation(fields: [mesId], references: [id], onDelete: Cascade)
  data          DateTime
  valor         Float
  descricao     String
  categoria     String?       // vincula a um bucket: "Essencial", "Streaming", etc.
  meioPagamento String        // "debito" | "pix" | "credito" | "dinheiro"
  cartao        String?       // se meioPagamento = "credito", qual cartão
  origem        String        @default("manual") // "manual" | "import_ofx" | "import_csv" | "whatsapp"
  criadoEm      DateTime      @default(now())
}

model Divida {
  id           String   @id @default(cuid())
  nome         String
  valorParcela Float
  saldoDevedor Float
  tipoPessoa   String   // "PF" ou "PJ"
  ativa        Boolean  @default(true)
  criadoEm     DateTime @default(now())
  atualizadoEm DateTime @updatedAt
}

model ConfiguracaoBucket {
  id         String @id @default(cuid())
  nome       String @unique
  percentual Float
  ordem      Int
}

model ConfiguracaoCartao {
  id    String  @id @default(cuid())
  nome  String  @unique
  ativo Boolean @default(true)
}

model RegraCategorizacao {
  id         String @id @default(cuid())
  palavraChave String  // ex: "UBER", "NETFLIX", "FARMACIA"
  categoria  String  // qual bucket vincular automaticamente
  criadoEm   DateTime @default(now())
}

model ImportLog {
  id               String   @id @default(cuid())
  tipo             String   // "planilha" | "ofx" | "csv"
  nomeArquivo      String
  linhasLidas      Int
  linhasImportadas Int
  linhasComErro    Int
  detalhesErro     Json?
  criadoEm         DateTime @default(now())
}
```

## Notas sobre o schema

- `MesFinanceiro` é a entidade central: cada mês tem um registro único
  (constraint `@@unique([ano, mes])`), com a renda líquida daquele mês e
  relação para buckets, lançamentos de cartão e lançamentos diários
- `Bucket` representa o estado mensal de uma categoria orçamentária
  (Essencial, Streaming, Objetivos, Reserva, Pé na Jaca) com sua meta
  calculada e o gasto real acumulado
- `LancamentoCartao` é o valor agregado de fatura por cartão por mês — é
  como a planilha original já trabalha (um valor por cartão por mês), e
  serve tanto para o import da planilha quanto para totais manuais
- `LancamentoDiario` é o detalhamento dos gastos individuais do dia a dia —
  é o que alimenta o "gasto de hoje" e a lista de lançamentos. Pode ter
  origem manual, de import de extrato, ou futuramente via WhatsApp
- `ConfiguracaoBucket` e `ConfiguracaoCartao` existem para que as listas de
  categorias e cartões sejam editáveis pelo usuário sem alterar código
- `RegraCategorizacao` permite que o módulo de import de extrato sugira
  categoria automaticamente a partir de palavras-chave na descrição da
  transação (ex: "UBER" → Essencial), e que essas regras sejam editáveis
  pelo usuário com o tempo
- `ImportLog` registra cada operação de import (de planilha ou de
  extrato) com contagem de sucesso/erro, para auditoria e debug
