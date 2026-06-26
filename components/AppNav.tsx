'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/lancamentos', label: 'Lançamentos' },
  { href: '/mes/2026/7', label: 'Mês' },
  { href: '/dividas', label: 'Dívidas' },
  { href: '/analise', label: 'Análise' },
  { href: '/importar/extrato', label: 'Importar' },
  { href: '/config', label: 'Config' },
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3">
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white shadow-lg shadow-violet-500/30">
          F
        </span>
        <span className="text-base font-semibold text-zinc-100 tracking-tight">Flux</span>
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
                    ? 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
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
