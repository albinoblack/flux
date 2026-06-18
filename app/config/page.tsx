import { addCategorizacaoRule, addCardConfig, toggleCardActive, updateBucketPercentages } from '@/app/actions';
import { getBucketConfigurations, getCardConfigurations, getImportLogs } from '@/lib/queries';
import { formatCurrency } from '@/lib/finance';

export default async function ConfigPage() {
  const buckets = await getBucketConfigurations();
  const cards = await getCardConfigurations();
  const importLogs = await getImportLogs();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
        <p className="mt-2 text-slate-600">Ajuste buckets, cartões e regras de categorização.</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Percentuais de buckets</h2>
        <form action={updateBucketPercentages} className="mt-6 grid gap-4 md:grid-cols-2">
          {buckets.map((bucket) => (
            <div key={bucket.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">{bucket.nome}</label>
              <input
                type="number"
                name={`bucket_${bucket.id}`}
                defaultValue={bucket.percentual}
                step="0.1"
                min="0"
                max="100"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              />
            </div>
          ))}
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Salvar percentuais
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Cartões</h2>
          <div className="mt-4 space-y-3">
            {cards.map((card) => (
              <div key={card.id} className="flex items-center justify-between rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="font-medium text-slate-900">{card.nome}</p>
                  <p className="text-sm text-slate-600">Status: {card.ativo ? 'Ativo' : 'Inativo'}</p>
                </div>
                <form action={toggleCardActive}>
                  <input type="hidden" name="id" value={card.id} />
                  <input type="hidden" name="ativo" value={card.ativo ? 'false' : 'true'} />
                  <button type="submit" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    {card.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </form>
              </div>
            ))}
          </div>
          <form action={addCardConfig} className="mt-6 flex flex-col gap-3">
            <label className="text-sm font-medium text-slate-700">Adicionar cartão</label>
            <input name="nome" placeholder="Nome do cartão" className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" />
            <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">Adicionar</button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Regras de categorização</h2>
          <form action={addCategorizacaoRule} className="mt-6 grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Palavra-chave</label>
              <input name="palavraChave" placeholder="Ex: UBER" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Categoria</label>
              <input name="categoria" placeholder="Ex: Essencial" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">Adicionar regra</button>
            </div>
          </form>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Histórico de imports</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Lidas</th>
                <th className="px-4 py-3">Importadas</th>
                <th className="px-4 py-3">Erros</th>
              </tr>
            </thead>
            <tbody>
              {importLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-100 last:border-none">
                  <td className="px-4 py-4">{new Date(log.criadoEm).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-4">{log.tipo}</td>
                  <td className="px-4 py-4">{log.nomeArquivo}</td>
                  <td className="px-4 py-4">{log.linhasLidas}</td>
                  <td className="px-4 py-4">{log.linhasImportadas}</td>
                  <td className="px-4 py-4">{log.linhasComErro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
