'use client';

// app/importar/extrato/page.tsx
import { useState } from 'react';

const BUCKETS = ['Essencial', 'Streaming', 'Objetivos', 'Reserva', 'Pé na Jaca', 'Entrada'];
const CATEGORIAS_POR_BUCKET: Record<string, string[]> = {
  Essencial: ['Telefone/Internet', 'Saúde/Plano', 'Seguro', 'Banco', 'Conta fixa', 'Supermercado', 'Farmácia', 'Combustível', 'Alimentação', 'Alimentação delivery', 'Transporte', 'Moradia', 'Empréstimo', 'Parcela/Financiamento', 'Pagamento de fatura', 'Transferência própria', 'FIES', 'Associação/Assistência', 'Outros'],
  Streaming: ['Netflix', 'Spotify', 'YouTube Premium', 'Amazon Prime', 'Disney+', 'HBO Max', 'Software/Assinatura', 'Canva', 'Meli+', 'Gringo (IPVA/Licenciamento)', 'Igreja/Oferta', 'Concursos/Estudo', 'Outros'],
  Objetivos: ['Terapia', 'Educação', 'Livros', 'Investimento', 'Outros'],
  Reserva: ['Reserva', 'Outros'],
  'Pé na Jaca': ['Compras/Roupas', 'Lazer/Entretenimento', 'Bar/Lazer', 'Hospedagem', 'Jogos', 'Compras online', 'Outros'],
  Entrada: ['Receita', 'Salário', 'Freelance', 'Transferência recebida', 'Outros'],
};

type TransacaoPreview = {
  data: string;
  valor: number;
  descricao: string;
  tipo: 'entrada' | 'saida';
  identificador?: string;
  source: string;
  bucket: string;
  categoria: string;
  isFixed: boolean;
  confianca: 'alta' | 'media' | 'baixa';
};

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

const confiancaCor: Record<string, string> = {
  alta: 'bg-green-100 text-green-800',
  media: 'bg-yellow-100 text-yellow-800',
  baixa: 'bg-red-100 text-red-800',
};

export default function ImportarExtratoPage() {
  const [source, setSource] = useState('nubank');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<TransacaoPreview[] | null>(null);
  const [editado, setEditado] = useState<TransacaoPreview[]>([]);
  const [resultado, setResultado] = useState<{ salvos: number; duplicatas: number } | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'entrada' | 'saida' | 'baixa'>('todos');

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setPreview(null);
    setResultado(null);
    setLoading(true);

    const fd = new FormData();
    fd.append('arquivo', file);
    fd.append('source', source);
    fd.append('confirmar', 'false');

    try {
      const res = await fetch('/api/import-extrato', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreview(data.preview);
      setEditado(data.preview);
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  function atualizarTransacao(idx: number, campo: keyof TransacaoPreview, valor: any) {
    setEditado((prev) => {
      const novo = [...prev];
      novo[idx] = { ...novo[idx], [campo]: valor };
      // Ao mudar bucket, reseta categoria
      if (campo === 'bucket') {
        novo[idx].categoria = CATEGORIAS_POR_BUCKET[valor]?.[0] ?? 'Outros';
      }
      return novo;
    });
  }

  async function handleConfirmar() {
    setSalvando(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('source', source);
      fd.append('confirmar', 'true');
      fd.append('transacoes', JSON.stringify(editado));
      // arquivo dummy — API só usa transacoes quando confirmar=true
      fd.append('arquivo', new Blob([''], { type: 'text/plain' }), 'dummy.csv');

      const res = await fetch('/api/import-extrato', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultado(data);
      setPreview(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  const transacoesFiltradas = editado.filter((t) => {
    if (filtro === 'entrada') return t.valor > 0;
    if (filtro === 'saida') return t.valor < 0;
    if (filtro === 'baixa') return t.confianca === 'baixa';
    return true;
  });

  const totalEntradas = editado.filter((t) => t.valor > 0).reduce((s, t) => s + t.valor, 0);
  const totalSaidas = editado.filter((t) => t.valor < 0).reduce((s, t) => s + t.valor, 0);
  const baixaConfianca = editado.filter((t) => t.confianca === 'baixa').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Importar extrato</h1>
        <p className="mt-2 text-slate-600">
          Suba o extrato do banco (CSV ou PDF). O sistema classifica automaticamente em buckets e categorias.
          Revise antes de confirmar.
        </p>
      </div>

      {/* Upload */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Banco</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 w-full max-w-xs"
          >
            <option value="nubank">Nubank (conta corrente)</option>
            <option value="mercado_pago" disabled>Mercado Pago (em breve)</option>
            <option value="bb" disabled>Banco do Brasil (em breve)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo (.csv ou .pdf)</label>
          <input
            type="file"
            accept=".csv,.pdf"
            onChange={handleUpload}
            disabled={loading}
            className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          />
        </div>
        {loading && <p className="text-sm text-slate-500 animate-pulse">Processando extrato...</p>}
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">Erro</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {resultado && (
        <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
          <p className="text-xl font-semibold text-green-800">Importação concluída!</p>
          <p className="mt-1 text-green-700">{resultado.salvos} transações salvas · {resultado.duplicatas} duplicatas ignoradas</p>
        </div>
      )}

      {/* Preview + Revisão */}
      {preview && editado.length > 0 && (
        <div className="space-y-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Total de itens</p>
              <p className="mt-1 text-2xl font-bold">{editado.length}</p>
            </div>
            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="text-xs text-green-700 uppercase tracking-wide">Entradas</p>
              <p className="mt-1 text-2xl font-bold text-green-700">{formatCurrency(totalEntradas)}</p>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs text-red-700 uppercase tracking-wide">Saídas</p>
              <p className="mt-1 text-2xl font-bold text-red-700">{formatCurrency(Math.abs(totalSaidas))}</p>
            </div>
            <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
              <p className="text-xs text-yellow-700 uppercase tracking-wide">Baixa confiança</p>
              <p className="mt-1 text-2xl font-bold text-yellow-700">{baixaConfianca}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            {(['todos', 'saida', 'entrada', 'baixa'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  filtro === f ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {f === 'todos' ? 'Todos' : f === 'saida' ? 'Saídas' : f === 'entrada' ? 'Entradas' : '⚠ Baixa confiança'}
              </button>
            ))}
          </div>

          {/* Tabela de revisão */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide w-24">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Descrição</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wide w-28">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide w-36">Bucket</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide w-44">Categoria</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wide w-20">Fixo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transacoesFiltradas.map((t, displayIdx) => {
                    // Encontra o índice real em editado
                    const realIdx = editado.indexOf(t);
                    return (
                      <tr key={realIdx} className={t.confianca === 'baixa' ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(t.data)}</td>
                        <td className="px-4 py-3">
                          <p className="text-slate-900 font-medium leading-tight">{t.descricao}</p>
                          <span className={`mt-0.5 inline-block text-xs px-1.5 py-0.5 rounded-full ${confiancaCor[t.confianca]}`}>
                            {t.confianca}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${t.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.valor >= 0 ? '+' : ''}{formatCurrency(t.valor)}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={t.bucket}
                            onChange={(e) => atualizarTransacao(realIdx, 'bucket', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                          >
                            {BUCKETS.map((b) => <option key={b}>{b}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={t.categoria}
                            onChange={(e) => atualizarTransacao(realIdx, 'categoria', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                          >
                            {(CATEGORIAS_POR_BUCKET[t.bucket] ?? ['Outros']).map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={t.isFixed}
                            onChange={(e) => atualizarTransacao(realIdx, 'isFixed', e.target.checked)}
                            className="h-4 w-4 rounded accent-slate-800"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Confirmar */}
          <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-slate-600 text-sm">
              {editado.length} transações prontas para salvar.
              {baixaConfianca > 0 && (
                <span className="ml-2 text-yellow-700">⚠ {baixaConfianca} com baixa confiança — revise antes.</span>
              )}
            </p>
            <button
              onClick={handleConfirmar}
              disabled={salvando}
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition"
            >
              {salvando ? 'Salvando...' : 'Confirmar e salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
