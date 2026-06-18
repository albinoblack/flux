import Link from 'next/link';
import { getActiveDebtTotals, getAverageRecentIncome, getHistoryForAnalysis } from '@/lib/queries';
import { formatCurrency, formatMonthLabel } from '@/lib/finance';

function computeBucketTotals(history: Awaited<ReturnType<typeof getHistoryForAnalysis>>) {
  const buckets: Record<string, number[]> = {};
  history.forEach((month) => {
    month.buckets.forEach((bucket) => {
      if (!buckets[bucket.nome]) buckets[bucket.nome] = [];
      buckets[bucket.nome].push(bucket.gasto);
    });
  });
  return buckets;
}

function getOverflowRows(history: Awaited<ReturnType<typeof getHistoryForAnalysis>>) {
  const rows: { month: string; bucket: string; excess: number }[] = [];
  history.forEach((month) => {
    month.buckets.forEach((bucket) => {
      if (bucket.meta > 0 && bucket.gasto > bucket.meta) {
        rows.push({ month: formatMonthLabel(month.ano, month.mes), bucket: bucket.nome, excess: ((bucket.gasto / bucket.meta - 1) * 100) });
      }
    });
  });
  return rows;
}

export default async function AnalisePage() {
  const history = await getHistoryForAnalysis(18);
  const averageRecentIncome = await getAverageRecentIncome(3);
  const activeDebt = await getActiveDebtTotals();
  const debtToIncome = averageRecentIncome > 0 ? activeDebt.totalParcelas / averageRecentIncome : 0;
  const bucketTotals = computeBucketTotals(history);
  const overflowRows = getOverflowRows(history);

  const lineData = history.map((month) => ({
    label: formatMonthLabel(month.ano, month.mes),
    renda: month.rendaLiquida,
  }));
  const maxLine = lineData.length ? Math.max(...lineData.map((row) => row.renda)) : 1;
  const maxCardSpend = history.length ? Math.max(...history.map((item) => item.cartoes.reduce((sum, card) => sum + card.valor, 0))) : 1;
  const maxBucketTotal = Object.values(bucketTotals).length
    ? Math.max(...Object.values(bucketTotals).map((v) => v.reduce((sum, n) => sum + n, 0)))
    : 1;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Análise</p>
            <h1 className="text-3xl font-bold text-slate-900">Evolução e composição</h1>
          </div>
          <Link href="/config" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Ajustar configurações
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Evolução da renda líquida</h2>
          <div className="mt-6 space-y-3">
            {lineData.map((item) => {
              const max = Math.max(...lineData.map((row) => row.renda));
              const width = max > 0 ? (item.renda / max) * 100 : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{item.label}</span>
                    <span>{formatCurrency(item.renda)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-slate-950" style={{ width: `${Math.max(8, maxLine > 0 ? (item.renda / maxLine) * 100 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Taxa de endividamento</h2>
          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-slate-100">
              <div className="absolute inset-0 rounded-full border border-slate-200"></div>
              <div className="absolute inset-6 rounded-full bg-white" />
              <p className="text-3xl font-semibold text-slate-900">{Math.round(debtToIncome * 100)}%</p>
            </div>
            <p className="text-center text-slate-600">Parcelas ativas ÷ média da renda dos últimos 3 meses</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Composição de gasto por bucket</h2>
          <div className="mt-6 space-y-4">
            {Object.entries(bucketTotals).map(([bucket, values]) => {
              const total = values.reduce((sum, value) => sum + value, 0);
              return (
                <div key={bucket} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{bucket}</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-slate-950" style={{ width: `${Math.min(100, total / maxBucketTotal * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Gasto em cartões por mês</h2>
          <div className="mt-6 space-y-3">
            {history.map((month) => {
              const spent = month.cartoes.reduce((sum, card) => sum + card.valor, 0);
              const max = Math.max(...history.map((item) => item.cartoes.reduce((sum, card) => sum + card.valor, 0)));
              const width = max > 0 ? (spent / max) * 100 : 0;
              return (
                <div key={`${month.ano}-${month.mes}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>{formatMonthLabel(month.ano, month.mes)}</span>
                    <span>{formatCurrency(spent)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-slate-950" style={{ width: `${Math.max(10, maxCardSpend > 0 ? (spent / maxCardSpend) * 100 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Meses fora da meta</h2>
        {overflowRows.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mês</th>
                  <th className="px-4 py-3">Bucket</th>
                  <th className="px-4 py-3">Excesso</th>
                </tr>
              </thead>
              <tbody>
                {overflowRows.map((row, index) => (
                  <tr key={`${row.month}-${index}`} className="border-b border-slate-100 last:border-none">
                    <td className="px-4 py-4">{row.month}</td>
                    <td className="px-4 py-4">{row.bucket}</td>
                    <td className="px-4 py-4">{Math.round(row.excess)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-slate-600">Nenhum bucket excedeu a meta nos meses analisados.</p>
        )}
      </div>
    </div>
  );
}
