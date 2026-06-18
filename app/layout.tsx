import './globals.css';
import type { Metadata } from 'next';
import AppNav from '@/components/AppNav';
import QuickAddButton from '@/components/QuickAddButton';

export const metadata: Metadata = {
  title: 'Flux - Controle Financeiro',
  description: 'Importe sua planilha e gerencie lançamentos financeiros.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <AppNav />
            <main>{children}</main>
            <QuickAddButton />
          </div>
        </div>
      </body>
    </html>
  );
}
