'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ChevronLeft,
  Package,
  Compass,
  FileText,
  Code,
  MessageSquare,
  Gamepad2,
  Tag,
  Lock,
  Wallet,
  CheckCircle2,
  Briefcase,
  ShoppingBag,
  Plus,
  ShieldAlert,
  ExternalLink,
  Coins,
  Cpu,
  Shield,
  BarChart3,
  Layout,
} from 'lucide-react';
import { usePersona } from '../context/PersonaContext';
import { useToast } from '../context/ToastContext';
import { useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { FACTORY_ADDRESS, CATKN_ADDRESS, ESCROW_FACTORY_ABI, ESCROW_ABI, CATKN_ABI, CATKN_DECIMALS } from '../lib/contracts';
import { Deal, DealType, DeliverableFormat } from '../types/deal';

interface DealsPageProps {
  onBackToHome: () => void;
  onDealCreated: (newDeal: Deal) => void;
  initialDealType?: DealType;
}

export const DealsPage: React.FC<DealsPageProps> = ({ onBackToHome, onDealCreated, initialDealType = 'SERVICE_LISTING' }) => {
  const { activePersona, hasSufficientBalance, activeBalance, claimFaucet, deductBalance, appMode } = usePersona();
  const { showInfo, showSuccess, showError } = useToast();
  const publicClient = usePublicClient();

  const [dealType, setDealType] = useState<DealType>(initialDealType);

  useEffect(() => {
    if (initialDealType) {
      setDealType(initialDealType);
    }
  }, [initialDealType]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('500');
  const [currency, setCurrency] = useState<'cATKN' | 'MON'>('cATKN');
  const [minTier, setMinTier] = useState<number>(20);
  const [prohibitedCountries, setProhibitedCountries] = useState<string[]>(['RU']);
  const [customCountryInput, setCustomCountryInput] = useState('');
  const [quantity, setQuantity] = useState('1');
  const slots = quantity;
  const setSlots = setQuantity;
  const [deliveryTerms, setDeliveryTerms] = useState('Full deliverable source code and verification artifacts submitted within deadline.');
  const [refundTerms, setRefundTerms] = useState('Full refund automatically returned to client if deliverable is rejected or missed.');
  const [deliveryDeadlineHrs, setDeliveryDeadlineHrs] = useState('48');
  const [confirmationWindowHrs, setConfirmationWindowHrs] = useState('24');
  const [expectedDeliverableFormat, setExpectedDeliverableFormat] = useState<DeliverableFormat>('FILE');
  const [category, setCategory] = useState('DeFi Protocols');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { id: 'DeFi Protocols', label: 'DeFi Protocols', icon: Coins },
    { id: 'Security Audit', label: 'Security Audit', icon: ShieldCheck },
    { id: 'Infrastructure', label: 'Infrastructure', icon: Cpu },
    { id: 'Compliance & Identity', label: 'Compliance & Identity', icon: Shield },
    { id: 'Tokenomics & Strategy', label: 'Tokenomics & Strategy', icon: BarChart3 },
    { id: 'dApp Frontend & UX', label: 'dApp Frontend & UX', icon: Layout },
  ];

  const { writeContractAsync } = useWriteContract();

  const priceNum = parseFloat(price) || 0;
  const slotsNum = Math.max(1, parseInt(slots) || 1);
  const totalUpfrontDeposit = currency === 'MON' ? parseFloat((priceNum * slotsNum).toFixed(4)) : Math.round(priceNum * slotsNum);
  const sufficient = hasSufficientBalance(totalUpfrontDeposit, currency, activePersona.walletAddress);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms || !activePersona.isVerified || !sufficient) return;

    setIsSubmitting(true);

    // ── PRODUCTION MODE: Real On-Chain Contract Deployment & Deposit via Web3 ──
    if (appMode === 'production') {
      try {
        const totalAmountHuman = priceNum * slotsNum;
        const totalAmountBigInt = parseUnits(totalAmountHuman.toString(), CATKN_DECIMALS);
        
        showInfo('Step 1/3: Deploying Escrow Contract Vault on Monad Testnet...');
        const deployTx = await writeContractAsync({
          address: FACTORY_ADDRESS,
          abi: ESCROW_FACTORY_ABI,
          functionName: 'createEscrow',
          args: [CATKN_ADDRESS, totalAmountBigInt],
        });

        if (publicClient) {
          try {
            await publicClient.waitForTransactionReceipt({ hash: deployTx });
          } catch (e) {}
        }

        const generatedEscrow = '0x' + deployTx.slice(2, 42);
        let realDepositTxHash: string | undefined = undefined;

        if (dealType === 'JOB_POSTING' && totalAmountHuman > 0) {
          try {
            showInfo(`Step 2/3: Approving ${totalAmountHuman} ${currency} token deposit...`);
            const approveTx = await writeContractAsync({
              address: CATKN_ADDRESS,
              abi: CATKN_ABI,
              functionName: 'approve',
              args: [generatedEscrow as `0x${string}`, totalAmountBigInt],
            });

            if (publicClient) {
              try {
                await publicClient.waitForTransactionReceipt({ hash: approveTx });
              } catch (e) {}
            }

            showInfo(`Step 3/3: Funding Escrow Deposit Vault on Monad Testnet...`);
            realDepositTxHash = await writeContractAsync({
              address: generatedEscrow as `0x${string}`,
              abi: ESCROW_ABI,
              functionName: 'fund',
            });
            showSuccess('Escrow Vault Deployed & Deposit Locked on-chain on Monad Testnet!');
          } catch (fundErr: any) {
            console.warn('[JOB DEPOSIT] On-chain deposit step deferred:', fundErr.message);
          }
        }

        const newDeal: Deal = {
          id: `deal-${Date.now()}`,
          type: dealType,
          initiatorAddress: activePersona.walletAddress,
          initiatorName: activePersona.name,
          chain: 'monad',
          title: title || (dealType === 'JOB_POSTING' ? 'Custom Web3 Development Job' : 'Web3 Development Service Listing'),
          description: description || 'Cleanverse identity-gated escrow deal.',
          price: priceNum,
          currency,
          minTier,
          prohibitedCountries,
          quantity: slotsNum,
          totalSlots: slotsNum,
          deliveryTerms,
          refundTerms,
          deliveryDeadlineHrs: parseInt(deliveryDeadlineHrs) || 48,
          confirmationWindowHrs: parseInt(confirmationWindowHrs) || 24,
          expectedDeliverableFormat,
          category,
          status: realDepositTxHash ? 'FUNDED' : 'OPEN',
          escrowAddress: generatedEscrow,
          creationTxHash: deployTx,
          depositTxHash: realDepositTxHash,
          createdAt: Date.now(),
          participantWallets: [activePersona.walletAddress],
        };

        onDealCreated(newDeal);
        setIsSubmitting(false);
        onBackToHome();
      } catch (err: any) {
        setIsSubmitting(false);
        showError(err?.shortMessage || err?.message || 'On-chain escrow deployment failed or cancelled.');
      }
      return;
    }

    // Demo Mode Simulation
    setTimeout(() => {
      const newDeal: Deal = {
        id: `deal-${Date.now()}`,
        type: dealType,
        initiatorAddress: activePersona.walletAddress,
        initiatorName: activePersona.name,
        chain: 'monad',
        title: title || (dealType === 'JOB_POSTING' ? 'Custom Web3 Development Job' : 'Web3 Development Service Listing'),
        description: description || 'Cleanverse identity-gated escrow deal.',
        price: priceNum,
        currency,
        minTier,
        prohibitedCountries,
        quantity: slotsNum,
        totalSlots: slotsNum,
        deliveryTerms,
        refundTerms,
        deliveryDeadlineHrs: parseInt(deliveryDeadlineHrs) || 48,
        confirmationWindowHrs: parseInt(confirmationWindowHrs) || 24,
        expectedDeliverableFormat,
        category,
        status: 'OPEN',
        escrowAddress: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        createdAt: Date.now(),
        participantWallets: [activePersona.walletAddress],
      };

      onDealCreated(newDeal);
      setIsSubmitting(false);
      onBackToHome();
    }, 800);
  };

  const applyTemplate = (tmpl: any) => {
    setTitle(tmpl.title);
    setDescription(tmpl.description);
    setPrice(tmpl.price);
    setMinTier(tmpl.minTier);
    setQuantity(tmpl.quantity);
    setCategory(tmpl.category);
    setDeliveryTerms(tmpl.deliveryTerms);
    setRefundTerms(tmpl.refundTerms);
    setDeliveryDeadlineHrs(tmpl.deadline);
    setExpectedDeliverableFormat(tmpl.format);
  };

  const templates = [
    {
      name: 'Freelance Standard',
      icon: Briefcase,
      title: 'Custom Web3 Frontend & Smart Contract Gating',
      description: 'Full-stack Web3 application with attestation signing and token gating.',
      price: '500',
      minTier: 15,
      quantity: '1',
      category: 'Software',
      deliveryTerms: 'GitHub repository access + deployed Vercel instance',
      refundTerms: 'Full refund within 24h if specifications fail',
      deadline: '48',
      format: 'FILE' as DeliverableFormat,
    },
    {
      name: 'Enterprise Audit',
      icon: ShieldCheck,
      title: 'Institutional Smart Contract Audit & Formal Verification',
      description: 'Comprehensive static analysis, manual review, and signed audit certificate.',
      price: '10000',
      minTier: 60,
      quantity: '2',
      category: 'Software',
      deliveryTerms: 'PDF Audit Report signed by lead auditor + pull request fixes',
      refundTerms: 'Full refund if deadline missed by > 48 hours',
      deadline: '120',
      format: 'FILE' as DeliverableFormat,
    },
    {
      name: 'Compliant Payroll',
      icon: Wallet,
      title: 'Monthly Verified Contributor Distribution',
      description: 'Identity-gated payroll batch for Cleanverse Tier 20+ verified team members.',
      price: '1200',
      minTier: 20,
      quantity: '5',
      category: 'Consulting',
      deliveryTerms: 'Monthly progress milestone deliverable report',
      refundTerms: 'Unused milestone funds returned to treasury',
      deadline: '24',
      format: 'MULTI_ASSET' as DeliverableFormat,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-12 animate-fadeIn space-y-6">
      {/* Header / Breadcrumb */}
      <div>
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all mb-2"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl neu-inset text-indigo-500 flex items-center justify-center font-bold">
            <Plus className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Create Compliant Escrow Deal</h1>
            <p className="text-xs text-slate-600 dark:text-slate-300">Configure Identity-Gated Escrow Smart Contract Policy</p>
          </div>
        </div>
      </div>

      {/* Compliance Templates Bar */}
      <div className="neu-card p-5 space-y-3">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
          COMPLIANCE PRESET TEMPLATES
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templates.map((tmpl) => {
            const IconComp = tmpl.icon;
            return (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => applyTemplate(tmpl)}
                className="neu-inset p-3.5 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <IconComp className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{tmpl.name}</span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-1 font-mono">
                  Min Tier {tmpl.minTier} · {tmpl.price} cATKN
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deal Type Switcher (Model A vs Model B) */}
        <div className="neu-card p-6 space-y-4">
          <label className="block text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider">SELECT DEAL MODEL *</label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Model B: Service Listing */}
            <div
              onClick={() => setDealType('SERVICE_LISTING')}
              className={`p-5 rounded-2xl cursor-pointer transition-all ${
                dealType === 'SERVICE_LISTING'
                  ? 'neu-card border-2 border-indigo-500 text-slate-900 dark:text-white shadow-md'
                  : 'neu-inset opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  dealType === 'SERVICE_LISTING' ? 'neu-btn-primary' : 'neu-card text-slate-700 dark:text-slate-300'
                }`}>
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fixed Service / OTC Escrow</h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Provider-Initiated Fixed Settlement Offer</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                You offer a service/digital contract at a fixed rate. Counterparties lock funds in an isolated escrow contract instance.
              </p>
            </div>

            {/* Model A: Work Bounty / Project Escrow */}
            <div
              onClick={() => setDealType('JOB_POSTING')}
              className={`p-5 rounded-2xl cursor-pointer transition-all ${
                dealType === 'JOB_POSTING'
                  ? 'neu-card border-2 border-purple-500 text-slate-900 dark:text-white shadow-md'
                  : 'neu-inset opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  dealType === 'JOB_POSTING' ? 'neu-btn-primary' : 'neu-card text-slate-700 dark:text-slate-300'
                }`}>
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Work Bounty / Project Escrow</h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Originator-Initiated Escrow Request</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                You post a project requirement. Verified freelancers apply/accept, and you fund escrow upon agreement.
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Basic Deal Info */}
        <div className="neu-card p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider mb-1.5">TITLE *</label>
            <input
              type="text"
              required
              placeholder={dealType === 'JOB_POSTING' ? 'e.g. Need Web3 React Developer for Smart Contract Escrow' : 'e.g. Custom Telegram Bot Development & Smart Contract Gating'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 neu-inset text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider mb-1.5">DESCRIPTION & SCOPE *</label>
            <textarea
              rows={3}
              required
              placeholder="Describe the exact deliverables, requirements, and technical specifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 neu-inset text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Category Selector Grid */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider mb-2">
              ESCROW CATEGORY *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => {
                const IconComp = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                      category === cat.id
                        ? 'neu-btn-primary shadow-md'
                        : 'neu-btn-secondary'
                    }`}
                  >
                    <IconComp className="h-4 w-4" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing, Currency, Minimum Tier, & Max Participants */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider mb-1.5">PRICE *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-3 neu-inset text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider mb-1.5">CURRENCY</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-4 py-3 neu-inset text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="cATKN">cATKN (Cleanverse Token)</option>
                <option value="MON">MON (Monad Native Token)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider mb-1.5">CLEANVERSE MIN TIER *</label>
              <select
                value={minTier}
                onChange={(e) => setMinTier(parseInt(e.target.value))}
                className="w-full px-4 py-3 neu-inset text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none font-mono"
              >
                <option value={10}>Tier 10 — Basic Identity Verified (Email / Phone)</option>
                <option value={20}>Tier 20 — Standard A-Pass Verified (Gov ID & Face Match)</option>
                <option value={30}>Tier 30 — Advanced Verified (Proof of Address & Clean OFAC)</option>
                <option value={40}>Tier 40 — Enterprise & DAO Treasury (Institutional Verification)</option>
                <option value={50}>Tier 50 — Institutional Validator Pool (Maximum Trust)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider mb-1.5">DELIVERY DEADLINE *</label>
              <select
                value={deliveryDeadlineHrs}
                onChange={(e) => setDeliveryDeadlineHrs(e.target.value)}
                className="w-full px-4 py-3 neu-inset text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="24">24 Hours</option>
                <option value="48">48 Hours (2 Days)</option>
                <option value="72">72 Hours (3 Days)</option>
                <option value="168">7 Days (1 Week)</option>
                <option value="336">14 Days (2 Weeks)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Validator Pool Compliance & Regional Restrictions */}
        <div className="neu-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              VALIDATOR POOL REGIONAL SANCTIONS & COMPLIANCE RULES
            </h3>
            <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-400/30 font-mono">
              VALIDATOR GATING
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Select high-risk jurisdictions or add custom ISO 2-letter country codes to prohibit participating wallets from accepting or funding this escrow contract instance.
          </p>

          {/* Quick-toggle preset country chips */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
              QUICK SANCTIONS TOGGLE (CLICK TO EXCLUDE)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { code: 'RU', name: 'Russia (OFAC Sanctions)' },
                { code: 'CN', name: 'China (Crypto Restricted)' },
                { code: 'US', name: 'United States (SEC Restricted)' },
                { code: 'IR', name: 'Iran (OFAC High Risk)' },
                { code: 'KP', name: 'North Korea (FATF Blacklisted)' },
              ].map((c) => {
                const isExcluded = prohibitedCountries.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggleProhibitedCountry(c.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isExcluded
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 font-extrabold shadow-sm'
                        : 'neu-btn-secondary opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span>{isExcluded ? 'PROHIBITED' : '+ Exclude'} {c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom ISO Country Input & Active List */}
          <div className="pt-2 border-t border-slate-300/40 dark:border-slate-800/60 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={2}
                placeholder="Custom 2-Letter ISO Code (e.g. GB, DE, SG)..."
                value={customCountryInput}
                onChange={(e) => setCustomCountryInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 neu-inset text-xs font-mono text-slate-900 dark:text-white uppercase focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomCountry}
                className="neu-btn-secondary px-4 py-2.5 text-xs font-bold flex-shrink-0"
              >
                + Add Prohibited Code
              </button>
            </div>

            {/* Currently Active Prohibited List */}
            {prohibitedCountries.length > 0 && (
              <div className="neu-inset p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Active Prohibited Country List ({prohibitedCountries.length}):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {prohibitedCountries.map((code) => (
                    <span
                      key={code}
                      onClick={() => toggleProhibitedCountry(code)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-extrabold cursor-pointer hover:bg-rose-600 transition-colors flex items-center gap-1 font-mono"
                      title="Click to remove from prohibited list"
                    >
                      {code} ×
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Delivery & Refund Terms */}
        <div className="neu-card p-6 space-y-4">
          <h3 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider">ESCROW TERMS & RULES</h3>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">EXPECTED DELIVERABLE FORMAT *</label>
            <select
              value={expectedDeliverableFormat}
              onChange={(e) => setExpectedDeliverableFormat(e.target.value as any)}
              className="w-full px-4 py-3 neu-inset text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="FILE">File Upload (ZIP, PDF, Image, Code Package)</option>
              <option value="CREDENTIALS">License Key / Secret Credentials (API Keys, Tokens, Access Passwords)</option>
              <option value="URL">External Link / URL (GitHub Repo, Figma File, Vercel Preview)</option>
              <option value="MULTI_ASSET">Multi-Asset Package (Files + Credentials + Links)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">DELIVERY TERMS ("What counts as delivery") *</label>
            <input
              type="text"
              required
              placeholder="e.g. GitHub repo pull request + live Vercel preview link"
              value={deliveryTerms}
              onChange={(e) => setDeliveryTerms(e.target.value)}
              className="w-full px-4 py-3 neu-inset text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">REFUND TERMS ("When refunds apply") *</label>
            <input
              type="text"
              required
              placeholder="e.g. Full refund within 24h if specifications fail"
              value={refundTerms}
              onChange={(e) => setRefundTerms(e.target.value)}
              className="w-full px-4 py-3 neu-inset text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">DELIVERY DEADLINE (HOURS)</label>
              <input
                type="number"
                value={deliveryDeadlineHrs}
                onChange={(e) => setDeliveryDeadlineHrs(e.target.value)}
                className="w-full px-4 py-3 neu-inset text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">REVIEW WINDOW (HOURS)</label>
              <input
                type="number"
                value={confirmationWindowHrs}
                onChange={(e) => setConfirmationWindowHrs(e.target.value)}
                className="w-full px-4 py-3 neu-inset text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Agreement Checkbox & Submit */}
        <div className="neu-card p-6 space-y-4">
          {/* Upfront Escrow Deposit Summary for Job Postings */}
          {dealType === 'JOB_POSTING' && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Upfront Job Escrow Deposit Calculation
                </span>
                <span className="text-xs font-mono font-extrabold text-indigo-400 bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                  {slotsNum} Slot{slotsNum > 1 ? 's' : ''} × {priceNum} {currency}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1 border-t border-indigo-500/20">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Total Upfront Lock Required:
                </span>
                <span className="text-base font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                  {totalUpfrontDeposit} {currency}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Locking {totalUpfrontDeposit} {currency} in Escrow contract upfront guarantees that all {slotsNum} freelancer slot(s) are fully covered and ready for payout upon work completion.
              </p>
            </div>
          )}

          {/* Insufficient Balance Warning for Job Postings */}
          {dealType === 'JOB_POSTING' && !sufficient && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0" />
                <span>Insufficient Balance to Fund All {slotsNum} Slots</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200">
                You currently have <strong className="text-rose-500 dark:text-rose-400 font-mono">{currency === 'cATKN' ? `${activeBalance.catkn.toLocaleString()} cATKN` : `${activeBalance.mon} MON`}</strong>, but this job requires <strong className="text-slate-900 dark:text-white font-mono">{totalUpfrontDeposit.toLocaleString()} {currency}</strong> to fund {slotsNum} freelancer position(s).
              </p>
              {currency === 'cATKN' && (
                <button
                  type="button"
                  onClick={() => claimFaucet()}
                  className="neu-btn-primary px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 mt-1"
                >
                  <span>Claim Faucet (+10,000 cATKN)</span>
                </button>
              )}
            </div>
          )}

          {!activePersona.isVerified && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0" />
                <span>Cleanverse Protocol Error: Identity Blocked (Unverified Tier 0)</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                Unverified or blocked wallets are strictly forbidden from creating Job Postings or Service Listings. Please complete verification at the Cleanverse Onboarding Portal.
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

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              disabled={!activePersona.isVerified || !sufficient}
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500 h-4 w-4 disabled:opacity-50"
            />
            <span className="text-xs text-slate-700 dark:text-slate-200 leading-snug font-medium">
              I agree to lock {dealType === 'JOB_POSTING' ? `${totalUpfrontDeposit} ${currency}` : 'funds'} in <code className="font-mono font-bold text-slate-900 dark:text-white">Escrow contract</code> on Monad Testnet. Cleanverse identity validation will enforce participant tier gating prior to payout release.
            </span>
          </label>

          <button
            type="submit"
            disabled={!agreedTerms || isSubmitting || !activePersona.isVerified || !sufficient}
            className={`w-full neu-btn-primary py-4 px-6 text-xs font-extrabold flex items-center justify-center gap-2 ${
              !agreedTerms || isSubmitting || !activePersona.isVerified || !sufficient ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>
              {!activePersona.isVerified
                ? 'Identity Blocked — Verification Required'
                : !sufficient
                ? `Insufficient ${currency} Balance`
                : isSubmitting
                ? 'Deploying Escrow Deal...'
                : dealType === 'JOB_POSTING'
                ? `Publish Job & Deposit ${totalUpfrontDeposit} ${currency}`
                : 'Publish Service Listing'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
