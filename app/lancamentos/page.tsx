import Link from 'next/link';
import { getCurrentMonth, getLancamentosForMonth, getLancamentosSummary } from '@/lib/queries';
import { formatCurrency } from '@/lib/finance';

type Props = {
  searchParams?: { ano?: string; mes?: string; categoria?: string; meio?: string; busca?: string };
};

export default async function LancamentosPage({ searchParams }: Props) {
  const currentMonth = await getCurrentMonth();
  const ano = searchParams?.ano ? Number(searchParams.ano) : currentMonth?.ano;
  const mes = searchParams?.mes ? Number(searchParams.mes) : currentMonth?.mes;
  let lancamentos: any[] = [];
  let totals = { totalMonth: 0, totalToday: 0, totalWeek: 0 };

  if (ano && mes) {
    lancamentos = await getLancamentosForMonth(ano, mes);
    totals = await getLancamentosSummary(ano, mes);
  }

  const categoriaFiltro = searchParams?.categoria?.toLowerCase() || '';
  const meioFiltro = searchParams?.meio?.toLowerCase() || '';
  const busca = searchParams?.busca?.toLowerCase() || '';

  const filtered = lancamentos.filter((item) => {
    const matchesCategoria = categoriaFiltro ? item.categoria?.toLowerCase().includes(categoriaFiltro) : true;
    const matchesMeio = meioFiltro ? item.meioPagamento.toLowerCase() === meioFiltro : true;
    const matchesBusca = busca ? item.descricao.toLowerCase().includes(busca) : true;
    return matchesCategoria && matchesMeio && matchesBusca;
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Lançamentos</p>
            <h1 className="text-3xl font-bold text-slate-900">Registros do mês</h1>
          </div>
          <Link href="/" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Voltar ao dashboard
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-slate-950 p-4 text-white">
            <p className="text-sm uppercase text-slate-300">Hoje</p>
            <p className="mt-3 text-2xl font-semibold">{formatCurrency(totals.totalToday)}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-sm uppercase text-slate-500">Esta semana</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(totals.totalWeek)}</p>
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <p className="text-sm uppercase text-slate-500">Este mês</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{formatCurrency(totals.totalMonth)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Filtros</h2>
        <form method="get" className="mt-4 grid gap-4 sm:grid-cols-3">
          <input name="categoria" defaultValue={searchParams?.categoria || ''} placeholder="Categoria" className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" />
          <select name="meio" defaultValue={searchParams?.meio || ''} className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900">
            <option value="">Todos os meios</option>
            <option value="debito">Débito</option>
            <option value="pix">Pix</option>
            <option value="credito">Crédito</option>
            <option value="dinheiro">Dinheiro</option>
          </select>
          <div className="flex items-center gap-3">
            <input name="busca" defaultValue={searchParams?.busca || ''} placeholder="Buscar descrição" className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" />
            <button type="submit" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Aplicar
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Descrição</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Meio</th>
              <th className="px-4 py-3">Cartão</th>
              <th className="px-4 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 last:border-none">
                <td className="px-4 py-4">{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-4">{item.descricao}</td>
                <td className="px-4 py-4">{item.categoria || '—'}</td>
                <td className="px-4 py-4">{item.meioPagamento}</td>
                <td className="px-4 py-4">{item.cartao || '—'}</td>
                <td className="px-4 py-4">{formatCurrency(item.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <p className="mt-4 text-slate-600">Nenhum lançamento encontrado com os filtros atuais.</p> : null}
      </div>
    </div>
  );
}
