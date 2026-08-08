'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Zap,
  ExternalLink,
  Shield,
  Sun,
  Moon,
  Home,
  Briefcase,
  ShoppingBag,
  Plus,
  Layers,
  FileText,
  Globe,
  Coins,
  Droplets,
  RotateCcw,
  Menu,
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePersona, MOCK_PERSONAS } from '../context/PersonaContext';
import { useDeals } from '../context/DealsContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openPostModal: () => void;
  openPlayground: () => void;
  openDisputes: () => void;
  openProfile: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openPostModal,
  openPlayground,
  openDisputes,
  openProfile,
  onToggleMobileMenu,
}) => {
  const {
    appMode,
    setAppMode,
    activePersonaKey,
    activePersona,
    setActivePersonaKey,
    selectedChain,
    setSelectedChain,
    activeBalance,
    claimFaucet,
    selfIssueAPass,
    getPersonaTrustScore,
    resetPersonaBalances,
  } = usePersona();

  const trustDetails = getPersonaTrustScore(activePersonaKey);
  const { resetDeals } = useDeals();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();

  const getTabTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Overview Dashboard';
      case 'browse-jobs':
        return 'Open Work Escrows (Bounties)';
      case 'browse-services':
        return 'OTC & Service Settlement Vaults';
      case 'my-created':
        return 'My Deployed Escrow Vaults';
      case 'my-purchased':
        return 'Active Settlements & Payouts';
      case 'deals':
        return 'Deploy Escrow Instance';
      default:
        return 'Overview Dashboard';
    }
  };

  const [faucetLoading, setFaucetLoading] = React.useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleClaimFaucet = async () => {
    try {
      setFaucetLoading(true);
      await claimFaucet();
    } catch (err: any) {
      if (err?.message) {
        showError(err.message);
      }
    } finally {
      setFaucetLoading(false);
    }
  };

  return (
    <header className="neu-card p-4 sm:p-6 mb-6 space-y-4 transition-colors" id="persona-bar-header">
      {/* Top Main Row: Title, Hamburger Toggle & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300/40 dark:border-slate-800/60">
        {/* Page Title & Protocol Badge */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {getTabTitle()}
              </h2>
              <span className="inline-block sm:hidden text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase mt-0.5">
                CLEANVERSE PROTOCOL
              </span>
            </div>
          </div>

          <span className="hidden sm:inline-block text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full uppercase flex-shrink-0">
            CLEANVERSE PROTOCOL
          </span>
        </div>

        {/* Top Right Utilities: Theme & Wallet */}
        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
          {/* Light / Dark Mode Toggle — icon guarded by mounted to prevent SSR hydration mismatch (Sun has a <circle> SVG) */}
          <button
            onClick={toggleTheme}
            className="neu-btn-secondary p-2.5 rounded-2xl transition-all flex-shrink-0"
            title={`Switch to ${mounted && theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {mounted
              ? theme === 'dark'
                ? <Sun className="h-4 w-4 text-indigo-400" />
                : <Moon className="h-4 w-4 text-purple-600" />
              : <Moon className="h-4 w-4 text-purple-600" />}
          </button>

          {/* RainbowKit Web3 Connect Wallet Button */}
          {mounted && (
            <div className="flex-shrink-0">
              <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
            </div>
          )}
        </div>
      </div>

      {/* Middle Row: Network Indicator, Token Balances & Persona Tier Badges */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Monad Testnet Live Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 neu-btn-primary shadow-md border border-purple-500/30">
            <Zap className="h-3.5 w-3.5 text-purple-400" />
            <span>MONAD TESTNET LIVE</span>
          </span>
        </div>

        {/* Live Token Balances & Verification Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Token Balances & Faucet Button */}
          <div className="neu-inset px-3.5 py-2 flex items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-1.5 font-extrabold text-indigo-600 dark:text-indigo-400" title="Cleanverse A-Token (cATKN) Balance">
              <Coins className="h-4 w-4 text-indigo-500" />
              <span>{activeBalance.catkn.toLocaleString()} cATKN</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400" title="Monad Native Gas Token (MON) Balance">
              <Zap className="h-4 w-4 text-purple-500" />
              <span>{activeBalance.mon} MON</span>
            </div>
            <div className="flex items-center gap-1 ml-auto sm:ml-2">
              <button
                onClick={handleClaimFaucet}
                disabled={faucetLoading}
                className="neu-btn-primary px-2.5 py-1 text-[10px] font-extrabold flex items-center gap-1 shadow-md"
                title="Claim 10,000 cATKN Test Tokens"
              >
                <Droplets className="h-3 w-3 text-cyan-400" />
                <span>{faucetLoading ? '...' : '+10k'}</span>
              </button>
              <button
                onClick={() => {
                  resetPersonaBalances();
                  resetDeals();
                  showSuccess(appMode === 'production' ? 'Production Mode cATKN Balance Reset to 0!' : 'Demo Matrix State & Balances Reset to Fresh Defaults!');
                }}
                className="neu-btn-secondary px-2 py-1 text-[10px] font-extrabold flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-800 rounded-lg transition-all"
                title="Reset Balances to 0"
              >
                <RotateCcw className="h-3 w-3 text-indigo-500" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Verification Status & Trust Score Badges */}
          {activePersona.isVerified ? (
            <div className="flex items-center gap-2">
              <div className="neu-card-soft px-3 py-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Tier {activePersona.tier}</span>
              </div>
              <div className="neu-card-soft px-3 py-2 flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>Score {trustDetails.score}/100</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                  {trustDetails.feePct}% Fee
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="neu-card-soft px-3 py-2 flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                <span>Identity Blocked</span>
              </div>
              <button
                onClick={() => selfIssueAPass('US', 30)}
                className="neu-btn-primary px-3 py-2 text-xs font-extrabold flex items-center gap-1.5 shadow-md"
                title="Issue Cleanverse CVI A-Pass Credential via generate_apass API"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>⚡ Issue A-Pass CVI</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Demo Persona Switcher Strip */}
      {appMode === 'demo' && (
        <div className="pt-3 border-t border-slate-300/40 dark:border-slate-800/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1 whitespace-nowrap flex-shrink-0">
            <Sparkles className="h-3 w-3 text-indigo-400" />
            DEMO MATRIX:
          </span>
          {Object.entries(MOCK_PERSONAS).map(([key, persona]) => (
            <button
              key={key}
              onClick={() => setActivePersonaKey(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                activePersonaKey === key
                  ? 'neu-btn-primary shadow-md font-bold'
                  : 'neu-btn-secondary'
              }`}
              title={persona.statusText}
            >
              <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${
                persona.isVerified
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-400'
              } font-bold`}>
                {persona.country}
              </span>
              <span>{persona.name.split(' (')[0]}</span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500">T{persona.tier}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
