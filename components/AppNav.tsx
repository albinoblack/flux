'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/lancamentos', label: 'Lançamentos' },
  { href: '/mes/2026/7', label: 'Mês' },
  { href: '/dividas', label: 'Dívidas' },
  { href: '/analise', label: 'Análise' },
  { href: '/importar/extrato', label: 'Importar Extrato' },
  { href: '/config', label: 'Config' },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">F</span>
        <span className="text-base font-semibold text-slate-900 tracking-tight">Flux</span>
      </Link>

      <ul className="flex flex-wrap gap-1">
        {links.map((link) => {
          const isActive = link.href === '/'
            ? pathname === '/'
            : pathname.startsWith(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
