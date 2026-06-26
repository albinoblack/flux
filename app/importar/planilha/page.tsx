'use client';

import { useState } from 'react';

type PreviewBucket = { nome: string; percentual: number; meta: number; gasto: number };
type PreviewCard   = { cartao: string; valor: number };
type PreviewMonth  = { ano: number; mes: number; rendaLiquida: number; observacoes?: string; buckets: PreviewBucket[]; cartoes: PreviewCard[]; sheetName: string };
type PreviewDebt   = { nome: string; valorParcela: number; saldoDevedor: number; tipoPessoa: string };
type Preview       = { meses: PreviewMonth[]; dividas: PreviewDebt[]; abasIgnoradas: string[]; erros: string[] };

const MESES = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ImportPlanilhaPage() {
  const [file, setFile]           = useState<File | null>(null);
  const [preview, setPreview]     = useState<Preview | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [salvando, setSalvando]   = useState(false);
  const [salvo, setSalvo]         = useState<{ mesesSalvos: number; dividasSalvas: number } | null>(null);

  async function handlePreview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setPreview(null);
    setSalvo(null);
    setLoading(true);

    const fd = new FormData();
    fd.append('arquivo', file);
    fd.append('confirmar', 'false');

    try {
      const res  = await fetch('/api/import-planilha', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Erro desconhecido');
      setPreview(data.preview);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmar() {
    if (!file || !preview) return;
    setSalvando(true);
    setError(null);

    const fd = new FormData();
    fd.append('arquivo', file);
    fd.append('confirmar', 'true');

    try {
      const res  = await fetch('/api/import-planilha', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Erro ao salvar');
      setSalvo(data);
      setPreview(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Importar planilha</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
          Carregue o arquivo Excel (.xlsx) com o histórico financeiro. O sistema gera um preview antes de salvar.
        </p>
      </div>

      {/* Upload */}
      <form onSubmit={handlePreview} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-zinc-300">
          Arquivo .xlsx
        </label>
        <input
          type="file"
          accept=".xlsx"
          required
          onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); setSalvo(null); }}
          className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={loading || !file}
          className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Gerar preview'}
        </button>
      </form>

      {/* Erro */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          <p className="font-semibold">Erro</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Sucesso */}
      {salvo && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Importação concluída!</p>
          <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-500">
            {salvo.mesesSalvos} {salvo.mesesSalvos === 1 ? 'mês salvo' : 'meses salvos'} ·{' '}
            {salvo.dividasSalvas} {salvo.dividasSalvas === 1 ? 'dívida salva' : 'dívidas salvas'}
          </p>
          <p className="mt-2 text-xs text-emerald-500 dark:text-emerald-600">
            Os dados estão no banco e disponíveis em todos os seus dispositivos.
          </p>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          {/* Resumo + botão confirmar */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <p className="font-semibold text-slate-900 dark:text-zinc-100">
                {preview.meses.length} {preview.meses.length === 1 ? 'mês' : 'meses'} · {preview.dividas.length} dívidas
              </p>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                {file?.name} · {preview.abasIgnoradas.length} abas ignoradas
              </p>
            </div>
            <button
              onClick={handleConfirmar}
              disabled={salvando}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Confirmar e salvar'}
            </button>
          </div>

          {/* Meses */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Meses detectados</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {preview.meses.map((mes) => (
                <div key={`${mes.mes}-${mes.ano}`} className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-800/60">
                  <p className="font-semibold text-slate-800 dark:text-zinc-100">
                    {MESES[mes.mes]} {mes.ano}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    Renda líquida: <span className="font-medium text-emerald-600 dark:text-emerald-400">{fmt(mes.rendaLiquida)}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
                    {mes.buckets.map((b) => b.nome).join(' · ')}
                  </p>
                  {mes.cartoes.length > 0 && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
                      Cartões: {mes.cartoes.map((c) => c.cartao).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dívidas */}
          {preview.dividas.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500">Dívidas detectadas</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {preview.dividas.map((d) => (
                  <div key={d.nome} className="rounded-xl bg-slate-50 p-4 dark:bg-zinc-800/60">
                    <p className="font-semibold text-slate-800 dark:text-zinc-100">{d.nome}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                      Parcela: <span className="font-medium text-rose-600 dark:text-rose-400">{fmt(d.valorParcela)}</span>
                    </p>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      Saldo: <span className="font-medium">{fmt(d.saldoDevedor)}</span> · {d.tipoPessoa}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Erros/Avisos */}
          {(preview.erros.length > 0 || preview.abasIgnoradas.length > 0) && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Avisos</p>
              {preview.abasIgnoradas.length > 0 && (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-500">
                  Abas ignoradas: {preview.abasIgnoradas.join(', ')}
                </p>
              )}
              {preview.erros.map((e, i) => (
                <p key={i} className="mt-1 text-sm text-amber-600 dark:text-amber-500">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
