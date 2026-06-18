import Link from 'next/link';
import { createDebt, toggleDebtStatus } from '@/app/actions';
import { getDebtItems, getActiveDebtTotals } from '@/lib/queries';
import { formatCurrency } from '@/lib/finance';

type Props = {
  searchParams?: { filtro?: string };
};

function getFilterValue(filter?: string) {
  if (filter === 'all' || filter === 'quitadas') return filter;
  return 'ativas';
}

export default async function DividasPage({ searchParams }: Props) {
  const filtro = getFilterValue(searchParams?.filtro);
  const dividas = await getDebtItems(filtro);
  const totals = await getActiveDebtTotals();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Dívidas</p>
            <h1 className="text-3xl font-bold text-slate-900">Controle de dívidas</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dividas?filtro=ativas" className="rounded-full border px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100">
              Ativas
            </Link>
            <Link href="/dividas?filtro=quitadas" className="rounded-full border px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100">
              Quitadas
            </Link>
            <Link href="/dividas?filtro=all" className="rounded-full border px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100">
              Todas
            </Link>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
            <p className="text-sm uppercase text-slate-300">Parcelas mensais ativas</p>
            <p className="mt-3 text-3xl font-semibold">{formatCurrency(totals.totalParcelas)}</p>
          </div>
          <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm">
            <p className="text-sm uppercase text-slate-300">Saldo devedor ativo</p>
            <p className="mt-3 text-3xl font-semibold">{formatCurrency(totals.totalSaldo)}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Parcela</th>
              <th className="px-4 py-3">Saldo</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Meses restantes</th>
              <th className="px-4 py-3">Quitação prevista</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {dividas.map((divida) => {
              const meses = divida.valorParcela > 0 ? Math.ceil(divida.saldoDevedor / divida.valorParcela) : 0;
              const quitação = new Date();
              quitação.setMonth(quitação.getMonth() + meses);
              return (
                <tr key={divida.id} className="border-b border-slate-100 last:border-none">
                  <td className="px-4 py-4 font-medium text-slate-900">{divida.nome}</td>
                  <td className="px-4 py-4">{formatCurrency(divida.valorParcela)}</td>
                  <td className="px-4 py-4">{formatCurrency(divida.saldoDevedor)}</td>
                  <td className="px-4 py-4">{divida.tipoPessoa}</td>
                  <td className="px-4 py-4">{meses}</td>
                  <td className="px-4 py-4">{quitação.toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-4">{divida.ativa ? 'Ativa' : 'Quitada'}</td>
                  <td className="px-4 py-4">
                    {divida.ativa ? (
                      <form action={toggleDebtStatus} className="inline">
                        <input type="hidden" name="id" value={divida.id} />
                        <button type="submit" className="rounded-full bg-rose-500 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-600">
                          Quitar
                        </button>
                      </form>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Adicionar dívida</h2>
        <form action={createDebt} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Nome</label>
            <input name="nome" required className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Valor da parcela</label>
            <input name="valorParcela" type="number" step="0.01" required className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Saldo devedor</label>
            <input name="saldoDevedor" type="number" step="0.01" required className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Tipo</label>
            <select name="tipoPessoa" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900">
              <option value="PF">PF</option>
              <option value="PJ">PJ</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Adicionar dívida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
