import { describe, expect, it } from 'vitest';
import { parseExcelDate, parseMoney, parseNomeAba } from '@/lib/importPlanilha';

describe('parseNomeAba', () => {
  it('reconhece Jan  2024', () => {
    expect(parseNomeAba('Jan  2024')).toEqual({ mes: 1, ano: 2024 });
  });

  it('reconhece Mar  2024 (atualizar)', () => {
    expect(parseNomeAba('Mar  2024 (atualizar)')).toEqual({ mes: 3, ano: 2024 });
  });

  it('reconhece Abril  2024', () => {
    expect(parseNomeAba('Abril  2024')).toEqual({ mes: 4, ano: 2024 });
  });

  it('reconhece Janeiro 2025', () => {
    expect(parseNomeAba('Janeiro 2025')).toEqual({ mes: 1, ano: 2025 });
  });

  it('reconhece Julho 2026', () => {
    expect(parseNomeAba('Julho 2026')).toEqual({ mes: 7, ano: 2026 });
  });

  it('não reconhece Cartões', () => {
    expect(parseNomeAba('Cartões')).toBeNull();
  });

  it('não reconhece Raio-X CC Jun', () => {
    expect(parseNomeAba('Raio-X CC Jun')).toBeNull();
  });
});

describe('parseMoney', () => {
  it('lê número puro', () => {
    expect(parseMoney(1148.94)).toBe(1148.94);
  });

  it('lê string com R$ e formato brasileiro', () => {
    expect(parseMoney('R$ 1.148,94')).toBe(1148.94);
  });

  it('retorna null para célula vazia', () => {
    expect(parseMoney('')).toBeNull();
    expect(parseMoney(null)).toBeNull();
  });

  it('retorna null para texto não numérico', () => {
    expect(parseMoney('abc')).toBeNull();
  });
});

describe('parseExcelDate', () => {
  it('converte serial date do Excel em Date', () => {
    const date = parseExcelDate(44718);
    expect(date).toBeInstanceOf(Date);
    expect(date?.getFullYear()).toBe(2022);
  });
});
