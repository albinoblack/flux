import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Flux</h1>
        <p className="mt-4 max-w-2xl text-slate-700">
          Sistema para gestão financeira pessoal com importação de planilha Excel,
          lançamentos diários e análise de orçamento por buckets.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/importar/planilha"
          className="rounded-3xl border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-sm transition hover:bg-slate-800"
        >
          <h2 className="text-xl font-semibold">Importar planilha</h2>
          <p className="mt-2 text-slate-200">Carregue o arquivo Excel do histórico e gere o preview de importação.</p>
        </Link>
        <Link
          href="/lancamentos"
          className="rounded-3xl border border-slate-200 bg-white px-6 py-8 text-slate-900 shadow-sm transition hover:bg-slate-50"
        >
          <h2 className="text-xl font-semibold">Lançamentos</h2>
          <p className="mt-2 text-slate-700">Gerencie lançamentos diários de débito, Pix, crédito e dinheiro.</p>
        </Link>
      </section>
    </div>
  );
}
