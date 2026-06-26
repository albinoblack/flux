// lib/parsers/nubank.ts
// Parser para extrato Nubank (conta corrente) — CSV e PDF

export type TransacaoRaw = {
  data: Date;
  valor: number;       // positivo = entrada, negativo = saída
  descricao: string;
  tipo: 'entrada' | 'saida';
  identificador?: string;
  source: 'nubank';
};

// ─── CSV ────────────────────────────────────────────────────────────────────
// Formato: Data,Valor,Identificador,Descrição
// Ex:      01/06/2026,8.98,uuid,Transferência recebida pelo Pix - NOME...

export function parseNubankCsv(content: string): TransacaoRaw[] {
  const lines = content.trim().split('\n');

  // Detecta se é extrato Nubank pelo header
  const header = lines[0]?.toLowerCase() ?? '';
  if (!header.includes('data') || !header.includes('valor') || !header.includes('descrição') && !header.includes('descricao')) {
    throw new Error('Formato de CSV não reconhecido. Esperado: CSV de extrato Nubank (Data, Valor, Identificador, Descrição).');
  }

  const transacoes: TransacaoRaw[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV com vírgula, mas descrição pode conter vírgulas — split nos 3 primeiros campos apenas
    const firstComma = line.indexOf(',');
    const secondComma = line.indexOf(',', firstComma + 1);
    const thirdComma = line.indexOf(',', secondComma + 1);

    if (firstComma === -1 || secondComma === -1 || thirdComma === -1) continue;

    const dataStr = line.slice(0, firstComma).trim();
    const valorStr = line.slice(firstComma + 1, secondComma).trim();
    const identificador = line.slice(secondComma + 1, thirdComma).trim();
    const descricao = line.slice(thirdComma + 1).trim().replace(/^"|"$/g, ''); // remove aspas se houver

    const valor = parseFloat(valorStr);
    if (isNaN(valor)) continue;

    // Ignora estornos (mesmo identificador que a transação original, mas positivo)
    // Mantém ambos para o usuário decidir — não removemos automaticamente

    const data = parseDateBR(dataStr);
    if (!data) continue;

    // Limpa a descrição: remove o prefixo de tipo de operação quando seguido de " - "
    const descricaoLimpa = limparDescricao(descricao);

    transacoes.push({
      data,
      valor,
      descricao: descricaoLimpa,
      tipo: valor >= 0 ? 'entrada' : 'saida',
      identificador,
      source: 'nubank',
    });
  }

  return transacoes;
}

// ─── PDF ────────────────────────────────────────────────────────────────────
// O PDF do Nubank tem texto extraível mas em layout de tabela difícil de parsear.
// Estratégia: extrair o texto bruto e usar regex para capturar padrões de data + valor.

export function parseNubankPdfText(text: string): TransacaoRaw[] {
  const transacoes: TransacaoRaw[] = [];

  // Normaliza quebras de linha
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Regex para capturar blocos por data
  // Padrão no PDF: "DD MMM YYYY  Total de entradas/saídas  +/-VALOR"
  // Depois vêm as linhas de movimentação individuais com valor

  // Captura linhas com padrão: "Tipo de transação DESCRIÇÃO VALOR"
  // Ex: "Transferência enviada pelo Pix CLARO - ... 92,29"
  // Valor no PDF usa vírgula decimal e ponto milhar

  const dateRegex = /(\d{2}\s+[A-Z]{3}\s+\d{4})/g;
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean);

  let currentDate: Date | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detecta linha de data
    const dateMatch = line.match(/^(\d{2})\s+([A-Z]{3})\s+(\d{4})$/);
    if (dateMatch) {
      currentDate = parseDatePDF(dateMatch[1], dateMatch[2], dateMatch[3]);
      continue;
    }

    if (!currentDate) continue;

    // Detecta tipos de transação conhecidos seguidos de valor no final
    const tiposConhecidos = [
      'Transferência enviada pelo Pix',
      'Transferência recebida pelo Pix',
      'Transferência Recebida',
      'Pagamento de boleto efetuado',
      'Pagamento de fatura',
      'Resgate de empréstimo',
      'Compra no débito',
      'Estorno',
    ];

    for (const tipo of tiposConhecidos) {
      if (line.startsWith(tipo)) {
        // Pega o resto da linha como início da descrição
        // O valor está na última "palavra" da linha seguinte ou final desta
        const descPart = line.slice(tipo.length).trim();

        // Tenta pegar valor no final desta linha
        const valorMatch = descPart.match(/[\d.]+,\d{2}$/);
        if (valorMatch) {
          const valor = parseValorBR(valorMatch[0]);
          const descricao = descPart.slice(0, descPart.lastIndexOf(valorMatch[0])).trim().replace(/^-\s*/, '');
          const isEntrada = tipo.includes('recebida') || tipo.includes('Recebida') || tipo.startsWith('Estorno');

          transacoes.push({
            data: currentDate,
            valor: isEntrada ? valor : -valor,
            descricao: `${tipo}${descricao ? ' - ' + descricao : ''}`,
            tipo: isEntrada ? 'entrada' : 'saida',
            source: 'nubank',
          });
        }
        break;
      }
    }
  }

  return transacoes;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDateBR(str: string): Date | null {
  // DD/MM/YYYY
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month - 1, day, 12, 0, 0);
}

function parseDatePDF(day: string, monthStr: string, year: string): Date | null {
  const months: Record<string, number> = {
    JAN: 0, FEV: 1, MAR: 2, ABR: 3, MAI: 4, JUN: 5,
    JUL: 6, AGO: 7, SET: 8, OUT: 9, NOV: 10, DEZ: 11,
  };
  const month = months[monthStr.toUpperCase()];
  if (month === undefined) return null;
  return new Date(Number(year), month, Number(day), 12, 0, 0);
}

function parseValorBR(str: string): number {
  // "1.234,56" → 1234.56
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

function limparDescricao(descricao: string): string {
  // Remove prefixos longos mantendo o essencial
  // "Transferência enviada pelo Pix - CLARO - 40.432..." → "Pix → CLARO"
  // "Pagamento de boleto efetuado - BANCO SANTANDER S/A" → "Boleto BANCO SANTANDER S/A"
  // "Transferência recebida pelo Pix via Open Banking - LUCAS..." → "Pix recebido LUCAS..."

  const prefixoMap: Array<[RegExp, string]> = [
    [/^Transferência enviada pelo Pix via Open Banking\s*-\s*/i, 'Pix → '],
    [/^Transferência enviada pelo Pix\s*-\s*/i, 'Pix → '],
    [/^Transferência recebida pelo Pix via Open Banking\s*-\s*/i, 'Pix recebido ← '],
    [/^Transferência recebida pelo Pix\s*-\s*/i, 'Pix ← '],
    [/^Transferência Recebida\s*-\s*/i, 'Transferência ← '],
    [/^Transferência Recebida\s*/i, 'Transferência ← '],
    [/^Pagamento de boleto efetuado\s*-\s*/i, 'Boleto '],
    [/^Pagamento de fatura\s*/i, 'Pagamento de fatura'],
    [/^Resgate de empréstimo\s*/i, 'Resgate de empréstimo'],
    [/^Compra no débito\s*-\s*/i, 'Débito '],
    [/^Estorno\s*-\s*Transferência enviada pelo Pix\s*-\s*/i, 'Estorno Pix → '],
  ];

  let resultado = descricao;
  for (const [regex, replacement] of prefixoMap) {
    if (regex.test(resultado)) {
      resultado = resultado.replace(regex, replacement);
      break;
    }
  }

  // Remove dados bancários desnecessários (agência, conta, CPF mascarado, banco)
  resultado = resultado
    .replace(/\s*-\s*•{3}\.\d{3}\.\d{3}-••/g, '') // CPF mascarado
    .replace(/\s*-\s*[A-Z\s]+\(0\d{3}\)\s*Agência:\s*\d+\s*Conta:\s*[\d-]+/g, '') // banco + agência + conta
    .replace(/\s*-\s*\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, '') // CNPJ
    .trim();

  return resultado;
}
