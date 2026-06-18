import { NextResponse } from 'next/server';
import { parseWorkbook } from '@/lib/importPlanilha';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('arquivo');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Nenhum arquivo foi enviado.' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  try {
    const preview = parseWorkbook(buffer);
    return NextResponse.json({ preview });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) || 'Erro desconhecido ao processar a planilha.' },
      { status: 500 },
    );
  }
}
