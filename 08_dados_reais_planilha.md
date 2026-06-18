# 08 — Estrutura real da planilha do usuário (referência para o parser)

Este arquivo documenta a estrutura exata encontrada na planilha real do
usuário (`Planilha_de_Controle_de_Gastos_-_2026_v2.xlsx`), extraída
diretamente dos dados. Use como referência de teste para validar o parser
do módulo 03.

## Lista completa de abas (39 abas)

```
Cartões
Jan  2024
Fev  2024
Mar  2024 (atualizar)
Abril  2024
Maio  2024
Junho  2024
Julho  2024
Agosto  2024
Setembro  2024
Outubro  2024
Novembro  2024
Janeiro  2025
Fevereiro  2025
Março  2025
Abril  2025
Maio  2025
Junho  2025
Raio-X CC Jun
Julho  2025
Agosto  2025
Setembro  2025
Outubro  2025
Novembro  2025
Dezembro  2025
Janeiro 2026
Fevereiro 2026
Março 2026
Abril 2026
Maio 2026
Junho 2026
Julho 2026
Agosto 2026
Setembro 2026
Outubro 2026
Novembro 2026
Dezembro 2026
Mapeamento de Dívidas
Raio-X Mensal
Consumo de Cartão Ao longo do A
```

Note que meses de 2024 e 2025 usam espaço duplo entre nome e ano (`"Jan
2024"`), enquanto meses de 2026 usam espaço simples (`"Julho 2026"`). O
parser deve tolerar ambos.

Abas que NÃO são meses e devem ser ignoradas pelo parser de mês: `Cartões`,
`Raio-X CC Jun`, `Mapeamento de Dívidas`, `Raio-X Mensal`, `Consumo de
Cartão Ao longo do A`.

## Estrutura de uma aba de mês (exemplo: dados reais de "Julho 2026")

```
META	10175	META	925	META	3700	META	1850	META	1850	SOMA TOTAL	18500
Disponível	-2947.11	Disponível	660.15	Disponível	3117	Disponível	1850	Disponível	1850	SOMA Disp	4530.04
Essencial(55%)		Streaming / Outros (5%)		Objetivos e contas provisórias(20%)		Reserva(10%)		Pé na Jaca(10%)
Santander	127.0	Youtube Premium	18.0	Terapia 1	300.0
Vivo	100.0	Kotas (Office)	18.65	Nu Edy	283.0
Claro	139.64	Netflix	59.9
Unimed 1	239.0	Amazon Prime	19.9
Unimed 2	239.0	Spotify	11.6
Seguro	352.5	Canva	0.0
Academia	295.0	Claro Igreja (oferta)	45.0
Alfa		Meli+	24.9
		iCloud	66.9
Soma 	1492.14	SOMA	264.85	SOMA	583	SOMA	0	SOMA	0
CARTÃO		Atualizado em:
Nubank Edy	2054.86	46182.0	PAINEL DE CONTROLE			Observações: [texto livre, pode ser longo]
Santander Edy	5274.53	46182.0	Renda Líquida	18500.0
Nubank Lucas	1349.46	46182.0	Essencial	0.55	10175
PDA	1160.85	46182.0	Str. / Outros	0.05	925
Mercado Pago	1790.27	46182.0	Objetivos  e c.p	0.2	3700
			Reserva	0.1	1850
			Pé na Jaca	0.1	1850
			Somatório		18500
SOMA	13122.11
SOMA DOS CARTÕES	11629.97
```

Pontos importantes para o parser:

1. A linha 1 tem 5 ocorrências da palavra `"META"`, cada uma seguida do
   valor da meta daquele bucket, e termina com `"SOMA TOTAL"` + valor
   (que é a renda líquida do mês)
2. A linha 2 tem 5 ocorrências de `"Disponível"`, cada uma seguida do
   saldo disponível daquele bucket
3. A linha 3 é o cabeçalho dos 5 buckets, com o percentual entre
   parênteses no nome. **O nome do segundo bucket varia**: em meses mais
   antigos aparece como `"Educação(5%)"`, em meses mais recentes como
   `"Streaming / Outros (5%)"` — tratar ambos como o mesmo bucket lógico
   (mapear para o nome canônico "Streaming" em `ConfiguracaoBucket`)
4. Da linha 4 até a linha com `"Soma"` (case variável: `"Soma"` ou
   `"SOMA"`), cada linha tem pares (nome do gasto, valor) por bucket —
   essas são despesas individuais dentro daquele bucket, não precisam
   necessariamente ser todas importadas como `LancamentoDiario`
   individuais; o valor de `"Soma"` de cada bucket é o que deve preencher
   `Bucket.gasto`
5. Depois da linha de soma de cada bucket, vem a seção `"CARTÃO"` com uma
   linha por cartão conhecido (`Nubank Edy`, `Santander Edy`, `Nubank
   Lucas`, `PDA`, `Mercado Pago`) seguida do valor da fatura daquele mês.
   Há uma terceira coluna com um número serial de data do Excel (ex:
   `46182.0`) que representa "atualizado em" — pode ser ignorada ou
   convertida e guardada como metadado, não é crítica
6. Em paralelo à seção CARTÃO, há o `"PAINEL DE CONTROLE"` com:
   - `"Renda Líquida"` seguido do valor (deve ser igual ao "SOMA TOTAL"
     da linha 1 — usar como confirmação cruzada se possível, mas não
     bloquear o import se houver pequena diferença)
   - Uma linha por bucket repetindo nome, percentual decimal (ex: `0.55`)
     e valor da meta
   - Uma linha `"Somatório"` com o total (igual à renda líquida)
7. `"Observações:"` pode conter texto livre relevante (anotações do
   usuário sobre o mês) — pode ser importado para o campo
   `MesFinanceiro.observacoes`
8. Ao final da aba, linhas `"SOMA"` (total geral gasto) e `"SOMA DOS
   CARTÕES"` (total gasto em cartões) — podem ser usadas como validação
   cruzada do total calculado pelo sistema, mas não são estritamente
   necessárias para o import

## Exemplo de aba antiga com layout levemente diferente ("Jan 2024")

```
META	6496.05	META	0	META	4133.85	META	1181.1	META	0	SOMA TOTAL	11811
Disponível	-2475.74	Disponível	0	Disponível	3598.85	Disponível	1181.1	Disponível	-874.39	SOMA Disp	1429.82
Essencial(55%)		Educação(5%)		Objetivos(20%)		Reserva(10%)		Pé na Jaca(10%)
Santander	127.0			Nubank (21/24)	535.0			Youtube Premium	10.62
Vivo	95.0					Kotas (Office)	17.52
Claro	97.0					HBO, Disney+ e Netflix	34.76
Ampla	501.0					Amazon Prime	14.9
Unimed	193.0					Carrefour	279.0
Seguro	261.5					Spotify	11.6
						Visagista	200.0
						Renner (1/3)	177.99	PAGAR ESTE VALOR EXATO
						Oscar (1/6)	128.0

Soma 	1274.5	SOMA	0	SOMA	535	SOMA	0	SOMA	874.39
CARTÃO
Nubank Edy	1297.0		PAINEL DE CONTROLE			Observações:
Santander Edy	1372.0		Renda Líquida	11811.0
Nubank Lucas	201.29		Essencial	0.55	6496.05
PDA	1496.0		Educação	0.0	0
Mercado Pago	3331.0		Objetivos	0.35	4133.85
			Reserva	0.1	1181.1
			Pé na Jaca	0.0	0
			Somatório		11811

SOMA	8971.79
```

Diferenças a notar:

- O bucket "Educação(5%)" aqui tem percentual configurado como `0.0` no
  painel de controle (meta zerada naquele mês) — ou seja, percentual e
  meta podem divergir do "padrão" 55/5/20/10/10 mês a mês; o parser deve
  ler o percentual real de cada mês, não assumir um valor fixo
- Não há coluna de "atualizado em" (serial date) nesta versão mais antiga
  da planilha — tratar como opcional
- Pode haver anotações soltas como `"PAGAR ESTE VALOR EXATO"` em colunas
  extras à direita — ignorar, não são dados estruturados

## Estrutura da aba "Mapeamento de Dívidas"

```
MAPEAMENTO DE DÍVIDAS
NOME DA DÍVIDA	VALOR DA PARCELA	VALOR TOTAL DA DÍVIDA HOJE	PESSOA FÍSICA	PESSOA JURÍDICA		total	parcela	saldo devedor
FIES	R$ 1.148,94	11955.94		X		17234.06	1148.94	11955.94
IPVA	3266.0	3266.0		X
EMPRÉSTIMO 1 - Nubank Evelyn	634.39	2537.57		X
EMPRÉSTIMO 2	1450.0	71655.63		X
...
TOTAL:	29792.78	208534.02
```

Pontos importantes:

1. O cabeçalho real está na segunda linha (`"NOME DA DÍVIDA"`,
   `"VALOR DA PARCELA"`, etc.) — a primeira linha é só um título
2. A coluna `"VALOR DA PARCELA"` tem formatação mista: algumas linhas têm
   `"R$ 1.148,94"` (string formatada), outras têm número puro (`3266.0`)
   — o parser de valor monetário precisa tratar ambos os casos
3. Colunas `"PESSOA FÍSICA"` e `"PESSOA JURÍDICA"` têm `"X"` na que se
   aplica e vazio na outra — usar para definir `Divida.tipoPessoa`
4. Há colunas extras à direita (`total`, `parcela`, `saldo devedor`, e
   depois uma coluna sem cabeçalho claro com anotações como `"CE"`,
   `"13ª"`, `"EMP"`, `"CC"`, `"TOTAL"`) que são rascunho/anotações
   pessoais do usuário, não fazem parte da tabela estruturada principal
   — ignorar essas colunas extras no parser, focar apenas nas 5 colunas
   principais (nome, parcela, total, PF, PJ)
5. Parar a leitura de linhas de dívida ao encontrar a linha que começa
   com `"TOTAL:"` na primeira coluna

## Estrutura da aba "Raio-X Mensal"

Esta aba é um modelo de raio-x financeiro mais genérico (formato "Raio-X
Financeiro Mensal"), com categorias detalhadas de despesas pessoais
(aluguel, condomínio, luz, água, etc.) e linhas avulsas de lançamentos de
cartão/pix com descrição livre. Esta aba tem formato muito menos
estruturado que as abas mensais principais e **não precisa ser importada
automaticamente** nesta versão — é referência para o usuário, não dado
estruturado. O parser pode simplesmente ignorar esta aba.

## Estrutura da aba "Cartões"

Contém extratos brutos de cartão por mês (lançamento individual: nome do
estabelecimento, data como serial Excel, valor), organizados em blocos de
colunas lado a lado (um bloco por mês/fatura). Formato:

```
CARTÃO BB (abril)				CARTÃO BB (maio)				CARTÃO BB (junho)

MERCADOLIVRE*MERCADOLI OSASCO BR	44718.0	49.83		PGZ*Sandra S?o Jos? dos BR	05/18	258.54		PGZ*Sandra S?o Jos? dos BR	06/18	258.54
AUTOGLASS SAO JOSE DOS BR	44686.0	90.0		ESAB VILA VELHA BR	44655.0	52.5		HOTEL GUARANY AGUAS DE LIND BR	44717.0	193.66
...
			1685.92				901.72				721.08
```

Esta aba também tem formatação inconsistente (datas ora como serial
Excel, ora como string `"05/18"`) e baixo valor de import automático
comparado ao esforço do parser. **Não importar automaticamente nesta
versão** — pode ser um candidato a melhoria futura, mas não faz parte do
escopo do módulo 03.
