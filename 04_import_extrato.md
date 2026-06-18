# 04 — Módulo de import de extrato bancário (OFX/CSV)

## Página `/importar/extrato`

Permite importar lançamentos de débito, Pix ou cartão de crédito a partir
de arquivos exportados do app do banco. Suporta dois formatos.

## Formato OFX

OFX é um formato baseado em SGML (não é XML estrito — tags às vezes não são
fechadas). Não depender de um parser XML rígido.

- Escrever um parser simples baseado em regex/string matching para
  extrair os blocos `<STMTTRN>...</STMTTRN>`
- De cada bloco, extrair:
  - `<DTPOSTED>` → data da transação (formato `YYYYMMDDHHMMSS`, pegar só
    os 8 primeiros dígitos para `YYYYMMDD`)
  - `<TRNAMT>` → valor (negativo = saída/despesa, positivo = entrada)
  - `<MEMO>` ou `<NAME>` → descrição da transação
- Ignorar transações com valor positivo (entradas) por padrão, mas avisar
  o usuário quantas foram encontradas e ignoradas (pode ser salário,
  transferência recebida, etc. — não é o foco deste módulo)

## Formato CSV

Cada banco exporta CSV em ordem de colunas diferente, então não assumir
estrutura fixa.

1. Usuário sobe o arquivo CSV
2. Sistema usa `papaparse` para ler e mostrar uma **prévia das primeiras 5
   linhas** em formato de tabela
3. Usuário mapeia manualmente, via dropdowns, qual coluna do arquivo
   corresponde a:
   - Data
   - Valor
   - Descrição
4. Sistema aplica esse mapeamento ao restante do arquivo

## Fluxo comum pós-parse (tanto para OFX quanto CSV)

1. Mostrar tabela de prévia com todos os lançamentos detectados: data,
   valor, descrição, categoria sugerida
2. **Categorização automática por palavra-chave**: para cada lançamento,
   buscar na tabela `RegraCategorizacao` se a descrição contém alguma
   `palavraChave` cadastrada (case-insensitive, substring match) e
   pré-preencher a `categoria` sugerida. Exemplos de regras default a
   popular na primeira execução:
   - `"UBER"` → Essencial
   - `"99"` → Essencial
   - `"NETFLIX"`, `"SPOTIFY"`, `"PRIME"`, `"DISNEY"`, `"HBO"`,
     `"YOUTUBE"` → Streaming
   - `"FARMACIA"`, `"DROGARIA"`, `"DROGASIL"` → Essencial
   - `"IFOOD"`, `"RAPPI"` → Essencial
   - `"SUPERMERCADO"`, `"CARREFOUR"`, `"EXTRA"`, `"PAO DE ACUCAR"` →
     Essencial
   Essas regras devem ser editáveis pelo usuário em `/config/categorizacao`
3. Usuário pode editar manualmente a categoria de qualquer linha antes de
   confirmar o import (a sugestão automática não é obrigatória)
4. **Detecção de duplicatas**: antes de gravar, verificar se já existe um
   `LancamentoDiario` ou `LancamentoCartao` com a mesma data, valor igual
   (ou muito próximo, tolerância de centavos por arredondamento) e
   descrição similar (comparação de string simples, ex: normalizar
   removendo acentos/maiúsculas e comparar). Marcar essas linhas como
   "possível duplicata" na tela de prévia, destacadas visualmente, e
   permitir que o usuário desmarque/exclua antes de confirmar
5. Perguntar ao usuário, antes de processar: este extrato é de **conta
   (débito/Pix)** ou de **cartão de crédito**?
   - Se conta: gravar cada linha como `LancamentoDiario` com
     `meioPagamento` inferido (se a descrição contiver "PIX", marcar como
     `"pix"`, senão `"debito"`) e `origem = "import_ofx"` ou
     `"import_csv"`
   - Se cartão de crédito: perguntar qual cartão (dropdown vindo de
     `ConfiguracaoCartao`), e gravar cada linha como `LancamentoDiario`
     com `meioPagamento = "credito"`, `cartao = <nome escolhido>`, e
     também atualizar/criar o `LancamentoCartao` agregado do mês
     correspondente
6. Ao confirmar, registrar o resultado em `ImportLog` com
   `tipo = "ofx"` ou `"csv"`, contagem de linhas lidas/importadas/com erro

## Observação sobre Open Finance / conexão direta com bancos

Este sistema **não** se conecta diretamente às APIs dos bancos (Open
Finance). Agregadores como Pluggy ou Belvo oferecem isso, mas como serviço
B2B com planos comerciais (a partir de ~R$1.500–2.500/mês), inviável para
uso pessoal de uma única pessoa. A estratégia adotada é import manual de
extrato (este módulo) combinado com lançamento manual rápido do dia a dia
(módulo 05). Não implementar nenhuma integração com Pluggy, Belvo,
Tecnospeed ou qualquer agregador de Open Finance nesta versão.
