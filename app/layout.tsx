import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flux - Controle Financeiro',
  description: 'Importe sua planilha e gerencie lançamentos financeiros.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
