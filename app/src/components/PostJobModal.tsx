'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, ShieldAlert, Sparkles, DollarSign, Clock, ExternalLink, Users, AlertCircle, Coins } from 'lucide-react';
import { useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { usePersona } from '../context/PersonaContext';
import { useToast } from '../context/ToastContext';
import { FACTORY_ADDRESS, CATKN_ADDRESS, ESCROW_FACTORY_ABI, ESCROW_ABI, CATKN_ABI, CATKN_DECIMALS } from '../lib/contracts';
import { Deal } from '../types/deal';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (newJob: Deal) => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({ isOpen, onClose, onJobCreated }) => {
  const { activePersona, hasSufficientBalance, activeBalance, claimFaucet, deductBalance, appMode } = usePersona();
  const { showInfo, showSuccess, showError } = useToast();
  const { writeContractAsync } = useWriteContract();

  const [dealType, setDealType] = useState<'SERVICE_LISTING' | 'DIRECT_DEAL'>('SERVICE_LISTING');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('DeFi Protocols');
  const [pricePerSlot, setPricePerSlot] = useState('1000');
  const [slots, setSlots] = useState('5');
  const [currency, setCurrency] = useState<'cATKN' | 'MON'>('cATKN');
  const [deliveryHours, setDeliveryHours] = useState('48');
  const [minTier, setMinTier] = useState('20');
  const [prohibitedCountries, setProhibitedCountries] = useState<string[]>(['RU']);
  const [customCountryInput, setCustomCountryInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleProhibitedCountry = (code: string) => {
    setProhibitedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleAddCustomCountry = () => {
    const clean = customCountryInput.trim().toUpperCase();
    if (clean && clean.length === 2 && !prohibitedCountries.includes(clean)) {
      setProhibitedCountries((prev) => [...prev, clean]);
      setCustomCountryInput('');
    }
  };

  if (!isOpen) return null;

  const numPrice = parseFloat(pricePerSlot) || 0;
  const numSlots = Math.max(1, parseInt(slots) || 1);
  const totalUpfrontDeposit = currency === 'MON' 
    ? parseFloat((numPrice * numSlots).toFixed(4))
    : Math.round(numPrice * numSlots);

  const sufficient = hasSufficientBalance(totalUpfrontDeposit, currency, activePersona.walletAddress);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePersona.isVerified) return;

    setIsSubmitting(true);

    // ── PRODUCTION MODE: Real On-Chain Contract Deployment via Web3 ──
    if (appMode === 'production') {
      try {
        const totalAmountBigInt = parseUnits((numPrice * (dealType === 'SERVICE_LISTING' ? numSlots : 1)).toString(), CATKN_DECIMALS);

        showInfo('Step 1/2: Deploying Escrow Contract Vault on Monad Testnet...');
        const deployTx = await writeContractAsync({
          address: FACTORY_ADDRESS,
          abi: ESCROW_FACTORY_ABI,
          functionName: 'createEscrow',
          args: [CATKN_ADDRESS, totalAmountBigInt],
        });

        const generatedEscrow = '0x' + deployTx.slice(2, 42);

        const newJob: Deal = {
          id: `deal-${Date.now()}`,
          type: dealType,
          chain: 'monad',
          title: title || (dealType === 'DIRECT_DEAL' ? '1-on-1 Custom Escrow Deal' : 'Web3 Development Service Listing'),
          description: dealType === 'SERVICE_LISTING' 
            ? `Service offering by ${activePersona.name} available for up to ${numSlots} clients at ${numPrice} ${currency} per service.`
            : `1-on-1 Custom Escrow Deal created by ${activePersona.name} at ${numPrice} ${currency}.`,
          category,
          price: numPrice,
          currency,
          minTier: parseInt(minTier) || 10,
          prohibitedCountries,
          deliveryTerms: `Deliver full asset according to specification within ${deliveryHours} hours.`,
          refundTerms: 'Full refund to client if deliverable is not submitted within deadline.',
          deliveryDeadlineHrs: parseInt(deliveryHours) || 48,
          confirmationWindowHrs: 24,
          serviceCapacity: dealType === 'SERVICE_LISTING' ? numSlots : 1,
          purchasedCount: 0,
          quantity: dealType === 'SERVICE_LISTING' ? numSlots : 1,
          totalSlots: dealType === 'SERVICE_LISTING' ? numSlots : 1,
          status: 'OPEN',
          initiatorAddress: activePersona.walletAddress,
          initiatorName: activePersona.name,
          escrowAddress: generatedEscrow,
          creationTxHash: deployTx,
          createdAt: Date.now(),
          participantWallets: [activePersona.walletAddress],
        };

        onJobCreated(newJob);
        setIsSubmitting(false);
        onClose();
      } catch (err: any) {
        setIsSubmitting(false);
        showError(err?.shortMessage || err?.message || 'On-chain escrow deployment failed or cancelled.');
      }
      return;
    }

    // Demo Mode Simulation
    setTimeout(() => {
      const generatedTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const generatedEscrow = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

      const newJob: Deal = {
        id: `deal-${Date.now()}`,
        type: dealType,
        chain: 'monad',
        title: title || (dealType === 'DIRECT_DEAL' ? '1-on-1 Custom Escrow Deal' : 'Web3 Development Service Listing'),
        description: dealType === 'SERVICE_LISTING' 
          ? `Service offering by ${activePersona.name} available for up to ${numSlots} clients at ${numPrice} ${currency} per service.`
          : `1-on-1 Custom Escrow Deal created by ${activePersona.name} at ${numPrice} ${currency}.`,
        category,
        price: numPrice,
        currency,
        minTier: parseInt(minTier) || 10,
        prohibitedCountries,
        deliveryTerms: `Deliver full asset according to specification within ${deliveryHours} hours.`,
        refundTerms: 'Full refund to client if deliverable is not submitted within deadline.',
        deliveryDeadlineHrs: parseInt(deliveryHours) || 48,
        confirmationWindowHrs: 24,
        serviceCapacity: dealType === 'SERVICE_LISTING' ? numSlots : 1,
        purchasedCount: 0,
        quantity: dealType === 'SERVICE_LISTING' ? numSlots : 1,
        totalSlots: dealType === 'SERVICE_LISTING' ? numSlots : 1,
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
    }, 800);
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
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Create Escrow Deal or Service Listing</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">Deploy Cleanverse Identity-Gated Escrow Vault on Monad</p>
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
          {/* Escrow Type Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 neu-inset rounded-xl">
            <button
              type="button"
              onClick={() => setDealType('SERVICE_LISTING')}
              className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all ${
                dealType === 'SERVICE_LISTING'
                  ? 'neu-btn-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Public Service Listing
            </button>
            <button
              type="button"
              onClick={() => setDealType('DIRECT_DEAL')}
              className={`py-2 px-3 text-xs font-extrabold rounded-lg transition-all ${
                dealType === 'DIRECT_DEAL'
                  ? 'neu-btn-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1-on-1 Custom Deal
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {dealType === 'SERVICE_LISTING' ? 'Service Title' : 'Escrow Deal Title'}
            </label>
            <input
              type="text"
              required
              disabled={!activePersona.isVerified}
              placeholder={dealType === 'SERVICE_LISTING' ? 'e.g. Smart Contract Security Audit & Report' : 'e.g. 1-on-1 OTC Token Sale & Escrow Agreement'}
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
            <div className="py-2.5 px-4 neu-inset text-xs font-extrabold text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center gap-2">
              <Coins className="h-4 w-4 text-indigo-500" />
              <span>cATKN (Cleanverse Compliant Token)</span>
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
                Cleanverse Min Tier *
              </label>
              <select
                disabled={!activePersona.isVerified}
                value={minTier}
                onChange={(e) => setMinTier(e.target.value)}
                className="w-full px-3 py-2.5 neu-inset text-xs font-bold text-indigo-600 dark:text-indigo-400 disabled:opacity-50 focus:outline-none"
              >
                <option value="10">Tier 10 — Basic Identity Verified (Email / Phone)</option>
                <option value="20">Tier 20 — Standard A-Pass Verified (Gov ID & Face Match)</option>
                <option value="30">Tier 30 — Advanced Verified (Proof of Address & Clean OFAC)</option>
                <option value="40">Tier 40 — Enterprise & DAO Treasury (Institutional Verification)</option>
                <option value="50">Tier 50 — Institutional Validator Pool (Maximum Trust)</option>
              </select>
            </div>
          </div>

          {/* Regional Sanctions & Country Prohibitions Manager */}
          <div className="neu-inset p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                Prohibited Regional Sanctions
              </span>
              <span className="text-[9px] bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded border border-rose-400/30">
                VALIDATOR GATED
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
              Exclude specific high-risk jurisdictions or add custom 2-letter ISO country codes to prevent wallets from participating in this escrow.
            </p>

            {/* Preset Exclusion Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { code: 'RU', name: 'Russia (OFAC)' },
                { code: 'CN', name: 'China' },
                { code: 'US', name: 'United States' },
                { code: 'IR', name: 'Iran' },
                { code: 'KP', name: 'North Korea' },
              ].map((c) => {
                const isExcluded = prohibitedCountries.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleProhibitedCountry(c.code)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      isExcluded
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 font-extrabold'
                        : 'neu-btn-secondary opacity-70 hover:opacity-100'
                    }`}
                  >
                    {isExcluded ? 'PROHIBITED' : '+ Exclude'} {c.name}
                  </button>
                );
              })}
            </div>

            {/* Custom ISO Code Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                maxLength={2}
                placeholder="ISO Code (e.g. GB, DE)..."
                value={customCountryInput}
                onChange={(e) => setCustomCountryInput(e.target.value)}
                className="flex-1 px-3 py-1.5 neu-inset text-xs font-mono uppercase text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomCountry}
                className="neu-btn-secondary px-3 py-1.5 text-xs font-bold"
              >
                + Add Code
              </button>
            </div>

            {/* Active Prohibited List */}
            {prohibitedCountries.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-bold text-slate-500">Excluded:</span>
                {prohibitedCountries.map((code) => (
                  <span
                    key={code}
                    onClick={() => toggleProhibitedCountry(code)}
                    className="px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-extrabold cursor-pointer hover:bg-rose-600 transition-colors font-mono"
                    title="Click to remove"
                  >
                    {code} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Escrow Creation Summary Card */}
          <div className="bg-indigo-500/10 border border-indigo-500/30 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                {dealType === 'SERVICE_LISTING' ? 'Public Service Listing Details' : '1-on-1 Custom Deal Details'}
              </span>
              <span className="text-xs font-mono font-extrabold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
                {numPrice} {currency} {dealType === 'SERVICE_LISTING' ? `(Capacity: ${numSlots} Clients)` : ''}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              {dealType === 'SERVICE_LISTING' 
                ? `Publishing this service listing allows up to ${numSlots} clients to purchase. Buyers deposit funds into dedicated 1-on-1 escrow contracts upon purchase.`
                : `Publishing this custom deal generates a shareable 1-on-1 link for your counterparty to lock escrow funds.`}
            </p>
          </div>

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
              disabled={isSubmitting || !activePersona.isVerified}
              className={`neu-btn-primary px-6 py-2.5 text-xs font-extrabold flex items-center gap-2 ${
                isSubmitting || !activePersona.isVerified ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {!activePersona.isVerified
                  ? 'Identity Blocked'
                  : isSubmitting
                  ? 'Deploying Escrow Vault...'
                  : dealType === 'SERVICE_LISTING'
                  ? 'Publish Service Listing'
                  : 'Create 1-on-1 Escrow Deal'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
