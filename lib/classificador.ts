// lib/classificador.ts
// Classifica transações em bucket + categoria + isFixed
// Usa regras locais primeiro (rápido, gratuito), depois opcionalmente Claude API

export type ClassificacaoSugerida = {
  bucket: string;
  categoria: string;
  isFixed: boolean;
  confianca: 'alta' | 'media' | 'baixa';
};

// ─── Regras locais ──────────────────────────────────────────────────────────
// Ordem importa: a primeira regra que bater vence.

type Regra = {
  pattern: RegExp;
  bucket: string;
  categoria: string;
  isFixed: boolean;
};

const REGRAS: Regra[] = [
  // Entradas — bucket vazio, não classificar como gasto
  { pattern: /^Pix ←|^Transferência ←|recebida/i, bucket: 'Entrada', categoria: 'Receita', isFixed: false },

  // Essencial — fixos conhecidos
  { pattern: /vivo|claro|tim|oi\b|net\b|giga|starlink/i, bucket: 'Essencial', categoria: 'Telefone/Internet', isFixed: true },
  { pattern: /unimed|amil|bradesco saude|sulamerica|hapvida|notredame/i, bucket: 'Essencial', categoria: 'Saúde/Plano', isFixed: true },
  { pattern: /seguro|porto seguro|mapfre|tokio marine|allianz/i, bucket: 'Essencial', categoria: 'Seguro', isFixed: true },
  { pattern: /santander\b.*127|santander\b.*mensalidade/i, bucket: 'Essencial', categoria: 'Banco', isFixed: true },
  { pattern: /copel|cemig|light\b|enel|energisa|ampla|eletropaulo|sabesp|sanepar|cedae/i, bucket: 'Essencial', categoria: 'Conta fixa', isFixed: true },
  { pattern: /academia|smartfit|bluefit|crossfit|gym|fitness/i, bucket: 'Essencial', categoria: 'Academia', isFixed: true },
  { pattern: /condominio|iptu|aluguel|financiamento\s+im/i, bucket: 'Essencial', categoria: 'Moradia', isFixed: true },
  { pattern: /mercado|supermercado|carrefour|extra\b|pao de acucar|assai|atacadao|hortifruti|sacolao/i, bucket: 'Essencial', categoria: 'Supermercado', isFixed: false },
  { pattern: /farmacia|droga|ultrafarma|pacheco|drogasil|nissei/i, bucket: 'Essencial', categoria: 'Farmácia', isFixed: false },
  { pattern: /combustivel|posto\b|petrobras|shell|ipiranga\b|br\s+distribuidora/i, bucket: 'Essencial', categoria: 'Combustível', isFixed: false },
  { pattern: /cvs\b/i, bucket: 'Essencial', categoria: 'Farmácia', isFixed: false },
  { pattern: /boleto.*santander|pagamento.*banco santander/i, bucket: 'Essencial', categoria: 'Parcela/Financiamento', isFixed: true },
  { pattern: /fies\b/i, bucket: 'Essencial', categoria: 'FIES', isFixed: true },
  { pattern: /facility ass evang|associacao evangelica|beneficencia/i, bucket: 'Essencial', categoria: 'Associação/Assistência', isFixed: true },

  // Essencial — variável
  { pattern: /ifood|rappi|uber eats|james|delivery/i, bucket: 'Essencial', categoria: 'Alimentação delivery', isFixed: false },
  { pattern: /restaurante|lanchonete|padaria|pizzaria|hamburger|sushi|churrascaria|cafe\b/i, bucket: 'Essencial', categoria: 'Alimentação', isFixed: false },
  { pattern: /uber\b|99\b|taxi|99pay|cabify|lyft/i, bucket: 'Essencial', categoria: 'Transporte', isFixed: false },
  { pattern: /onibus|metro\b|bilhete unico|passagem/i, bucket: 'Essencial', categoria: 'Transporte público', isFixed: false },

  // Streaming / Outros
  { pattern: /netflix/i, bucket: 'Streaming', categoria: 'Netflix', isFixed: true },
  { pattern: /spotify/i, bucket: 'Streaming', categoria: 'Spotify', isFixed: true },
  { pattern: /youtube premium|youtube music/i, bucket: 'Streaming', categoria: 'YouTube Premium', isFixed: true },
  { pattern: /amazon prime|prime video/i, bucket: 'Streaming', categoria: 'Amazon Prime', isFixed: true },
  { pattern: /disney\+|disneyplus|star\+/i, bucket: 'Streaming', categoria: 'Disney+', isFixed: true },
  { pattern: /hbo|max\b/i, bucket: 'Streaming', categoria: 'HBO Max', isFixed: true },
  { pattern: /globoplay/i, bucket: 'Streaming', categoria: 'Globoplay', isFixed: true },
  { pattern: /kotas|microsoft 365|office 365|google one|icloud/i, bucket: 'Streaming', categoria: 'Software/Assinatura', isFixed: true },
  { pattern: /canva/i, bucket: 'Streaming', categoria: 'Canva', isFixed: true },
  { pattern: /meli\+|mercado\s*pago.*plus/i, bucket: 'Streaming', categoria: 'Meli+', isFixed: true },
  { pattern: /gringo\b/i, bucket: 'Streaming', categoria: 'Gringo (IPVA/Licenciamento)', isFixed: false },
  { pattern: /oferta|dizimo|dizimo|doacão|doacao|igreja/i, bucket: 'Streaming', categoria: 'Igreja/Oferta', isFixed: false },
  { pattern: /qconcursos|qcursor|estrategia concursos|gran cursos/i, bucket: 'Streaming', categoria: 'Concursos/Estudo', isFixed: true },

  // Objetivos
  { pattern: /terapia|psicologo|psiquiatra|mc ribeiro|psicologia/i, bucket: 'Objetivos', categoria: 'Terapia', isFixed: false },
  { pattern: /curso|faculdade|escola|ensino|educacao|educação|colegio|colegio/i, bucket: 'Objetivos', categoria: 'Educação', isFixed: false },
  { pattern: /livro|amazon.*livro|amazon.*book/i, bucket: 'Objetivos', categoria: 'Livros', isFixed: false },
  { pattern: /investimento|cdb|tesouro|acao\b|fundo\b/i, bucket: 'Objetivos', categoria: 'Investimento', isFixed: false },
  { pattern: /poupanca|reserva/i, bucket: 'Reserva', categoria: 'Reserva', isFixed: false },

  // Dívidas/Empréstimos — Essencial
  { pattern: /emprestimo|empréstimo|resgate.*emprestimo|nubank.*emprestimo/i, bucket: 'Essencial', categoria: 'Empréstimo', isFixed: true },
  { pattern: /pagamento de fatura/i, bucket: 'Essencial', categoria: 'Pagamento de fatura', isFixed: true },
  { pattern: /pix →.*lucas albino/i, bucket: 'Essencial', categoria: 'Transferência própria (Itaú)', isFixed: false },

  // Transferências entre contas próprias
  { pattern: /lucas albino de moraes.*itaú|lucas albino.*itau/i, bucket: 'Essencial', categoria: 'Transferência própria', isFixed: false },

  // Pé na Jaca — lazer e compras não essenciais
  { pattern: /shopping|renner|riachuelo|c&a|zara|h&m|hering|lojas americanas|americanas/i, bucket: 'Pé na Jaca', categoria: 'Compras/Roupas', isFixed: false },
  { pattern: /cinema|ingresso|bilheteria|sympla|eventbrite/i, bucket: 'Pé na Jaca', categoria: 'Lazer/Entretenimento', isFixed: false },
  { pattern: /bar\b|boteco|choperia|cervejaria/i, bucket: 'Pé na Jaca', categoria: 'Bar/Lazer', isFixed: false },
  { pattern: /hotel|pousada|airbnb|booking/i, bucket: 'Pé na Jaca', categoria: 'Hospedagem', isFixed: false },
  { pattern: /steam\b|playstation|xbox|nintendo|epic games/i, bucket: 'Pé na Jaca', categoria: 'Jogos', isFixed: false },
  { pattern: /historias unicas/i, bucket: 'Pé na Jaca', categoria: 'Compras online', isFixed: false },
];

// ─── Função principal ────────────────────────────────────────────────────────

export function classificarTransacao(descricao: string, valor: number): ClassificacaoSugerida {
  // Entradas não são gastos
  if (valor > 0) {
    return { bucket: 'Entrada', categoria: 'Receita', isFixed: false, confianca: 'alta' };
  }

  const texto = descricao.toLowerCase();

  for (const regra of REGRAS) {
    if (regra.pattern.test(texto) || regra.pattern.test(descricao)) {
      return {
        bucket: regra.bucket,
        categoria: regra.categoria,
        isFixed: regra.isFixed,
        confianca: 'alta',
      };
    }
  }

  // Transferência Pix sem regra = classificação incerta
  if (/pix →|pix ←|transferência/i.test(descricao)) {
    return { bucket: 'Essencial', categoria: 'Transferência', isFixed: false, confianca: 'baixa' };
  }

  return { bucket: 'Essencial', categoria: 'Outros', isFixed: false, confianca: 'baixa' };
}

export function classificarLote(
  transacoes: Array<{ descricao: string; valor: number }>,
): ClassificacaoSugerida[] {
  return transacoes.map(({ descricao, valor }) => classificarTransacao(descricao, valor));
}
