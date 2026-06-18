# 03 — Módulo de import da planilha existente (.xlsx)

## Página `/importar/planilha`

Upload de um arquivo `.xlsx` no formato da planilha real do usuário. A
estrutura exata dessa planilha está documentada no arquivo
`08_dados_reais_planilha.md` — leia esse arquivo antes de implementar o
parser, porque a planilha real tem várias inconsistências de formatação que
o parser precisa tolerar.

## Requisitos do parser

1. Usar a biblioteca `xlsx` (SheetJS) para ler o arquivo, via Server Action
   ou rota de API que recebe o upload
2. Identificar quais abas representam meses (vs. abas de suporte como
   "Cartões", "Mapeamento de Dívidas", "Raio-X Mensal") usando uma função
   tolerante a variações de nome:

```typescript
const mesesPt: Record<string, number> = {
  'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6,
  'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12,
};

function parseNomeAba(nomeAba: string): { mes: number; ano: number } | null {
  const match = nomeAba.match(/([A-Za-zçÇãÃéÉ]+)\s*(\d{4})/);
  if (!match) return null;
  const prefixo = match[1].toLowerCase().slice(0, 3);
  const mes = mesesPt[prefixo];
  const ano = parseInt(match[2], 10);
  if (!mes || !ano) return null;
  return { mes, ano };
}
```

Essa função precisa funcionar corretamente para todos esses nomes reais de
aba (casos de teste mínimos):

- `"Jan  2024"` (espaço duplo) → `{ mes: 1, ano: 2024 }`
- `"Mar  2024 (atualizar)"` (espaço duplo + sufixo parêntese) → `{ mes: 3, ano: 2024 }`
- `"Abril  2024"` (nome por extenso, espaço duplo) → `{ mes: 4, ano: 2024 }`
- `"Janeiro 2025"` (nome por extenso, espaço simples) → `{ mes: 1, ano: 2025 }`
- `"Julho 2026"` (espaço simples) → `{ mes: 7, ano: 2026 }`
- `"Cartões"` → `null` (não é mês)
- `"Mapeamento de Dívidas"` → `null`
- `"Raio-X Mensal"` → `null`
- `"Raio-X CC Jun"` → `null` (tem "Jun" mas não tem ano de 4 dígitos junto — não deve casar)
- `"Consumo de Cartão Ao longo do A"` → `null`

3. Para cada aba reconhecida como mês, varrer célula por célula procurando
   marcadores conhecidos em vez de assumir posição fixa de linha/coluna —
   a planilha não é 100% consistente em layout entre os meses. Marcadores
   a procurar:
   - Células com texto `"META"` (repetidas, uma por bucket) seguidas do
     valor da meta na célula adjacente
   - Células com texto `"Disponível"` (repetidas, uma por bucket)
   - Células com texto que comece com `"Essencial"`, ou `"Educação"` ou
     `"Streaming"` (nome do segundo bucket varia entre versões da planilha
     — em alguns meses é "Educação(5%)", em outros "Streaming / Outros
     (5%)" — tratar ambos como o mesmo bucket, mapeando para o nome
     canônico configurado em `ConfiguracaoBucket`)
   - Células com texto que comece com `"Objetivos"` (pode ser
     `"Objetivos(20%)"` ou `"Objetivos e contas provisórias(20%)"`)
   - Células com texto `"Reserva"` e `"Pé na Jaca"`
   - Células com texto `"CARTÃO"` seguida de linhas com nome de cartão
     conhecido (`"Nubank Edy"`, `"Santander Edy"`, `"Nubank Lucas"`,
     `"PDA"`, `"Mercado Pago"`) e valor na célula adjacente
   - Células com texto `"Renda Líquida"` seguida do valor na célula
     adjacente
4. Tratar valores monetários em formatos variados:
   - Número puro: `1148.94`
   - String com formatação brasileira: `"R$ 1.148,94"` (separador de
     milhar `.`, decimal `,`)
   - Célula vazia → tratar como `0` ou `null`, dependendo do contexto
5. Tratar datas: a planilha às vezes usa serial date do Excel (ex:
   `44718` representa uma data específica) — usar a função de conversão
   de serial date que a própria biblioteca `xlsx` fornece
   (`XLSX.SSF.parse_date_code`)
6. Para a aba `"Mapeamento de Dívidas"`: ler a partir da linha que contém
   o cabeçalho `"NOME DA DÍVIDA"` até a linha que contém `"TOTAL:"`,
   mapeando as colunas:
   - `"VALOR DA PARCELA"` → `Divida.valorParcela`
   - `"VALOR TOTAL DA DÍVIDA HOJE"` → `Divida.saldoDevedor`
   - Coluna `"PESSOA FÍSICA"` com `"X"` → `Divida.tipoPessoa = "PF"`
   - Coluna `"PESSOA JURÍDICA"` com `"X"` → `Divida.tipoPessoa = "PJ"`
   - Ignorar colunas extras à direita que contenham anotações soltas
     (a planilha real tem uma coluna de rascunho com valores como "CE",
     "13ª", "EMP", "CC" que não fazem parte da tabela principal de dívidas
     — não confundir essas com novas linhas de dívida)

## Fluxo de import

1. Usuário sobe o arquivo `.xlsx`
2. Sistema processa e exibe uma **tela de prévia** antes de gravar
   qualquer coisa no banco:
   - Lista de meses detectados (mês/ano + renda líquida lida)
   - Total de dívidas encontradas com soma de parcelas e saldo devedor
   - Avisos de abas que não foram reconhecidas como mês (para o usuário
     confirmar que está certo ignorá-las)
3. Usuário revisa e pode desmarcar meses específicos antes de confirmar
   (por exemplo, se algum mês estiver com dado incompleto na planilha)
4. Ao confirmar, gravar:
   - Um `MesFinanceiro` por mês confirmado (usar `upsert` pela constraint
     `ano + mes`, para permitir reimportar sem duplicar)
   - Os `Bucket` de cada mês, com `meta` e `gasto` lidos da planilha
   - Os `LancamentoCartao` de cada mês, um por cartão, com
     `origem = "import_planilha"`
   - As `Divida` da aba de mapeamento (usar `upsert` pelo nome da dívida)
5. Registrar o resultado em `ImportLog` com `tipo = "planilha"`, contagem
   de linhas lidas/importadas/com erro, e detalhe de qualquer erro em
   `detalhesErro` (formato JSON)

## Tratamento de erros

O parser deve ser **defensivo**: planilhas reais têm células vazias,
formatação inconsistente, e abas malformadas. Uma aba com problema não deve
quebrar o import inteiro — deve ser pulada, registrada como erro no
`ImportLog`, e o processamento continua para as próximas abas.

## Testes mínimos recomendados

Escrever testes unitários para:

- `parseNomeAba()` cobrindo todos os casos de teste listados acima
- Parser de valor monetário, cobrindo: número puro, string com `"R$"` e
  formatação brasileira, célula vazia, célula com texto não numérico
  (deve retornar erro tratado, não quebrar)
- Conversão de serial date do Excel para `Date` do JavaScript
