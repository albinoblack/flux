import Link from 'next/link';
import { getActiveDebtTotals, getCurrentMonth, getLastMonths, getTodayTransactions } from '@/lib/queries';
import { formatCurrency, formatMonthLabel } from '@/lib/finance';

const BUCKET_STYLE: Record<string, { bar: string; text: string }> = {
  'Essencial':  { bar: 'bg-sky-500',     text: 'text-sky-600 dark:text-sky-400' },
  'Streaming':  { bar: 'bg-violet-500',  text: 'text-violet-600 dark:text-violet-400' },
  'Objetivos':  { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  'Reserva':    { bar: 'bg-amber-500',   text: 'text-amber-600 dark:text-amber-400' },
  'Pé na Jaca': { bar: 'bg-rose-500',    text: 'text-rose-600 dark:text-rose-400' },
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
      borderTop: 'border-t-violet-500',
      text: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Saldo disponível',
      value: saldoDisponivel,
      borderTop: saldoDisponivel >= 0 ? 'border-t-emerald-500' : 'border-t-rose-500',
      text: saldoDisponivel >= 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Total gasto',
      value: Math.abs(totalGasto),
      borderTop: 'border-t-rose-500',
      text: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Parcelas de dívida',
      value: debtTotals.totalParcelas,
      borderTop: 'border-t-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
    },
  ];

  const maxSpend = Math.max(
    1,
    ...lastMonths.map(m =>
      Math.abs(
        m.cartoes.reduce((s, c) => s + c.valor, 0) +
        m.lancamentos.reduce((s, l) => s + l.valor, 0)
      )
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
            {month ? formatMonthLabel(month.ano, month.mes) : 'Sem dados'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-zinc-100">Dashboard</h1>
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
            className={`rounded-2xl border border-slate-200 border-t-2 ${kpi.borderTop} bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none`}
          >
            <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-zinc-500">
              {kpi.label}
            </p>
            <p className={`mt-3 text-xl font-bold lg:text-2xl ${kpi.text}`}>
              {formatCurrency(kpi.value)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Buckets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Buckets — meta vs. realizado
          </h2>
          <div className="mt-5 space-y-5">
            {month?.buckets.length ? (
              month.buckets.map((bucket) => {
                const style = BUCKET_STYLE[bucket.nome] ?? { bar: 'bg-slate-400', text: 'text-slate-500 dark:text-zinc-400' };
                const ratio = bucket.meta > 0 ? bucket.gasto / bucket.meta : 0;
                const pct = Math.min(100, ratio * 100);
                const over = ratio > 1;
                return (
                  <div key={bucket.id}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className={`font-semibold ${style.text}`}>{bucket.nome}</span>
                      <span className="text-slate-500 dark:text-zinc-400">
                        {formatCurrency(bucket.gasto)}
                        <span className="text-slate-300 dark:text-zinc-700"> / {formatCurrency(bucket.meta)}</span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : style.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-right text-[11px] text-slate-400 dark:text-zinc-600">
                      {Math.round(pct)}%{over && ' — acima do limite'}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 dark:text-zinc-600">
                Nenhum bucket configurado.{' '}
                <Link href="/importar/planilha" className="text-violet-600 underline hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300">
                  Importe sua planilha
                </Link>{' '}
                para começar.
              </p>
            )}
          </div>
        </div>

        {/* Lançamentos de hoje */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Hoje
            </h2>
            <Link href="/lancamentos" className="text-xs text-violet-600 transition hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300">
              Ver todos →
            </Link>
          </div>

          {todayTransactions.length > 0 ? (
            <>
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-zinc-100">
                {formatCurrency(
                  Math.abs(todayTransactions.filter(t => t.valor < 0).reduce((s, t) => s + t.valor, 0))
                )}
                <span className="ml-2 text-sm font-normal text-slate-400 dark:text-zinc-500">em saídas</span>
              </p>
              <div className="mt-4 space-y-2">
                {todayTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-zinc-800/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-zinc-200">
                        {t.descricao || 'Sem descrição'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                        {t.categoria || t.meioPagamento}
                      </p>
                    </div>
                    <span
                      className={`ml-3 shrink-0 text-sm font-bold ${
                        t.valor >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {t.valor >= 0 ? '+' : ''}{formatCurrency(t.valor)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-400 dark:text-zinc-600">Nenhum lançamento hoje.</p>
          )}
        </div>
      </div>

      {/* Tendência mensal */}
      {lastMonths.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
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
                  <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                    {formatCurrency(spent).replace('R$ ', '')}
                  </span>
                  <div
                    className="relative w-full overflow-hidden rounded-t-lg bg-slate-100 dark:bg-zinc-800"
                    style={{ height: '80px' }}
                  >
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all ${
                        isCurrent
                          ? 'bg-violet-500 shadow-lg shadow-violet-500/30'
                          : 'bg-violet-200 dark:bg-violet-500/30'
                      }`}
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      isCurrent
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
            Cartões do mês
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {month.cartoes.map((c) => {
              const pct = totalCard > 0 ? (c.valor / totalCard) * 100 : 0;
              return (
                <div
                  key={c.id}
                  className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-800/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{c.cartao}</span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(c.valor)}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[11px] text-slate-400 dark:text-zinc-600">
                    {Math.round(pct)}% do total
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
