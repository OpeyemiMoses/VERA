'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, ShieldAlert, Sparkles, DollarSign, Clock, ExternalLink, Users, AlertCircle, Coins } from 'lucide-react';
import { usePersona } from '../context/PersonaContext';
import { Deal } from '../types/deal';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (newJob: Deal) => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const { activePersona, hasSufficientBalance, activeBalance, claimFaucet, deductBalance } = usePersona();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('DeFi Protocols');
  const [pricePerSlot, setPricePerSlot] = useState('1000');
  const [slots, setSlots] = useState('3');
  const [currency, setCurrency] = useState<'cATKN' | 'MON'>('cATKN');
  const [deliveryHours, setDeliveryHours] = useState('48');
  const [minTier, setMinTier] = useState('20');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const numPrice = parseFloat(pricePerSlot) || 0;
  const numSlots = Math.max(1, parseInt(slots) || 1);
  const totalUpfrontDeposit = currency === 'MON' 
    ? parseFloat((numPrice * numSlots).toFixed(4))
    : Math.round(numPrice * numSlots);

  const sufficient = hasSufficientBalance(totalUpfrontDeposit, currency, activePersona.walletAddress);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePersona.isVerified || !sufficient) return;

    // Deduct balance INSTANTLY on click (0ms response)
    deductBalance(totalUpfrontDeposit, currency, activePersona.walletAddress);
    console.log('[JOB CREATION] Deducted total escrow deposit:', totalUpfrontDeposit, currency, 'from client:', activePersona.walletAddress);

    setIsSubmitting(true);

    setTimeout(() => {
      const generatedTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const generatedEscrow = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const newJob: Deal = {
        id: `job-${Date.now()}`,
        type: 'JOB_POSTING',
        chain: 'monad',
        title: title || 'Custom Web3 Development & Escrow Deal',
        description: `Client ${activePersona.name} is hiring ${numSlots} freelancer(s) at ${numPrice} ${currency} per slot. Total escrow funded upfront: ${totalUpfrontDeposit} ${currency}.`,
        category,
        price: numPrice,
        currency,
        minTier: parseInt(minTier) || 0,
        deliveryTerms: `Deliver full asset according to specification within ${deliveryHours} hours.`,
        refundTerms: 'Full refund to client if deliverable is not submitted within deadline.',
        deliveryDeadlineHrs: parseInt(deliveryHours) || 48,
        confirmationWindowHrs: 24,
        quantity: numSlots,
        totalSlots: numSlots,
        acceptedCount: 0,
        status: 'OPEN',
        initiatorAddress: activePersona.walletAddress,
        initiatorName: activePersona.name,
        escrowAddress: generatedEscrow,
        creationTxHash: generatedTx,
        createdAt: Date.now(),
        participantWallets: [activePersona.walletAddress],
      };

      onJobCreated(newJob);
      setIsSubmitting(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="neu-card p-6 max-w-lg w-full relative transition-colors space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-300/40 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl neu-inset text-indigo-500 flex items-center justify-center font-bold">
              <Sparkles className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Post Job & Fund Multi-Slot Escrow</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">Lock Total Escrow Deposit Upfront to Cover All Freelancers</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-xl transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Unverified / Blocked Identity Warning */}
        {!activePersona.isVerified && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
              <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0" />
              <span>Cleanverse Protocol Error: Identity Blocked (Unverified Tier 0)</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              Unverified or sanctioned wallets are strictly forbidden from creating Escrow deals or listing services. Please complete verification at the Cleanverse Onboarding Portal.
            </p>
            <a
              href="https://onboard.cleanverse.com/#start"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-500/40 transition-all mt-1"
            >
              <span>Verify Cleanverse A-Pass Identity</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Job Title</label>
            <input
              type="text"
              required
              disabled={!activePersona.isVerified}
              placeholder="e.g. Smart Contract Audit & Frontend SDK Integration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 neu-inset text-sm font-medium focus:outline-none text-slate-900 dark:text-white disabled:opacity-50"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              SELECT CATEGORY *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {[
                'DeFi Protocols',
                'Security Audit',
                'Infrastructure',
                'Compliance & Identity',
                'Tokenomics & Strategy',
                'dApp Frontend & UX',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  disabled={!activePersona.isVerified}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                    category === cat
                      ? 'neu-btn-primary shadow-md'
                      : 'neu-btn-secondary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Escrow Token Currency</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCurrency('cATKN')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  currency === 'cATKN' ? 'neu-btn-primary' : 'neu-btn-secondary'
                }`}
              >
                <Coins className="h-4 w-4 text-cyan-400" />
                <span>cATKN (Compliant Token)</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('MON')}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  currency === 'MON' ? 'neu-btn-primary' : 'neu-btn-secondary'
                }`}
              >
                <DollarSign className="h-4 w-4 text-purple-400" />
                <span>MON (Native Monad)</span>
              </button>
            </div>
          </div>

          {/* Price, Slots, Deadline, MinTier Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                Price / Freelancer
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  step="any"
                  disabled={!activePersona.isVerified}
                  value={pricePerSlot}
                  onChange={(e) => setPricePerSlot(e.target.value)}
                  className="w-full pl-8 pr-2 py-2.5 neu-inset text-xs font-bold text-slate-900 dark:text-white disabled:opacity-50"
                />
                <DollarSign className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                Freelancer Slots
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  max="50"
                  disabled={!activePersona.isVerified}
                  value={slots}
                  onChange={(e) => setSlots(e.target.value)}
                  className="w-full pl-8 pr-2 py-2.5 neu-inset text-xs font-bold text-purple-600 dark:text-purple-400 disabled:opacity-50"
                />
                <Users className="h-3.5 w-3.5 text-purple-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                Deadline (Hrs)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  disabled={!activePersona.isVerified}
                  value={deliveryHours}
                  onChange={(e) => setDeliveryHours(e.target.value)}
                  className="w-full pl-8 pr-2 py-2.5 neu-inset text-xs font-medium text-slate-900 dark:text-white disabled:opacity-50"
                />
                <Clock className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-1">
                Min Tier
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  disabled={!activePersona.isVerified}
                  value={minTier}
                  onChange={(e) => setMinTier(e.target.value)}
                  className="w-full pl-8 pr-2 py-2.5 neu-inset text-xs font-bold text-indigo-600 dark:text-indigo-400 disabled:opacity-50"
                />
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Upfront Escrow Deposit Summary Card */}
          <div className="bg-indigo-500/10 border border-indigo-500/30 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                Upfront Escrow Deposit Calculation
              </span>
              <span className="text-xs font-mono font-extrabold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
                {numSlots} Slot{numSlots > 1 ? 's' : ''} × {numPrice} {currency}
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1 border-t border-indigo-500/20">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Total Upfront Lock Required:
              </span>
              <span className="text-sm font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                {totalUpfrontDeposit} {currency}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              💡 Locking {totalUpfrontDeposit} {currency} in Escrow contract upfront guarantees that all {numSlots} freelancer slot(s) are fully covered and ready for payout upon work completion.
            </p>
          </div>

          {/* Insufficient Balance Alert */}
          {!sufficient && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Insufficient Balance to Fund All {numSlots} Slots</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200">
                You currently have <strong className="text-rose-500 dark:text-rose-400 font-mono">{currency === 'cATKN' ? `${activeBalance.catkn} cATKN` : `${activeBalance.mon} MON`}</strong>, but this job requires <strong className="text-slate-900 dark:text-white font-mono">{totalUpfrontDeposit} {currency}</strong> to fund {numSlots} freelancer position(s).
              </p>
              {currency === 'cATKN' && (
                <button
                  type="button"
                  onClick={() => claimFaucet()}
                  className="neu-btn-primary px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 mt-1"
                >
                  <span>Claim Faucet (+10,000 cATKN)</span>
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="neu-btn-secondary px-5 py-2 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !activePersona.isVerified || !sufficient}
              className={`neu-btn-primary px-6 py-2.5 text-xs font-extrabold flex items-center gap-2 ${
                isSubmitting || !activePersona.isVerified || !sufficient ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {!activePersona.isVerified
                  ? '🔒 Identity Blocked'
                  : !sufficient
                  ? `Insufficient ${currency} Balance`
                  : isSubmitting
                  ? 'Deploying & Funding...'
                  : `Create & Deposit ${totalUpfrontDeposit} ${currency}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
