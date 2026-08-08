'use client';

import React from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '../lib/wagmi';
import { PersonaProvider } from '../context/PersonaContext';
import { OnboardingProvider } from '../context/OnboardingContext';
import { DealsProvider } from '../context/DealsContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../context/ToastContext';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#00D2FF',
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'rounded',
          })}
          modalSize="compact"
        >
          <ThemeProvider>
            <ToastProvider>
              <PersonaProvider>
                <OnboardingProvider>
                  <DealsProvider>
                    {children}
                  </DealsProvider>
                </OnboardingProvider>
              </PersonaProvider>
            </ToastProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
