import Link from 'next/link';
import { getAllMonthKeys, getMonth } from '@/lib/queries';
import { formatCurrency, formatMonthLabel } from '@/lib/finance';

type Params = {
  params: { ano: string; mes: string };
};

function findNavigation(months: { ano: number; mes: number }[], ano: number, mes: number) {
  const index = months.findIndex((item) => item.ano === ano && item.mes === mes);
  const prev = index > 0 ? months[index - 1] : null;
  const next = index >= 0 && index < months.length - 1 ? months[index + 1] : null;
  return { prev, next };
}

export default async function MesPage({ params }: Params) {
  const ano = Number(params.ano);
  const mes = Number(params.mes);
  const month = await getMonth(ano, mes);
  const months = await getAllMonthKeys();
  const navigation = findNavigation(months, ano, mes);

  if (!month) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Mês {formatMonthLabel(ano, mes)}</h1>
        <p className="mt-3 text-slate-600">Mês não encontrado. Importe a planilha para disponibilizar os dados.</p>
      </div>
    );
  }

  const totalCard = month.cartoes.reduce((sum, item) => sum + item.valor, 0);
  const totalLancamentos = month.lancamentos.reduce((sum, item) => sum + item.valor, 0);
  const totalGasto = totalCard + totalLancamentos;
  const saldoDisponivel = month.rendaLiquida - totalGasto;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Mês</p>
          <h1 className="text-3xl font-bold text-slate-900">{formatMonthLabel(month.ano, month.mes)}</h1>
          <p className="mt-2 text-slate-600">Renda: {formatCurrency(month.rendaLiquida)} · Saldo disponível: {formatCurrency(saldoDisponivel)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {navigation.prev ? (
            <Link href={`/mes/${navigation.prev.ano}/${navigation.prev.mes}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              Mês anterior
            </Link>
          ) : null}
          {navigation.next ? (
            <Link href={`/mes/${navigation.next.ano}/${navigation.next.mes}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              Próximo mês
            </Link>
          ) : null}
          <button className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900">Editar renda do mês</button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Buckets</h2>
          <div className="mt-4 space-y-4">
            {month.buckets.map((bucket) => {
              const saldo = bucket.meta - bucket.gasto;
              return (
                <div key={bucket.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold text-slate-900">{bucket.nome}</p>
                    <p className="text-sm text-slate-600">{Math.round(bucket.percentual * 100)}%</p>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <span className="text-sm text-slate-600">Meta {formatCurrency(bucket.meta)}</span>
                    <span className="text-sm text-slate-600">Gasto {formatCurrency(bucket.gasto)}</span>
                    <span className="text-sm text-slate-600">Disponível {formatCurrency(saldo)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Cartões</h2>
          <div className="mt-4 space-y-3">
            {month.cartoes.length > 0 ? (
              month.cartoes.map((cartao) => (
                <div key={cartao.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-slate-900">{cartao.cartao}</p>
                    <p className="text-slate-600">{formatCurrency(cartao.valor)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-600">Nenhum cartão cadastrado neste mês.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Lançamentos do mês</h2>
        <div className="mt-4 space-y-3">
          {month.lancamentos.length > 0 ? (
            month.lancamentos.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.descricao || 'Sem descrição'}</p>
                    <p className="text-sm text-slate-500">{item.categoria || 'Sem categoria'} · {item.meioPagamento}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatCurrency(item.valor)}</p>
                    <p className="text-sm text-slate-500">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-600">Nenhum lançamento diário registrado neste mês.</p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Observações</h2>
        <p className="mt-4 text-slate-600">{month.observacoes || 'Sem observações cadastradas.'}</p>
      </div>
    </div>
  );
}
