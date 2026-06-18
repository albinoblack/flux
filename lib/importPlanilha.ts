import * as XLSX from 'xlsx';

export const mesesPt: Record<string, number> = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
};

export type ImportedBucket = {
  nome: string;
  percentual: number;
  meta: number;
  gasto: number;
};

export type ImportedCard = {
  cartao: string;
  valor: number;
};

export type ImportedMonth = {
  ano: number;
  mes: number;
  rendaLiquida: number;
  observacoes?: string;
  buckets: ImportedBucket[];
  cartoes: ImportedCard[];
  sheetName: string;
};

export type ImportedDebt = {
  nome: string;
  valorParcela: number;
  saldoDevedor: number;
  tipoPessoa: 'PF' | 'PJ';
};

export type ImportPreview = {
  meses: ImportedMonth[];
  dividas: ImportedDebt[];
  abasIgnoradas: string[];
  erros: string[];
};

export function parseNomeAba(nomeAba: string): { mes: number; ano: number } | null {
  const match = nomeAba.match(/([A-Za-zÀ-ÿçÇãÃéÉíÍóÓúÚâÂêÊôÔ]+)\s*(\d{4})/);
  if (!match) return null;
  const prefixo = match[1].trim().toLowerCase().slice(0, 3);
  const mes = mesesPt[prefixo];
  const ano = Number(match[2]);
  if (!mes || Number.isNaN(ano)) return null;
  return { mes, ano };
}

export function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value
      .replace(/R\$/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .replace(/\s/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function parseExcelDate(value: unknown): Date | null {
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const { y, m, d, H, M, S } = parsed;
    return new Date(y, m - 1, d, H || 0, M || 0, S || 0);
  }

  if (typeof value === 'string') {
    const candidate = new Date(value);
    if (!Number.isNaN(candidate.getTime())) {
      return candidate;
    }
  }

  return null;
}

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function isBucketHeader(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    normalized.startsWith('essencial') ||
    normalized.startsWith('educação') ||
    normalized.startsWith('educacao') ||
    normalized.startsWith('streaming') ||
    normalized.startsWith('str. / outros') ||
    normalized.startsWith('objetivos') ||
    normalized.startsWith('reserva') ||
    normalized.startsWith('pé na jaca') ||
    normalized.startsWith('pe na jaca')
  );
}

function canonicalBucketName(text: string): string {
  const normalized = text.toLowerCase();
  if (normalized.startsWith('essencial')) return 'Essencial';
  if (normalized.startsWith('educação') || normalized.startsWith('educacao')) return 'Streaming';
  if (normalized.startsWith('streaming') || normalized.startsWith('str. / outros') || normalized.startsWith('streaming / outros')) return 'Streaming';
  if (normalized.startsWith('objetivos')) return 'Objetivos';
  if (normalized.startsWith('reserva')) return 'Reserva';
  if (normalized.startsWith('pé na jaca') || normalized.startsWith('pe na jaca')) return 'Pé na Jaca';
  return text;
}

const knownCardNames = [
  'Nubank Edy',
  'Santander Edy',
  'Nubank Lucas',
  'PDA',
  'Mercado Pago',
];

function isKnownCard(text: string): boolean {
  return knownCardNames.some((name) => name.toLowerCase() === text.toLowerCase());
}

function getCell(rows: unknown[][], r: number, c: number): unknown {
  return rows?.[r]?.[c] ?? '';
}

export function parseWorkbook(buffer: ArrayBuffer | Buffer): ImportPreview {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false, raw: true });
  const meses: ImportedMonth[] = [];
  const dividas: ImportedDebt[] = [];
  const abasIgnoradas: string[] = [];
  const erros: string[] = [];

  for (const nomeAba of workbook.SheetNames) {
    const info = parseNomeAba(nomeAba);
    const sheet = workbook.Sheets[nomeAba];
    if (!info) {
      if (/mapeamento de dívidas/i.test(nomeAba)) {
        try {
          const parsed = parseDebtSheet(sheet);
          dividas.push(...parsed);
        } catch (error) {
          erros.push(`Erro ao parsear aba de dívidas '${nomeAba}': ${error}`);
        }
      } else {
        abasIgnoradas.push(nomeAba);
      }
      continue;
    }

    try {
      const mesImportado = parseMonthSheet(sheet, nomeAba, info);
      meses.push(mesImportado);
    } catch (error) {
      erros.push(`Erro em aba '${nomeAba}': ${error}`);
    }
  }

  return {
    meses,
    dividas,
    abasIgnoradas,
    erros,
  };
}

function parseMonthSheet(sheet: XLSX.WorkSheet, nomeAba: string, info: { mes: number; ano: number }): ImportedMonth {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '' });
  const cells = rows.flatMap((row, rowIndex) =>
    row.map((value, colIndex) => ({ rowIndex, colIndex, text: normalizeText(value), value })),
  );

  const bucketCells = cells.filter((cell) => isBucketHeader(cell.text));
  if (bucketCells.length === 0) {
    throw new Error('Não foi possível encontrar os nomes dos buckets na aba.');
  }

  const bucketColumns = bucketCells
    .map((cell) => ({ colIndex: cell.colIndex, nome: canonicalBucketName(cell.text), rowIndex: cell.rowIndex }))
    .sort((a, b) => a.colIndex - b.colIndex);

  const metaCells = cells.filter((cell) => cell.text.toUpperCase() === 'META');
  const metas = metaCells.map((cell) => parseMoney(getCell(rows, cell.rowIndex, cell.colIndex + 1)) ?? 0);

  const somaLine = cells.find((cell) => /^(SOMA|Soma)$/i.test(cell.text) && bucketColumns.some((bucket) => Math.abs(bucket.colIndex - cell.colIndex) < 2) && cell.rowIndex > 0);
  const somaRowIndex = somaLine?.rowIndex;

  const buckets: ImportedBucket[] = bucketColumns.map((bucket, index) => {
    const percentualText = bucketCells.find((cell) => cell.colIndex === bucket.colIndex)?.text ?? '';
    const percentualMatch = percentualText.match(/(\d+)(?:\.|,)?(\d*)%/);
    const percentual = percentualMatch ? Number(`${percentualMatch[1]}.${percentualMatch[2] || '0'}`) / 100 : 0;
    const metaValue = metas[index] ?? 0;
    let gasto = 0;
    if (somaRowIndex !== undefined) {
      const candidate = parseMoney(getCell(rows, somaRowIndex, bucket.colIndex + 1));
      gasto = candidate ?? 0;
    }

    return {
      nome: bucket.nome,
      percentual,
      meta: metaValue,
      gasto,
    };
  });

  const rendaLiquida = findRendaLiquida(rows) ?? 0;
  const observacoes = findObservacoes(rows);
  const cartoes = parseCartoes(rows);

  return {
    ano: info.ano,
    mes: info.mes,
    rendaLiquida,
    observacoes,
    buckets,
    cartoes,
    sheetName: nomeAba,
  };
}

function findRendaLiquida(rows: unknown[][]): number | null {
  for (const row of rows) {
    for (let columnIndex = 0; columnIndex < row.length; columnIndex += 1) {
      const cell = normalizeText(row[columnIndex]);
      if (/^SOMA TOTAL$/i.test(cell) || /^Renda Líquida$/i.test(cell)) {
        return parseMoney(getCell(rows, rows.indexOf(row), columnIndex + 1));
      }
    }
  }
  return null;
}

function findObservacoes(rows: unknown[][]): string | undefined {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const cell = normalizeText(row[colIndex]);
      if (/^Observaç/i.test(cell)) {
        const after = normalizeText(getCell(rows, rowIndex, colIndex + 1));
        const match = cell.match(/^Observações?[:\s]*([^\n]*)/i);
        if (match && match[1].trim().length > 0) {
          return match[1].trim();
        }
        return after || undefined;
      }
    }
  }
  return undefined;
}

function parseCartoes(rows: unknown[][]): ImportedCard[] {
  const cartoes: ImportedCard[] = [];
  for (const row of rows) {
    const [firstCell] = row;
    const nome = normalizeText(firstCell);
    if (!nome || !isKnownCard(nome)) continue;
    const valor = parseMoney(getCell(rows, rows.indexOf(row), 1));
    if (valor !== null) {
      cartoes.push({ cartao: nome, valor });
    }
  }
  return cartoes;
}

function parseDebtSheet(sheet: XLSX.WorkSheet): ImportedDebt[] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '' });
  const headerRowIndex = rows.findIndex((row) =>
    row.some((cell) => /^NOME DA DÍVIDA$/i.test(normalizeText(cell))) &&
    row.some((cell) => /^VALOR DA PARCELA$/i.test(normalizeText(cell))) &&
    row.some((cell) => /^VALOR TOTAL DA DÍVIDA HOJE$/i.test(normalizeText(cell))),
  );

  if (headerRowIndex === -1) {
    throw new Error('Cabeçalho de dívidas não encontrado.');
  }

  const header = rows[headerRowIndex].map(normalizeText);
  const indexNome = header.findIndex((text) => /^NOME DA DÍVIDA$/i.test(text));
  const indexParcela = header.findIndex((text) => /^VALOR DA PARCELA$/i.test(text));
  const indexSaldo = header.findIndex((text) => /^VALOR TOTAL DA DÍVIDA HOJE$/i.test(text));
  const indexPF = header.findIndex((text) => /^PESSOA FÍSICA$/i.test(text));
  const indexPJ = header.findIndex((text) => /^PESSOA JURÍDICA$/i.test(text));

  if (indexNome === -1 || indexParcela === -1 || indexSaldo === -1) {
    throw new Error('Colunas obrigatórias de dívidas não foram encontradas.');
  }

  const dividas: ImportedDebt[] = [];
  for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const nome = normalizeText(row[indexNome]);
    if (!nome || /^TOTAL[:]?$/i.test(nome)) {
      break;
    }

    const valorParcela = parseMoney(row[indexParcela]);
    const saldoDevedor = parseMoney(row[indexSaldo]);
    if (valorParcela === null || saldoDevedor === null) continue;

    const tipoPessoa = /^X$/i.test(normalizeText(row[indexPF])) ? 'PF' : /^X$/i.test(normalizeText(row[indexPJ])) ? 'PJ' : 'PF';
    dividas.push({ nome, valorParcela, saldoDevedor, tipoPessoa });
  }

  return dividas;
}
