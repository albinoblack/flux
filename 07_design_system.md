# 07 — Design system

Paleta financeira sóbria e confiável:

| Uso | Cor |
|---|---|
| Fundo da página | `#F8F7F4` |
| Card | `#FFFFFF` |
| Primária | `#1C3A5E` |
| Accent (gráficos, CTAs) | `#2563EB` |
| Sucesso / positivo | `#16A34A` |
| Alerta | `#D97706` |
| Perigo | `#DC2626` |
| Texto primário | `#111827` |
| Texto secundário | `#6B7280` |

Tipografia: Inter (fonte padrão do Next.js, sem necessidade de import
extra).

Valores monetários:

- Sempre com `font-variant-numeric: tabular-nums` para alinhamento de
  colunas em tabelas
- Sempre formatados via `Intl.NumberFormat('pt-BR', { style: 'currency',
  currency: 'BRL' })`

Botão de lançamento rápido (módulo 05): deve ser visualmente óbvio e
sempre acessível — `position: fixed`, alto contraste com o fundo, ícone
grande, sombra sutil para destacar do conteúdo por trás.

Interface 100% em português brasileiro: labels, placeholders, mensagens de
erro, textos de confirmação, nomes de botão.
