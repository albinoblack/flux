'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';

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
    <nav className="mb-8 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white shadow-lg shadow-violet-500/30">
          F
        </span>
        <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Flux</span>
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
                    ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <ThemeToggle />
    </nav>
  );
}
