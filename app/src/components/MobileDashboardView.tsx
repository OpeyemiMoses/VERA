'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Zap,
  Sun,
  Moon,
  Plus,
  ArrowRight,
  Search,
  CheckCircle2,
  Wallet,
  ShoppingBag,
  Briefcase,
  Coins,
  Droplets,
  Store,
  Clock,
} from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePersona } from '../context/PersonaContext';
import { useDeals } from '../context/DealsContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { Deal } from '../types/deal';

interface MobileDashboardViewProps {
  onSelectDeal: (deal: Deal) => void;
  openPostModal: () => void;
  openCheckout: (deal: Deal) => void;
  openSubmitDeliverable: (deal: Deal) => void;
  openPlayground: () => void;
  openProfile: () => void;
  setActiveTab: (tab: string) => void;
}

export const MobileDashboardView: React.FC<MobileDashboardViewProps> = ({
  onSelectDeal,
  openPostModal,
  openCheckout,
  openSubmitDeliverable,
  openPlayground,
  openProfile,
  setActiveTab,
}) => {
  const { activePersona, activeBalance, claimFaucet, resetPersonaBalances } = usePersona();
  const { deals, resetDeals } = useDeals();
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [faucetLoading, setFaucetLoading] = React.useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleClaimFaucet = async () => {
    try {
      setFaucetLoading(true);
      await claimFaucet();
    } catch (err: any) {
      if (err?.message) showError(err.message);
    } finally {
      setFaucetLoading(false);
    }
  };

  const myDeals = deals.filter(
    (d) =>
      d.initiatorAddress.toLowerCase() === activePersona.walletAddress.toLowerCase() ||
      d.initiatorName.toLowerCase().includes(activePersona.name.toLowerCase())
  );

  const popularDeals = deals.filter(
    (d) =>
      searchQuery === '' ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="block md:hidden pb-24 space-y-5 animate-fadeIn">
      {/* 1. Top Mobile Brand & Utility Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center">
            <img src="/logo.jpg" alt="Vera" className="h-full w-full rounded-[12px] object-cover" />
          </div>
          <div>
            <h1 className="font-extrabold text-base leading-none flex items-center gap-1.5 text-slate-900 dark:text-white">
              vera
              <span className="text-[8px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded uppercase">
                PROTOCOL
              </span>
            </h1>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Monad Testnet</p>
          </div>
        </div>

        {/* Quick Utility Icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClaimFaucet}
            disabled={faucetLoading}
            className="neu-inset p-2 rounded-2xl text-indigo-500 hover:text-indigo-600 transition-colors"
            title="Claim +10,000 cATKN Test Tokens"
          >
            <Droplets className="h-4.5 w-4.5 text-cyan-500 animate-pulse" />
          </button>
          <button
            onClick={toggleTheme}
            className="neu-inset p-2 rounded-2xl text-slate-600 dark:text-slate-300 transition-colors"
          >
            {mounted
              ? theme === 'dark'
                ? <Sun className="h-4.5 w-4.5 text-indigo-400" />
                : <Moon className="h-4.5 w-4.5 text-purple-600" />
              : <Moon className="h-4.5 w-4.5 text-purple-600" />}
          </button>
          <button
            onClick={openProfile}
            className="neu-pill-active p-1.5 rounded-2xl flex items-center gap-1 text-xs font-bold"
          >
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-extrabold">
              {activePersona.name.charAt(0)}
            </div>
          </button>
        </div>
      </div>

      {/* 2. User Greeting Row */}
      <div className="flex items-center justify-between bg-slate-200/40 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-300/40 dark:border-slate-800/60">
        <div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Good day,</p>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">{activePersona.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            {activePersona.isVerified ? `Tier ${activePersona.tier}` : 'Tier 0'}
          </span>
          <span className="text-[10px] font-bold px-2 py-1 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
            {activeBalance.catkn.toLocaleString()} cATKN
          </span>
        </div>
      </div>

      {/* 3. Hero Banner Card (Reference Inspired) */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0f2e28] via-[#134239] to-[#0a231e] dark:from-[#0d1c22] dark:via-[#112a32] dark:to-[#081318] p-5 text-white shadow-xl space-y-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <h3 className="text-xl font-extrabold text-white tracking-tight leading-snug">
            Get paid safely.<br />Or get it all back.
          </h3>
          <p className="text-xs text-emerald-200/80 leading-relaxed font-medium">
            Funds lock on-chain in Escrow until buyer confirms delivery.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 relative z-10 pt-1">
          <button
            onClick={openPostModal}
            className="w-full py-3 px-5 rounded-full bg-white hover:bg-slate-100 text-[#0f2e28] font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98"
          >
            <Plus className="h-4 w-4 text-[#0f2e28]" />
            <span>Create an Escrow Deal</span>
            <ArrowRight className="h-4 w-4 ml-auto text-[#0f2e28]" />
          </button>

          <button
            onClick={() => setActiveTab('browse-services')}
            className="w-full py-3 px-5 rounded-full border border-emerald-400/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-100 font-extrabold text-xs transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <ShoppingBag className="h-4 w-4 text-emerald-300" />
            <span>Browse Marketplace Services</span>
          </button>
        </div>
      </div>

      {/* 4. Sell Service Callout Card */}
      <div
        onClick={openPostModal}
        className="neu-card p-4 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-500/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Offer your own service</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">List once, buyers pay through Cleanverse escrow.</p>
          </div>
        </div>
        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 flex-shrink-0">
          Start <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>

      {/* 5. Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search services or escrow deals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 neu-inset rounded-full text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
        />
        <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
      </div>

      {/* 6. Your Deals Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Your Deals</h3>
          <button
            onClick={() => setActiveTab('my-created')}
            className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {myDeals.length === 0 ? (
          <div className="neu-card p-4 text-center rounded-2xl space-y-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Active Deals Yet</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Create your first deal above to initiate on-chain escrow.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {myDeals.slice(0, 3).map((deal) => (
              <div
                key={deal.id}
                onClick={() => onSelectDeal(deal)}
                className="neu-card p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-500/40 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded neu-inset text-indigo-600 dark:text-indigo-400 uppercase font-mono">
                      {deal.type === 'DIRECT_DEAL' ? '1-ON-1' : 'SERVICE'}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      {deal.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{deal.title}</h4>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{deal.price} {deal.currency}</p>
                  <p className="text-[9px] text-slate-400">Min Tier {deal.minTier}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Popular Services Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Popular Services</h3>
          <button
            onClick={() => setActiveTab('browse-services')}
            className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {popularDeals.slice(0, 4).map((deal) => {
            const meetsTier = activePersona.isVerified && activePersona.tier >= deal.minTier;
            return (
              <div
                key={deal.id}
                onClick={() => onSelectDeal(deal)}
                className="neu-card p-4 rounded-2xl space-y-3 cursor-pointer hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase">
                      {deal.category}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1 leading-snug">{deal.title}</h4>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{deal.price} {deal.currency}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-300/40 dark:border-slate-800/60 text-[10px]">
                  <span className="text-slate-500 dark:text-slate-400">By {deal.initiatorName}</span>
                  <span className={`font-bold ${meetsTier ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {meetsTier ? `Tier ${deal.minTier}+ Pass` : `Tier ${deal.minTier}+ Required`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
