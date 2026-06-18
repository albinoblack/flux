'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

function parseNumber(value: FormDataEntryValue | null): number {
  if (!value) return 0;
  const text = String(value).replace(/\s/g, '').replace(',', '.').replace(/R\$/g, '');
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function addLancamento(formData: FormData) {
  const valor = parseNumber(formData.get('valor'));
  const descricao = String(formData.get('descricao') || '').trim();
  const data = new Date(String(formData.get('data') || new Date().toISOString()));
  const meioPagamento = String(formData.get('meioPagamento') || 'debito');
  const categoria = String(formData.get('categoria') || '').trim() || null;
  const cartao = String(formData.get('cartao') || '').trim() || null;

  const ano = data.getFullYear();
  const mes = data.getMonth() + 1;

  const month = await prisma.mesFinanceiro.upsert({
    where: { ano_mes: { ano, mes } },
    create: { ano, mes, rendaLiquida: 0 },
    update: {},
  });

  await prisma.lancamentoDiario.create({
    data: {
      mesId: month.id,
      valor,
      descricao,
      data,
      meioPagamento,
      categoria,
      cartao,
      origem: 'manual',
    },
  });

  if (categoria) {
    const bucket = await prisma.bucket.findFirst({
      where: { mesId: month.id, nome: categoria },
    });
    if (bucket) {
      const total = await prisma.lancamentoDiario.aggregate({
        where: { mesId: month.id, categoria },
        _sum: { valor: true },
      });
      await prisma.bucket.update({
        where: { id: bucket.id },
        data: { gasto: total._sum.valor ?? 0 },
      });
    }
  }

  revalidatePath('/');
  revalidatePath('/lancamentos');
  return;
}

export async function createDebt(formData: FormData) {
  const nome = String(formData.get('nome') || '').trim();
  const valorParcela = parseNumber(formData.get('valorParcela'));
  const saldoDevedor = parseNumber(formData.get('saldoDevedor'));
  const tipoPessoa = String(formData.get('tipoPessoa') || 'PF');

  if (!nome || valorParcela <= 0 || saldoDevedor <= 0) {
    return;
  }

  await prisma.divida.create({
    data: { nome, valorParcela, saldoDevedor, tipoPessoa, ativa: true },
  });

  revalidatePath('/dividas');
  revalidatePath('/analise');
}

export async function toggleDebtStatus(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  await prisma.divida.update({ where: { id }, data: { ativa: false } });
  revalidatePath('/dividas');
  revalidatePath('/analise');
}

export async function updateBucketPercentages(formData: FormData) {
  const entries = Array.from(formData.entries()).filter(([key]) => key.startsWith('bucket_'));
  const updates = entries.map(([key, value]) => ({
    id: key.replace('bucket_', ''),
    percentual: parseNumber(value),
  }));
  const total = updates.reduce((sum, item) => sum + item.percentual, 0);
  if (Math.round(total) !== 100) {
    return;
  }
  await Promise.all(
    updates.map((item) =>
      prisma.configuracaoBucket.update({ where: { id: item.id }, data: { percentual: item.percentual } }),
    ),
  );
  revalidatePath('/config');
}

export async function addCardConfig(formData: FormData) {
  const nome = String(formData.get('nome') || '').trim();
  if (!nome) return;
  await prisma.configuracaoCartao.create({ data: { nome, ativo: true } });
  revalidatePath('/config');
}

export async function toggleCardActive(formData: FormData) {
  const id = String(formData.get('id') || '');
  const ativo = String(formData.get('ativo') || 'true') === 'true';
  if (!id) return;
  await prisma.configuracaoCartao.update({ where: { id }, data: { ativo } });
  revalidatePath('/config');
}

export async function addCategorizacaoRule(formData: FormData) {
  const palavraChave = String(formData.get('palavraChave') || '').trim();
  const categoria = String(formData.get('categoria') || '').trim();
  if (!palavraChave || !categoria) return;
  await prisma.regraCategorizacao.create({ data: { palavraChave, categoria } });
  revalidatePath('/config');
}
