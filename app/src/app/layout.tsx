import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { PersonaProvider } from '../context/PersonaContext';
import { OnboardingProvider } from '../context/OnboardingContext';

export const metadata: Metadata = {
  title: 'Vera Protocol — Compliant Escrow Engine | Cleanverse Monad Testnet',
  description:
    'Identity-gated on-chain escrow primitive powered by Cleanverse A-Pass identity, Validator Compliance rules, and Travel Rule PDF exports.',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.ico',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
      </head>
      <body className="antialiased bg-[#f8f6f0] dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300">
        <Providers>
          <PersonaProvider>
            <OnboardingProvider>{children}</OnboardingProvider>
          </PersonaProvider>
        </Providers>
      </body>
    </html>
  );
}
