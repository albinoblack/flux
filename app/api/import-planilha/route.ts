import { NextResponse } from 'next/server';
import { parseWorkbook } from '@/lib/importPlanilha';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('arquivo');
  const confirmar = formData.get('confirmar') === 'true';

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Nenhum arquivo foi enviado.' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();

  try {
    const preview = parseWorkbook(buffer);

    // Só preview — não salva
    if (!confirmar) {
      return NextResponse.json({ preview });
    }

    // ── Confirmar: salva no banco ──────────────────────────────────────────
    const { meses, dividas } = preview;
    let mesesSalvos = 0;
    let dividasSalvas = 0;

    for (const mes of meses) {
      const mesFinanceiro = await prisma.mesFinanceiro.upsert({
        where: { ano_mes: { ano: mes.ano, mes: mes.mes } },
        create: {
          ano: mes.ano,
          mes: mes.mes,
          rendaLiquida: mes.rendaLiquida,
          observacoes: mes.observacoes,
        },
        update: {
          rendaLiquida: mes.rendaLiquida,
          observacoes: mes.observacoes,
        },
      });

      // Recria os buckets do mês
      await prisma.bucket.deleteMany({ where: { mesId: mesFinanceiro.id } });
      if (mes.buckets.length > 0) {
        await prisma.bucket.createMany({
          data: mes.buckets.map((b) => ({
            mesId: mesFinanceiro.id,
            nome: b.nome,
            percentual: b.percentual,
            meta: b.meta,
            gasto: b.gasto,
          })),
        });
      }

      // Recria os lançamentos de cartão do mês
      await prisma.lancamentoCartao.deleteMany({ where: { mesId: mesFinanceiro.id } });
      if (mes.cartoes.length > 0) {
        await prisma.lancamentoCartao.createMany({
          data: mes.cartoes.map((c) => ({
            mesId: mesFinanceiro.id,
            cartao: c.cartao,
            valor: c.valor,
            origem: 'planilha',
          })),
        });
      }

      mesesSalvos++;
    }

    for (const divida of dividas) {
      await prisma.divida.upsert({
        where: { nome: divida.nome } as never,
        create: {
          nome: divida.nome,
          valorParcela: divida.valorParcela,
          saldoDevedor: divida.saldoDevedor,
          tipoPessoa: divida.tipoPessoa,
          ativa: true,
        },
        update: {
          valorParcela: divida.valorParcela,
          saldoDevedor: divida.saldoDevedor,
          tipoPessoa: divida.tipoPessoa,
        },
      });
      dividasSalvas++;
    }

    await prisma.importLog.create({
      data: {
        tipo: 'planilha',
        nomeArquivo: file.name,
        linhasLidas: meses.length + dividas.length,
        linhasImportadas: mesesSalvos + dividasSalvas,
        linhasComErro: preview.erros.length,
        detalhesErro: preview.erros.length > 0 ? preview.erros : undefined,
      },
    });

    return NextResponse.json({ mesesSalvos, dividasSalvas });
  } catch (error) {
    console.error('[import-planilha]', error);
    return NextResponse.json(
      { error: String(error) || 'Erro desconhecido ao processar a planilha.' },
      { status: 500 },
    );
  }
}
