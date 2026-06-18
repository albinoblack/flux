# Sol Dantas Finanças — especificação para implementação

Este diretório contém a especificação completa de um sistema web de controle
financeiro pessoal. Leia os arquivos na ordem abaixo antes de começar a
codar. Cada arquivo cobre uma parte isolada do sistema.

## Ordem de leitura

1. `01_stack_e_setup.md` — stack técnica, banco de dados, deploy
2. `02_schema_prisma.md` — schema completo do banco
3. `03_import_planilha.md` — módulo de import do .xlsx existente
4. `04_import_extrato.md` — módulo de import de OFX/CSV
5. `05_lancamento_manual.md` — módulo de lançamento rápido do dia a dia
6. `06_paginas_dashboard_e_demais.md` — dashboard, dívidas, análise, config
7. `07_design_system.md` — paleta, tipografia, padrões visuais
8. `08_dados_reais_planilha.md` — estrutura real da planilha do usuário (referência para o parser)

## Resumo do projeto

Sistema web (Next.js) para controle financeiro familiar, baseado num método
de orçamento por 5 percentuais sobre a renda líquida mensal:

- Essencial — 55%
- Streaming / Outros — 5%
- Objetivos (e contas provisórias) — 20%
- Reserva — 10%
- Pé na Jaca — 10%

O usuário já mantém uma planilha Excel detalhada com ~3 anos de histórico
(2024-2026), mapeamento de dívidas, e lançamentos de cartão. O sistema deve:

1. Importar essa planilha para popular o histórico (módulo 03)
2. Permitir importar extratos bancários (OFX/CSV) para gastos de débito/Pix/cartão (módulo 04)
3. Permitir lançar gastos do dia a dia manualmente em poucos segundos (módulo 05)
4. Exibir dashboards, análises e gestão de dívidas (módulo 06)

## Stack (resumo — detalhes em 01)

Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + Recharts +
Prisma + PostgreSQL (Neon) + deploy na Vercel. Sem autenticação (uso
pessoal/familiar). Sem SQLite em nenhum momento — banco é sempre Postgres
via Neon, mesmo em desenvolvimento local.

## Prioridade de implementação sugerida

Se for implementar em etapas, essa é uma ordem razoável:

1. Setup do projeto + schema Prisma + deploy básico funcionando
2. Módulo de lançamento manual (é o que dá valor imediato no dia a dia)
3. Dashboard básico consumindo os lançamentos manuais
4. Módulo de import da planilha (para trazer o histórico)
5. Módulo de dívidas
6. Módulo de análise/gráficos
7. Módulo de import de OFX/CSV (mais complexo, pode vir depois)
