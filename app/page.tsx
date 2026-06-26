import Link from 'next/link';
import { getActiveDebtTotals, getCurrentMonth, getLastMonths, getTodayTransactions } from '@/lib/queries';
import { formatCurrency, formatMonthLabel } from '@/lib/finance';

const BUCKET_STYLE: Record<string, { bar: string; text: string; ring: string }> = {
  'Essencial':   { bar: 'bg-sky-500',     text: 'text-sky-400',     ring: 'ring-sky-500/20' },
  'Streaming':   { bar: 'bg-violet-500',  text: 'text-violet-400',  ring: 'ring-violet-500/20' },
  'Objetivos':   { bar: 'bg-emerald-500', text: 'text-emerald-400', ring: 'ring-emerald-500/20' },
  'Reserva':     { bar: 'bg-amber-500',   text: 'text-amber-400',   ring: 'ring-amber-500/20' },
  'Pé na Jaca':  { bar: 'bg-rose-500',    text: 'text-rose-400',    ring: 'ring-rose-500/20' },
};

export default async function DashboardPage() {
  const month = await getCurrentMonth();
  const lastMonths = await getLastMonths(6);
  const todayTransactions = await getTodayTransactions(8);
  const debtTotals = await getActiveDebtTotals();

  const totalCard = month?.cartoes.reduce((s, c) => s + c.valor, 0) ?? 0;
  const totalLancamentos = month?.lancamentos.reduce((s, l) => s + l.valor, 0) ?? 0;
  const totalGasto = totalCard + totalLancamentos;
  const saldoDisponivel = (month?.rendaLiquida ?? 0) - totalGasto;

  const kpis = [
    {
      label: 'Renda líquida',
      value: month?.rendaLiquida ?? 0,
      border: 'border-t-violet-500',
      text: 'text-violet-400',
      shadow: 'shadow-violet-500/10',
    },
    {
      label: 'Saldo disponível',
      value: saldoDisponivel,
      border: saldoDisponivel >= 0 ? 'border-t-emerald-500' : 'border-t-rose-500',
      text: saldoDisponivel >= 0 ? 'text-emerald-400' : 'text-rose-400',
      shadow: saldoDisponivel >= 0 ? 'shadow-emerald-500/10' : 'shadow-rose-500/10',
    },
    {
      label: 'Total gasto',
      value: Math.abs(totalGasto),
      border: 'border-t-rose-500',
      text: 'text-rose-400',
      shadow: 'shadow-rose-500/10',
    },
    {
      label: 'Parcelas de dívida',
      value: debtTotals.totalParcelas,
      border: 'border-t-amber-500',
      text: 'text-amber-400',
      shadow: 'shadow-amber-500/10',
    },
  ];

  const maxSpend = lastMonths.length > 0
    ? Math.max(1, ...lastMonths.map(m =>
        Math.abs(
          m.cartoes.reduce((s, c) => s + c.valor, 0) +
          m.lancamentos.reduce((s, l) => s + l.valor, 0)
        )
      ))
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            {month ? formatMonthLabel(month.ano, month.mes) : 'Sem dados'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-100">Dashboard</h1>
        </div>
        <Link
          href="/importar/extrato"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500"
        >
          + Importar extrato
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-2xl border border-zinc-800 border-t-2 ${kpi.border} bg-zinc-900 p-5 shadow-lg ${kpi.shadow}`}
          >
            <p className="text-xs uppercase tracking-wide text-zinc-500">{kpi.label}</p>
            <p className={`mt-3 text-xl font-bold lg:text-2xl ${kpi.text}`}>
              {formatCurrency(kpi.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Buckets */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Buckets — meta vs. realizado
          </h2>
          <div className="mt-5 space-y-5">
            {month?.buckets.length ? (
              month.buckets.map((bucket) => {
                const style = BUCKET_STYLE[bucket.nome] ?? { bar: 'bg-zinc-500', text: 'text-zinc-400', ring: '' };
                const ratio = bucket.meta > 0 ? bucket.gasto / bucket.meta : 0;
                const pct = Math.min(100, ratio * 100);
                const over = ratio > 1;
                return (
                  <div key={bucket.id}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className={`font-semibold ${style.text}`}>{bucket.nome}</span>
                      <span className="text-zinc-400">
                        {formatCurrency(bucket.gasto)}
                        <span className="text-zinc-700"> / {formatCurrency(bucket.meta)}</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : style.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[11px] text-zinc-600">
                      {Math.round(pct)}%{over && ' — acima do limite'}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-zinc-600">
                Nenhum bucket configurado.{' '}
                <Link href="/importar/planilha" className="text-violet-400 hover:text-violet-300 underline">
                  Importe sua planilha
                </Link>{' '}
                para começar.
              </p>
            )}
          </div>
        </div>

        {/* Lançamentos de hoje */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Hoje</h2>
            <Link href="/lancamentos" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
              Ver todos →
            </Link>
          </div>

          {todayTransactions.length > 0 ? (
            <>
              <p className="mt-3 text-2xl font-bold text-zinc-100">
                {formatCurrency(Math.abs(todayTransactions.filter(t => t.valor < 0).reduce((s, t) => s + t.valor, 0)))}
                <span className="ml-2 text-sm font-normal text-zinc-500">em saídas</span>
              </p>
              <div className="mt-4 space-y-2">
                {todayTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl bg-zinc-800/50 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-200">{t.descricao || 'Sem descrição'}</p>
                      <p className="text-[11px] text-zinc-500">{t.categoria || t.meioPagamento}</p>
                    </div>
                    <span
                      className={`ml-3 shrink-0 text-sm font-bold ${
                        t.valor >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {t.valor >= 0 ? '+' : ''}{formatCurrency(t.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-zinc-600">Nenhum lançamento hoje.</p>
          )}
        </div>
      </div>

      {/* Tendência mensal — bar chart CSS */}
      {lastMonths.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Gasto mensal — últimos {lastMonths.length} meses
          </h2>
          <div className="mt-6 flex items-end gap-2 lg:gap-4">
            {[...lastMonths].reverse().map((m) => {
              const spent = Math.abs(
                m.cartoes.reduce((s, c) => s + c.valor, 0) +
                m.lancamentos.reduce((s, l) => s + l.valor, 0)
              );
              const heightPct = (spent / maxSpend) * 100;
              const isCurrent = month?.ano === m.ano && month?.mes === m.mes;
              return (
                <div key={`${m.ano}-${m.mes}`} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-medium text-zinc-500">
                    {formatCurrency(spent).replace('R$ ', 'R$ ')}
                  </span>
                  <div className="relative w-full rounded-t-lg overflow-hidden bg-zinc-800" style={{ height: '80px' }}>
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all ${
                        isCurrent ? 'bg-violet-500 shadow-lg shadow-violet-500/30' : 'bg-violet-500/30'
                      }`}
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${isCurrent ? 'text-violet-400' : 'text-zinc-500'}`}>
                    {formatMonthLabel(m.ano, m.mes)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cartões */}
      {!!month?.cartoes.length && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Cartões do mês</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {month.cartoes.map((c) => {
              const pct = totalCard > 0 ? (c.valor / totalCard) * 100 : 0;
              return (
                <div key={c.id} className="rounded-xl bg-zinc-800/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">{c.cartao}</span>
                    <span className="text-sm font-bold text-rose-400">{formatCurrency(c.valor)}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-700">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[11px] text-zinc-600">{Math.round(pct)}% do total</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
