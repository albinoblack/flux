'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addLancamento } from '@/app/actions';

export default function QuickAddButton() {
  const [open, setOpen] = useState(false);
  const status = useFormStatus();
  const pending = status?.pending;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white shadow-2xl transition hover:bg-slate-800"
      >
        +
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Lançamento rápido</h2>
              <button type="button" className="text-slate-500" onClick={() => setOpen(false)}>
                Fechar
              </button>
            </div>
            <form action={addLancamento} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Valor</label>
                <input name="valor" type="number" step="0.01" required className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" autoFocus />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Descrição</label>
                <input name="descricao" type="text" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" placeholder="Ifood, mercado, gasolina" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Data</label>
                  <input name="data" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Meio</label>
                  <select name="meioPagamento" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900">
                    <option value="debito">Débito</option>
                    <option value="pix">Pix</option>
                    <option value="credito">Crédito</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Categoria</label>
                  <input name="categoria" type="text" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" placeholder="Essencial, Streaming etc." />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Cartão</label>
                  <input name="cartao" type="text" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900" placeholder="Nubank Edy" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setOpen(false)} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700">
                  Cancelar
                </button>
                <button type="submit" disabled={pending} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">
                  {pending ? 'Salvando...' : 'Salvar lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
