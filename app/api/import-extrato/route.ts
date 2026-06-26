// app/api/import-extrato/route.ts
import { NextResponse } from 'next/server';
import { parseNubankCsv, parseNubankPdfText } from '@/lib/parsers/nubank';
import { classificarLote } from '@/lib/classificador';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('arquivo') as File | null;
  const source = formData.get('source') as string | null; // 'nubank' | 'mercado_pago' | 'bb'
  const confirmar = formData.get('confirmar') === 'true'; // true = salvar no banco

  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
  }
  if (!source) {
    return NextResponse.json({ error: 'Informe o banco (source).' }, { status: 400 });
  }

  const fileName = file.name.toLowerCase();
  const fileType = fileName.endsWith('.csv') ? 'csv' : fileName.endsWith('.pdf') ? 'pdf' : null;

  if (!fileType) {
    return NextResponse.json({ error: 'Formato inválido. Envie um arquivo .csv ou .pdf.' }, { status: 400 });
  }

  try {
    // ── Parse do arquivo ─────────────────────────────────────────────────────
    let transacoesRaw;

    if (source === 'nubank') {
      if (fileType === 'csv') {
        const text = await file.text();
        transacoesRaw = parseNubankCsv(text);
      } else {
        // PDF: extrai texto usando pdf-parse (CJS — require evita erro de tipos no build)
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const buffer = Buffer.from(await file.arrayBuffer());
        const pdfData = await pdfParse(buffer);
        transacoesRaw = parseNubankPdfText(pdfData.text);
      }
    } else {
      return NextResponse.json({ error: `Banco "${source}" ainda não suportado. Por enquanto: nubank.` }, { status: 400 });
    }

    if (transacoesRaw.length === 0) {
      return NextResponse.json({ error: 'Nenhuma transação encontrada no arquivo.' }, { status: 400 });
    }

    // ── Classificação ────────────────────────────────────────────────────────
    const classificacoes = classificarLote(
      transacoesRaw.map((t) => ({ descricao: t.descricao, valor: t.valor })),
    );

    const preview = transacoesRaw.map((t, i) => ({
      data: t.data.toISOString(),
      valor: t.valor,
      descricao: t.descricao,
      tipo: t.tipo,
      identificador: t.identificador,
      source: t.source,
      bucket: classificacoes[i].bucket,
      categoria: classificacoes[i].categoria,
      isFixed: classificacoes[i].isFixed,
      confianca: classificacoes[i].confianca,
    }));

    // ── Só retorna preview (sem salvar) ─────────────────────────────────────
    if (!confirmar) {
      return NextResponse.json({
        preview,
        total: preview.length,
        entradas: preview.filter((t) => t.valor > 0).length,
        saidas: preview.filter((t) => t.valor < 0).length,
        fileType,
        source,
      });
    }

    // ── Confirmar: salva no banco ────────────────────────────────────────────
    const transacoesParaSalvar = JSON.parse(formData.get('transacoes') as string) as typeof preview;

    // Descobre o mês de cada transação e agrupa
    const porMes = new Map<string, typeof transacoesParaSalvar>();
    for (const t of transacoesParaSalvar) {
      const d = new Date(t.data);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!porMes.has(key)) porMes.set(key, []);
      porMes.get(key)!.push(t);
    }

    // Cria o ImportBatch
    const batch = await prisma.extratoImport.create({
      data: {
        source,
        fileType,
        fileName: file.name,
        rowCount: transacoesParaSalvar.length,
      },
    });

    let salvos = 0;
    let duplicatas = 0;

    for (const [mesKey, transacoesMes] of porMes) {
      const [ano, mes] = mesKey.split('-').map(Number);

      // Garante que o MesFinanceiro existe
      let mesFinanceiro = await prisma.mesFinanceiro.findUnique({
        where: { ano_mes: { ano, mes } },
      });

      if (!mesFinanceiro) {
        mesFinanceiro = await prisma.mesFinanceiro.create({
          data: { ano, mes, rendaLiquida: 0 },
        });
      }

      for (const t of transacoesMes) {
        // Deduplicação: (data + descricao + valor + source)
        const dataDate = new Date(t.data);
        const existing = await prisma.lancamentoDiario.findFirst({
          where: {
            data: { gte: new Date(dataDate.setHours(0, 0, 0, 0)), lte: new Date(dataDate.setHours(23, 59, 59, 999)) },
            valor: t.valor,
            descricao: t.descricao,
            source,
          },
        });

        if (existing) {
          duplicatas++;
          continue;
        }

        await prisma.lancamentoDiario.create({
          data: {
            mesId: mesFinanceiro.id,
            data: new Date(t.data),
            valor: t.valor,
            descricao: t.descricao,
            categoria: t.categoria,
            bucket: t.bucket !== 'Entrada' ? t.bucket : null,
            isFixed: t.isFixed,
            meioPagamento: t.tipo === 'entrada' ? 'Pix/TED entrada' : 'Pix/TED saída',
            origem: `extrato_${fileType}`,
            source,
            importBatchId: batch.id,
          },
        });
        salvos++;
      }
    }

    return NextResponse.json({ salvos, duplicatas, batchId: batch.id });
  } catch (error) {
    console.error('[import-extrato]', error);
    return NextResponse.json(
      { error: String(error) || 'Erro ao processar extrato.' },
      { status: 500 },
    );
  }
}
