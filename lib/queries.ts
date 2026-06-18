import { subMonths, startOfToday, endOfToday, startOfWeek, endOfWeek } from 'date-fns';
import { prisma } from '@/lib/prisma';

export type MonthItem = {
  id: string;
  ano: number;
  mes: number;
  rendaLiquida: number;
  observacoes?: string | null;
  buckets: { id: string; nome: string; percentual: number; meta: number; gasto: number }[];
  cartoes: { id: string; cartao: string; valor: number }[];
  lancamentos: { id: string; valor: number; descricao: string; data: Date; categoria?: string | null; meioPagamento: string; cartao?: string | null }[];
};

export async function getBucketConfigurations() {
  return prisma.configuracaoBucket.findMany({ orderBy: { ordem: 'asc' } });
}

export async function getCardConfigurations() {
  return prisma.configuracaoCartao.findMany({ orderBy: { nome: 'asc' } });
}

export async function getImportLogs() {
  return prisma.importLog.findMany({ orderBy: { criadoEm: 'desc' }, take: 20 });
}

export async function getCurrentMonth(): Promise<MonthItem | null> {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;
  return getMonth(ano, mes);
}

export async function getMonth(ano: number, mes: number): Promise<MonthItem | null> {
  const month = await prisma.mesFinanceiro.findUnique({
    where: { ano_mes: { ano, mes } },
    include: {
      buckets: true,
      cartoes: true,
      lancamentos: { orderBy: { data: 'desc' }, take: 200 },
    },
  });

  if (!month) return null;

  return {
    id: month.id,
    ano: month.ano,
    mes: month.mes,
    rendaLiquida: month.rendaLiquida,
    observacoes: month.observacoes,
    buckets: month.buckets.map((bucket) => ({
      id: bucket.id,
      nome: bucket.nome,
      percentual: bucket.percentual,
      meta: bucket.meta,
      gasto: bucket.gasto,
    })),
    cartoes: month.cartoes.map((cartao) => ({
      id: cartao.id,
      cartao: cartao.cartao,
      valor: cartao.valor,
    })),
    lancamentos: month.lancamentos.map((l) => ({
      id: l.id,
      valor: l.valor,
      descricao: l.descricao,
      data: l.data,
      categoria: l.categoria,
      meioPagamento: l.meioPagamento,
      cartao: l.cartao,
    })),
  };
}

export async function getLastMonths(limit = 12): Promise<MonthItem[]> {
  const months = await prisma.mesFinanceiro.findMany({
    orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    take: limit,
    include: { buckets: true, cartoes: true, lancamentos: true },
  });

  return months.map((month) => ({
    id: month.id,
    ano: month.ano,
    mes: month.mes,
    rendaLiquida: month.rendaLiquida,
    observacoes: month.observacoes,
    buckets: month.buckets.map((bucket) => ({
      id: bucket.id,
      nome: bucket.nome,
      percentual: bucket.percentual,
      meta: bucket.meta,
      gasto: bucket.gasto,
    })),
    cartoes: month.cartoes.map((cartao) => ({
      id: cartao.id,
      cartao: cartao.cartao,
      valor: cartao.valor,
    })),
    lancamentos: month.lancamentos.map((l) => ({
      id: l.id,
      valor: l.valor,
      descricao: l.descricao,
      data: l.data,
      categoria: l.categoria,
      meioPagamento: l.meioPagamento,
      cartao: l.cartao,
    })),
  }));
}

export async function getAllMonthKeys(): Promise<{ ano: number; mes: number }[]> {
  const months = await prisma.mesFinanceiro.findMany({
    orderBy: [{ ano: 'asc' }, { mes: 'asc' }],
    select: { ano: true, mes: true },
  });
  return months.map((month) => ({ ano: month.ano, mes: month.mes }));
}

export async function getLancamentosForMonth(ano: number, mes: number) {
  return prisma.lancamentoDiario.findMany({
    where: { mes: { ano, mes } },
    orderBy: { data: 'desc' },
  });
}

export async function getLancamentosSummary(ano: number, mes: number) {
  const today = new Date();
  const totalMonth = await prisma.lancamentoDiario.aggregate({
    where: { mes: { ano, mes } },
    _sum: { valor: true },
  });

  const totalToday = await prisma.lancamentoDiario.aggregate({
    where: {
      data: { gte: startOfToday(), lt: endOfToday() },
      mes: { ano, mes },
    },
    _sum: { valor: true },
  });

  const totalWeek = await prisma.lancamentoDiario.aggregate({
    where: {
      data: { gte: startOfWeek(today), lt: endOfWeek(today) },
      mes: { ano, mes },
    },
    _sum: { valor: true },
  });

  return {
    totalMonth: totalMonth._sum.valor ?? 0,
    totalToday: totalToday._sum.valor ?? 0,
    totalWeek: totalWeek._sum.valor ?? 0,
  };
}

export async function getTodayTransactions(limit = 5) {
  return prisma.lancamentoDiario.findMany({
    where: { data: { gte: startOfToday(), lt: endOfToday() } },
    orderBy: { data: 'desc' },
    take: limit,
  });
}

export async function getDebtItems(filter: 'all' | 'ativas' | 'quitadas' = 'ativas') {
  const where =
    filter === 'all'
      ? {}
      : filter === 'ativas'
      ? { ativa: true }
      : { ativa: false };
  return prisma.divida.findMany({
    where,
    orderBy: { nome: 'asc' },
  });
}

export async function getHistoryForAnalysis(limit = 24) {
  return prisma.mesFinanceiro.findMany({
    orderBy: [{ ano: 'asc' }, { mes: 'asc' }],
    take: limit,
    include: { buckets: true, cartoes: true },
  });
}

export async function getActiveDebtTotals() {
  const result = await prisma.divida.aggregate({
    where: { ativa: true },
    _sum: { valorParcela: true, saldoDevedor: true },
  });
  return {
    totalParcelas: result._sum.valorParcela ?? 0,
    totalSaldo: result._sum.saldoDevedor ?? 0,
  };
}

export async function getAverageRecentIncome(months = 3) {
  const recent = await prisma.mesFinanceiro.findMany({
    orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    take: months,
    select: { rendaLiquida: true },
  });
  if (recent.length === 0) return 0;
  const sum = recent.reduce((acc, item) => acc + item.rendaLiquida, 0);
  return sum / recent.length;
}
