'use client';

import { useState } from 'react';

type PreviewBucket = {
  nome: string;
  percentual: number;
  meta: number;
  gasto: number;
};

type PreviewCard = {
  cartao: string;
  valor: number;
};

type PreviewMonth = {
  ano: number;
  mes: number;
  rendaLiquida: number;
  observacoes?: string;
  buckets: PreviewBucket[];
  cartoes: PreviewCard[];
  sheetName: string;
};

type PreviewDebt = {
  nome: string;
  valorParcela: number;
  saldoDevedor: number;
  tipoPessoa: string;
};

type ResponseData = {
  preview?: {
    meses: PreviewMonth[];
    dividas: PreviewDebt[];
    abasIgnoradas: string[];
    erros: string[];
  };
  error?: string;
};

export default function ImportPlanilhaPage() {
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ResponseData['preview'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPreview(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch('/api/import-planilha', {
      method: 'POST',
      body: formData,
    }).catch((err) => {
      setError('Erro ao enviar o arquivo: ' + err);
      setLoading(false);
    });

    if (!response) return;
    const data: ResponseData = await response.json();

    if (!response.ok || data.error) {
      setError(data.error || 'Erro desconhecido ao processar a planilha.');
    } else {
      setPreview(data.preview || null);
      setFileName((event.currentTarget.elements as any).arquivo?.files?.[0]?.name || '');
    }

    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Importar planilha</h1>
        <p className="mt-3 text-slate-600">
          Carregue o arquivo Excel com o histórico para gerar um preview dos meses
          e dívidas. O parser aceita variações de layout nas abas e valores
          em formato brasileiro.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <label className="mb-3 block text-sm font-medium text-slate-700">Arquivo .xlsx</label>
        <input
          type="file"
          name="arquivo"
          accept=".xlsx"
          className="block w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Gerar preview'}
        </button>
      </form>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-semibold">Erro</p>
          <p>{error}</p>
        </div>
      ) : null}

      {preview ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold">Preview de importação</h2>
            <p className="mt-2 text-slate-600">Arquivo: {fileName}</p>
            <p className="mt-2 text-slate-600">
              Meses detectados: <strong>{preview.meses.length}</strong> | Dívidas detectadas:{' '}
              <strong>{preview.dividas.length}</strong> | Abas ignoradas:{' '}
              <strong>{preview.abasIgnoradas.length}</strong>
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Meses</h3>
              <div className="mt-4 space-y-4">
                {preview.meses.map((mes) => (
                  <div key={`${mes.mes}-${mes.ano}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="font-semibold">{mes.sheetName}</p>
                    <p className="text-slate-600">Mês/Ano: {mes.mes}/{mes.ano}</p>
                    <p className="text-slate-600">Renda líquida: R$ {mes.rendaLiquida.toFixed(2)}</p>
                    <p className="text-slate-600">Buckets: {mes.buckets.map((bucket) => bucket.nome).join(', ')}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Dívidas</h3>
              <div className="mt-4 space-y-4">
                {preview.dividas.map((divida) => (
                  <div key={divida.nome} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="font-semibold">{divida.nome}</p>
                    <p className="text-slate-600">Tipo: {divida.tipoPessoa}</p>
                    <p className="text-slate-600">
                      Parcela: R$ {divida.valorParcela.toFixed(2)} | Saldo: R$ {divida.saldoDevedor.toFixed(2)}
                    </p>
                  </div>
                ))}
                {preview.dividas.length === 0 ? <p className="text-slate-600">Nenhuma dívida encontrada.</p> : null}
              </div>
            </div>
          </div>

          {preview.abasIgnoradas.length > 0 ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Abas ignoradas</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
                {preview.abasIgnoradas.map((nome) => (
                  <li key={nome}>{nome}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {preview.erros.length > 0 ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <h3 className="text-xl font-semibold">Erros detectados</h3>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-red-700">
                {preview.erros.map((mensagem, index) => (
                  <li key={index}>{mensagem}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
