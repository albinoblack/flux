import Link from 'next/link';
import { getActiveDebtTotals, getCurrentMonth, getLastMonths, getTodayTransactions } from '@/lib/queries';
import { bucketProgressColor, clampPercent, formatCurrency, formatMonthLabel } from '@/lib/finance';

export default async function DashboardPage() {
  const month = await getCurrentMonth();
  const lastMonths = await getLastMonths(12);
  const todayTransactions = await getTodayTransactions(5);
  const debtTotals = await getActiveDebtTotals();

  if (!month) {
    return (
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-slate-600">
          Nenhum mês cadastrado ainda. Comece importando sua planilha na página de importação.
        </p>
        <Link href="/importar/planilha" className="inline-flex rounded-2xl bg-brand-600 px-5 py-3 text-white transition hover:bg-slate-800">
          Importar planilha
        </Link>
      </div>
    );
  }

  const totalCard = month.cartoes.reduce((sum, item) => sum + item.valor, 0);
  const totalLancamentos = month.lancamentos.reduce((sum, item) => sum + item.valor, 0);
  const totalGasto = totalCard + totalLancamentos;
  const saldoDisponivel = month.rendaLiquida - totalGasto;
  const metaBuckets = month.buckets.map((bucket) => ({
    nome: bucket.nome,
    meta: bucket.meta,
    gasto: bucket.gasto,
    ratio: bucket.meta > 0 ? bucket.gasto / bucket.meta : 0,
  }));

  const maxIncome = lastMonths.length > 0 ? Math.max(...lastMonths.map((item) => Math.abs(item.rendaLiquida || 0))) : 1;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Dashboard</p>
            <h1 className="text-3xl font-bold text-slate-900">Resumo do mês atual</h1>
            <p className="mt-2 text-slate-600">Dados consolidados do mês, gasto de hoje e comportamento por bucket.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-brand-600 px-5 py-4 text-white shadow-sm">
              <p className="text-xs uppercase tracking-wide text-brand-200">Renda líquida</p>
              <p className="mt-3 text-2xl font-semibold">{formatCurrency(month.rendaLiquida)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total gasto</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(totalGasto)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Saldo disponível</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(saldoDisponivel)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">Parcelas de dívida</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(debtTotals.totalParcelas)}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Gasto de hoje</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(todayTransactions.reduce((sum, item) => sum + item.valor, 0))}</p>
            </div>
            <Link href="/lancamentos" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Ver lançamentos
            </Link>
          </div>
          <div className="space-y-4">
            {todayTransactions.length > 0 ? (
              todayTransactions.map((item) => (
                <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{item.descricao || 'Sem descrição'}</p>
                      <p className="text-sm text-slate-500">{item.meioPagamento} · {item.categoria || 'Sem categoria'}</p>
                    </div>
                    <p className="font-semibold text-slate-900">{formatCurrency(item.valor)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-600">Nenhum gasto registrado hoje.</p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Cartões do mês</h2>
          <div className="mt-4 space-y-3">
            {month.cartoes.length > 0 ? (
              month.cartoes.map((cartao) => {
                const percent = totalCard > 0 ? (cartao.valor / totalCard) * 100 : 0;
                return (
                  <div key={cartao.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-slate-900">{cartao.cartao}</p>
                      <p className="text-sm text-slate-600">{formatCurrency(cartao.valor)}</p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-600">Nenhum cartão cadastrado neste mês.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Meta vs. realizado por bucket</h2>
          <div className="mt-6 space-y-4">
            {metaBuckets.map((bucket) => {
              return (
                <div key={bucket.nome} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{bucket.nome}</span>
                    <span>{formatCurrency(bucket.gasto)} / {formatCurrency(bucket.meta)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div className={`${bucketProgressColor(bucket.ratio)} h-full`} style={{ width: `${Math.min(100, bucket.ratio * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Saldo disponível</h2>
          <div className="mt-6 space-y-4">
            {lastMonths.map((item) => {
              const monthlySpent = item.cartoes.reduce((sum, card) => sum + card.valor, 0) + item.lancamentos.reduce((sum, lanc) => sum + lanc.valor, 0);
              const available = item.rendaLiquida - monthlySpent;
              const width = maxIncome > 0 ? (available / maxIncome) * 100 : 0;
              return (
                <div key={`${item.ano}-${item.mes}`} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{formatMonthLabel(item.ano, item.mes)}</span>
                    <span>{formatCurrency(available)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(10, Math.min(100, width))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
}
