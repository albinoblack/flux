# 06 — Dashboard, dívidas, análise e configurações

## Dashboard (`/`)

- Cards de resumo do mês atual:
  - Renda líquida do mês
  - Total gasto (soma de `LancamentoCartao` + `LancamentoDiario` do mês)
  - Saldo disponível (renda − total gasto)
  - Total de parcelas de dívidas ativas no mês
- Card "Gasto de hoje", destacado visualmente: soma dos
  `LancamentoDiario` de hoje + lista das últimas 5 transações
- Gráfico de barras: meta vs. realizado por bucket (5 categorias)
- Gráfico de linha: evolução do saldo disponível nos últimos 12 meses
- Lista de cartões do mês com valor e % do total gasto em cartão
- Barra de progresso por bucket com cor semafórica:
  - Verde: gasto < 80% da meta
  - Amarelo: gasto entre 80% e 100% da meta
  - Vermelho: gasto > 100% da meta

## Mês a mês (`/mes/[ano]/[mes]`)

- Painel com renda do mês, buckets (meta / gasto / disponível por
  categoria)
- Seção de cartões do mês com total automático
- Lista de `LancamentoDiario` do mês (reaproveitar componente da página
  `/lancamentos`, filtrado por esse mês)
- Campo de observações de texto livre por mês
- Navegação entre meses (botões mês anterior / mês seguinte)
- Botão "Editar renda do mês"

## Dívidas (`/dividas`)

- Tabela com colunas: nome, valor da parcela, saldo devedor, tipo
  (PF/PJ), meses restantes (calculado como `saldoDevedor / valorParcela`,
  arredondado para cima), data de quitação prevista (data atual + meses
  restantes), status (ativa/quitada)
- Totais no rodapé da tabela: soma de todas as parcelas mensais ativas,
  soma de todo o saldo devedor ativo
- Botão "Quitar" em cada linha, que marca `ativa = false`
- Modal para adicionar nova dívida manualmente
- Filtro: ativas / quitadas / todas

## Análise (`/analise`)

- Gráfico de linha: evolução da renda líquida mês a mês (histórico
  completo)
- Gráfico de área empilhada: composição do gasto por bucket ao longo dos
  meses (mostra visualmente se a proporção entre categorias está mudando)
- Gráfico de barras: total gasto em cartões por mês
- Indicador "Taxa de endividamento": soma de parcelas de dívidas ativas ÷
  média da renda líquida dos últimos 3 meses, exibido como gauge visual
  em semicírculo (0% a 100%+)
- Tabela: meses em que algum bucket ultrapassou sua meta, com o
  percentual de estouro e qual bucket foi excedido

## Configurações (`/config`)

- Editar os percentuais dos 5 buckets, com validação de que a soma seja
  exatamente 100%
- Gerenciar lista de cartões ativos (adicionar, desativar — nunca
  excluir definitivamente para preservar histórico)
- Editar regras de categorização automática (`/config/categorizacao`):
  tabela de palavra-chave → categoria, usada pelo módulo de import de
  extrato (módulo 04)
- Histórico de imports: lista dos registros de `ImportLog`, mostrando
  data, tipo (planilha/ofx/csv), nome do arquivo, e contagem de
  sucesso/erro de cada operação
