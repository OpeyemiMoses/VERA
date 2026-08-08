'use client';

import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { usePersona } from '../context/PersonaContext';

interface FooterProps {
  onNavigateLanding?: () => void;
  onNavigateMarketplace?: () => void;
  openPlayground?: () => void;
  openDisputes?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateLanding,
  onNavigateMarketplace,
  openPlayground,
  openDisputes,
}) => {
  return (
    <footer className="mt-12 pt-10 pb-8 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Brand & Description Column */}
        <div className="md:col-span-6 space-y-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="Vera Protocol Logo"
              className="h-8 w-8 rounded-xl object-cover border border-cyan-500/30 shadow-md"
            />
            <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
              vera <span className="text-cyan-500 dark:text-cyan-400 font-mono text-xs">PROTOCOL</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
            Compliance-native Web3 escrow marketplace built exclusively on Monad Testnet, powered by Cleanverse A-Pass identity gating, zero-knowledge secret delivery, and FATF Travel Rule audit reports.
          </p>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[11px] font-bold font-mono">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span>Monad Testnet Live</span>
          </div>
        </div>

        {/* Platform Links */}
        <div className="md:col-span-3 space-y-2.5">
          <h4 className="text-xs font-mono font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            PLATFORM
          </h4>
          <ul className="space-y-2 text-xs font-medium">
            {onNavigateLanding && (
              <li>
                <button onClick={onNavigateLanding} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
                  Home Landing
                </button>
              </li>
            )}
            {onNavigateMarketplace && (
              <li>
                <button onClick={onNavigateMarketplace} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
                  Escrow Marketplace
                </button>
              </li>
            )}
            {openPlayground && (
              <li>
                <button onClick={openPlayground} className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">
                  Policy Engine Simulator
                </button>
              </li>
            )}
            <li>
              <a
                href="https://onboard.cleanverse.com/#start"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
              >
                <span>Cleanverse A-Pass Portal</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ul>
        </div>

        {/* Smart Contracts Links */}
        <div className="md:col-span-3 space-y-2.5">
          <h4 className="text-xs font-mono font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            SMART CONTRACTS
          </h4>
          <ul className="space-y-2 text-xs font-mono font-semibold">
            <li>
              <a
                href="https://testnet.monadexplorer.com/address/0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors inline-flex items-center gap-1"
              >
                <span>EscrowFactory (0xC068...9334)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <a
                href="https://testnet.monadexplorer.com/address/0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors inline-flex items-center gap-1"
              >
                <span>cATKN Token (0x505B...1Ce03)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-[11px] text-slate-500">
        <p>© 2026 Vera Protocol. Built for Cleanverse Hackathon.</p>
        <p className="text-slate-400">Monad Testnet × Cleanverse A-Pass × Vera Vault ZK</p>
      </div>
    </footer>
  );
};
