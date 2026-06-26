import Link from 'next/link';

export default function AppNav() {
  const links = [
    { href: '/', label: 'Dashboard' },
    { href: '/lancamentos', label: 'Lançamentos' },
    { href: '/mes/2026/7', label: 'Mês' },
    { href: '/dividas', label: 'Dívidas' },
    { href: '/analise', label: 'Análise' },
    { href: '/importar/extrato', label: 'Importar Extrato' },
    { href: '/config', label: 'Config' },
  ];

  return (
    <nav className="mb-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <ul className="flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
