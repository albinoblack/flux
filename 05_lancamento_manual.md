# 05 — Módulo de lançamento manual rápido

Este é o módulo que dá visibilidade do dia a dia: gastos de débito, Pix, ou
crédito lançados na hora, em segundos, sem precisar esperar fechamento de
fatura ou extrato.

## Componente global: botão de lançamento rápido

Botão flutuante fixo (`position: fixed`, canto inferior direito), visível
em todas as páginas do sistema, com ícone de "+" grande e alto contraste.

Ao clicar, abre um modal (ou drawer no mobile) com um formulário curto:

| Campo | Tipo | Comportamento |
|---|---|---|
| Valor | input numérico | autofocus, teclado numérico no mobile |
| Descrição | input texto curto | livre, ex: "Ifood", "Posto de gasolina" |
| Data | date picker | default = hoje, editável |
| Meio de pagamento | toggle de botões grandes | Débito \| Pix \| Crédito \| Dinheiro |
| Categoria | chips clicáveis | um chip por bucket ativo (vem de `ConfiguracaoBucket`) |
| Cartão | dropdown | só aparece se Meio = Crédito; opções vêm de `ConfiguracaoCartao` |

Comportamento:

- Submissão via Server Action, grava direto em `LancamentoDiario` com
  `origem = "manual"`
- Ao salvar: toast de confirmação, fecha o modal, sem reload de página
  (atualização otimista ou revalidação do cache do Next.js)
- Recalcular o `gasto` do `Bucket` correspondente ao mês e categoria do
  lançamento, somando todos os `LancamentoDiario` daquele mês com aquela
  categoria (mais os `LancamentoCartao` daquele mês, se aplicável às
  somas de dashboard)
- O formulário deve ser usável com poucos toques no celular — esse é o
  requisito de produto mais importante deste módulo. Evitar campos
  obrigatórios além de valor e meio de pagamento; descrição e categoria
  podem ficar em branco e ser editadas depois

## Página `/lancamentos`

Lista cronológica reversa (mais recente primeiro) de todos os
`LancamentoDiario` do mês selecionado.

- Filtros: por categoria (bucket), por meio de pagamento, busca textual
  por descrição
- Cada linha tem ações de editar e excluir
- Cabeçalho da página mostra três somas: total do dia (hoje), total da
  semana atual, total do mês selecionado
- Seletor de mês para navegar entre meses anteriores

## Integração com o dashboard

O card "Gasto de hoje" no dashboard principal (ver módulo 06) deve somar
os `LancamentoDiario` com `data` igual ao dia atual, e listar as últimas 5
transações como atalho de visualização rápida.
