'use client';

import React from 'react';
import {
  X,
  User,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Globe,
  DollarSign,
  Package,
  Layers,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Droplets,
  History,
  Copy,
  Check,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { usePersona, MOCK_PERSONAS } from '../context/PersonaContext';
import { useDeals } from '../context/DealsContext';
import { useToast } from '../context/ToastContext';
import { Deal } from '../types/deal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeal: (deal: Deal) => void;
  openDisputeAudit: (txHash: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSelectDeal,
  openDisputeAudit,
}) => {
  const { activePersona, activePersonaKey, setActivePersonaKey, activeBalance, claimFaucet, selfIssueAPass, appMode } = usePersona();
  const { deals, resetDeals } = useDeals();
  const { showSuccess } = useToast();

  if (!isOpen) return null;

  // Filter My Created Deals (Listings & Jobs created by this persona — exclude child slot instances)
  const myCreatedDeals = deals.filter((d) => {
    const isChild = d.id.includes('-order-') || d.id.includes('-accepted-') || d.id.includes('-slot-');
    const activeFirstName = activePersona.name.split(' ')[0].toLowerCase();
    const dealInitiatorFirst = d.initiatorName.split(' ')[0].toLowerCase();

    const isInitiator =
      activePersona.walletAddress.toLowerCase() === d.initiatorAddress.toLowerCase() ||
      activeFirstName === dealInitiatorFirst;

    return isInitiator && !isChild;
  });

  // Filter My Purchased / Accepted Deals (Must not be initiator, must be actual slot instance or purchased contract)
  const myPurchasedDeals = deals.filter((d) => {
    const isChild = d.id.includes('-order-') || d.id.includes('-accepted-') || d.id.includes('-slot-');
    const activeFirstName = activePersona.name.split(' ')[0].toLowerCase();
    const dealCounterpartyFirst = d.counterpartyName ? d.counterpartyName.split(' ')[0].toLowerCase() : '';
    const dealInitiatorFirst = d.initiatorName.split(' ')[0].toLowerCase();

    const isInitiator =
      activePersona.walletAddress.toLowerCase() === d.initiatorAddress.toLowerCase() ||
      activeFirstName === dealInitiatorFirst;

    const isCounterparty =
      !isInitiator &&
      ((d.counterpartyAddress && d.counterpartyAddress.toLowerCase() === activePersona.walletAddress.toLowerCase()) ||
        (dealCounterpartyFirst !== '' && activeFirstName === dealCounterpartyFirst) ||
        (d.participantWallets && d.participantWallets.some((w) => w.toLowerCase() === activePersona.walletAddress.toLowerCase() && w.toLowerCase() !== d.initiatorAddress.toLowerCase())));

    const isPurchasedInstance = isChild || (d.counterpartyAddress && d.counterpartyAddress.toLowerCase() === activePersona.walletAddress.toLowerCase() && d.status !== 'OPEN');

    return isCounterparty && isPurchasedInstance;
  });

  const totalVolume = myCreatedDeals.reduce((sum, d) => sum + d.price, 0) + myPurchasedDeals.reduce((sum, d) => sum + d.price, 0);

  const [profileTab, setProfileTab] = React.useState<'overview' | 'history'>('overview');
  const [copiedTx, setCopiedTx] = React.useState<string | null>(null);

  const handleCopyTx = (txHash: string) => {
    try {
      navigator.clipboard.writeText(txHash);
      setCopiedTx(txHash);
      showSuccess('Transaction hash copied to clipboard!');
      setTimeout(() => setCopiedTx(null), 2000);
    } catch (e) {
      showSuccess('Hash: ' + txHash.slice(0, 10) + '...');
    }
  };

  interface TxItem {
    id: string;
    type: 'CREATE' | 'FUND' | 'ATTESTATION' | 'RELEASE' | 'FAUCET';
    txHash: string;
    title: string;
    subtitle: string;
    amount?: string;
    timestamp: number;
    status: 'CONFIRMED' | 'VERIFIED' | 'SETTLED';
    deal?: Deal;
  }

  const txHistory: TxItem[] = [];

  // 1. Transactions executed by the CREATOR of the deal (myCreatedDeals)
  myCreatedDeals.forEach((d) => {
    const baseTs = typeof d.createdAt === 'number' ? d.createdAt : new Date(d.createdAt).getTime();

    // Creator deployed the escrow contract
    if (d.creationTxHash) {
      txHistory.push({
        id: `create-${d.id}`,
        type: 'CREATE',
        txHash: d.creationTxHash,
        title: `Escrow Contract Deployed`,
        subtitle: `${d.title} · Factory 0xC068...9334`,
        amount: `${d.price} ${d.currency}`,
        timestamp: baseTs,
        status: 'CONFIRMED',
        deal: d,
      });
    }

    // ONLY show deposit in creator history if the CREATOR funded it (i.e. JOB_POSTING where Client funds upfront)
    if (d.depositTxHash && d.type === 'JOB_POSTING') {
      txHistory.push({
        id: `deposit-${d.id}`,
        type: 'FUND',
        txHash: d.depositTxHash,
        title: `Escrow Pool Funded`,
        subtitle: `Locked in Escrow Smart Contract (${d.title})`,
        amount: `-${d.price} ${d.currency}`,
        timestamp: baseTs + 30000,
        status: 'CONFIRMED',
        deal: d,
      });
    }

    // ONLY show release in creator history if the CREATOR released payout to freelancer
    if (d.releaseTxHash) {
      txHistory.push({
        id: `release-${d.id}`,
        type: 'RELEASE',
        txHash: d.releaseTxHash,
        title: `Escrow Payout Released`,
        subtitle: `Released payout to freelancer & exported Travel Rule report`,
        amount: `-${d.price} ${d.currency}`,
        timestamp: baseTs + 180000,
        status: 'SETTLED',
        deal: d,
      });
    }
  });

  // 2. Transactions performed or received by the BUYER / FREELANCER (myPurchasedDeals)
  myPurchasedDeals.forEach((d) => {
    const baseTs = typeof d.createdAt === 'number' ? d.createdAt : new Date(d.createdAt).getTime();

    // ONLY show deposit in buyer history if the BUYER deposited it (i.e. SERVICE_LISTING purchase)
    if (d.depositTxHash && d.type === 'SERVICE_LISTING') {
      txHistory.push({
        id: `buy-fund-${d.id}`,
        type: 'FUND',
        txHash: d.depositTxHash,
        title: `Escrow Payment Deposited`,
        subtitle: `Purchased Service Listing: ${d.title}`,
        amount: `-${d.price} ${d.currency}`,
        timestamp: baseTs,
        status: 'CONFIRMED',
        deal: d,
      });
    }

    // Freelancer accepted job on-chain with Cleanverse ECDSA attestation
    if (d.attestationTxHash) {
      txHistory.push({
        id: `attest-${d.id}`,
        type: 'ATTESTATION',
        txHash: d.attestationTxHash,
        title: `Cleanverse ECDSA Attestation Submitted`,
        subtitle: `Submitted A-Pass Verification On-Chain (${d.title})`,
        timestamp: baseTs + 90000,
        status: 'VERIFIED',
        deal: d,
      });
    }

    // Freelancer RECEIVED payout into their wallet
    if (d.releaseTxHash) {
      txHistory.push({
        id: `work-payout-${d.id}`,
        type: 'RELEASE',
        txHash: d.releaseTxHash,
        title: `Escrow Payout Received`,
        subtitle: `Payout received into wallet for completed work (${d.title})`,
        amount: `+${d.price} ${d.currency}`,
        timestamp: baseTs + 240000,
        status: 'SETTLED',
        deal: d,
      });
    }
  });

  // Fallback transaction items so new wallets/personas also have immediate history logs
  if (txHistory.length === 0) {
    txHistory.push(
      {
        id: 'tx-sample-faucet',
        type: 'FAUCET',
        txHash: '0x4070e534b84cc01e62a685c96d165deedac39f58a1b2c3d4e5f6a7b8c9d0e1f2',
        title: 'cATKN Token Faucet Claimed',
        subtitle: 'Monad Testnet cATKN Token Faucet · Contract 0x505B...1Ce03',
        amount: '+10,000 cATKN',
        timestamp: Date.now() - 3600000,
        status: 'CONFIRMED',
      },
      {
        id: 'tx-sample-attest',
        type: 'ATTESTATION',
        txHash: '0x8b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c',
        title: 'Cleanverse A-Pass Identity Verification',
        subtitle: `Validated A-Pass Tier ${activePersona.tier || 25} (${activePersona.country || 'SG'})`,
        timestamp: Date.now() - 7200000,
        status: 'VERIFIED',
      }
    );
  }

  txHistory.sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="neu-card max-w-4xl w-full overflow-hidden relative transition-colors flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="neu-inset p-5 flex items-center justify-between gap-4 flex-shrink-0 rounded-none border-b border-slate-300/40 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-400 via-blue-600 to-purple-600 p-0.5 shadow-lg flex items-center justify-center">
              <div className="h-full w-full neu-card rounded-[14px] flex items-center justify-center font-extrabold text-indigo-500">
                <User className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">{activePersona.name}</h2>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                  VERA USER PROFILE
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono flex items-center gap-1.5 pt-0.5">
                <span>{activePersona.walletAddress.slice(0, 8)}...{activePersona.walletAddress.slice(-6)}</span>
                <span className="text-slate-400">·</span>
                {activePersona.isVerified ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Cleanverse Verified
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Identity Blocked / Unverified
                  </span>
                )}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Sub-Tab Navigation Bar */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-300/40 dark:border-slate-800/60 flex items-center gap-3 bg-slate-100/50 dark:bg-slate-900/50">
          <button
            onClick={() => setProfileTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              profileTab === 'overview'
                ? 'neu-btn-primary shadow-md'
                : 'neu-btn-secondary text-slate-600 dark:text-slate-400'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Overview & Escrows ({myCreatedDeals.length + myPurchasedDeals.length})</span>
          </button>

          <button
            onClick={() => setProfileTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              profileTab === 'history'
                ? 'neu-btn-primary shadow-md'
                : 'neu-btn-secondary text-slate-600 dark:text-slate-400'
            }`}
          >
            <History className="h-4 w-4 text-purple-400" />
            <span>Transaction History & Audit Ledger ({txHistory.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {profileTab === 'overview' ? (
            <>
              {/* Identity & Compliance Health Overview Card */}
              <div className="neu-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300/40 dark:border-slate-800/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl neu-inset flex items-center justify-center ${activePersona.isVerified ? 'text-purple-500' : 'text-rose-500'}`}>
                      {activePersona.isVerified ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">CLEANVERSE A-PASS IDENTITY & COMPLIANCE TIER</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300">Validated on Monad Testnet Smart Contracts</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activePersona.isVerified ? (
                      <>
                        <span className="text-xs font-mono font-extrabold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 px-3 py-1 rounded-xl">
                          Tier {activePersona.tier} Level
                        </span>
                        <span className="text-xs font-mono font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-xl">
                          OFAC CLEAR ({activePersona.country || 'GLOBAL'})
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-mono font-extrabold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 px-3 py-1 rounded-xl">
                          Tier 0 Level
                        </span>
                        <span className="text-xs font-mono font-extrabold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 px-3 py-1 rounded-xl">
                          {activePersona.country === 'RU' ? 'SANCTIONED (RU)' : `UNVERIFIED (${activePersona.country || 'NO ID'})`}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {!activePersona.isVerified && (
                  <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Cleanverse CVI A-Pass Credential Required</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Your wallet (<code className="font-mono font-bold text-slate-900 dark:text-white">{activePersona.walletAddress.slice(0, 8)}...{activePersona.walletAddress.slice(-6)}</code>) is not yet registered in Cleanverse's A-Pass Registry. Click below to self-grant an official A-Pass credential via <code className="font-mono text-purple-600 dark:text-purple-400">/generate_apass</code>.
                      </p>
                    </div>
                    <button
                      onClick={() => selfIssueAPass('US', 30)}
                      className="neu-btn-primary px-4 py-2.5 text-xs font-extrabold flex items-center gap-1.5 shadow-md flex-shrink-0"
                    >
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span>⚡ Self-Issue Cleanverse A-Pass Tier 30</span>
                    </button>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="neu-inset p-3.5 space-y-1">
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase block">CREATED LISTINGS & JOBS</span>
                    <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{myCreatedDeals.length}</span>
                  </div>
                  <div className="neu-inset p-3.5 space-y-1">
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase block">PURCHASED & WORK CONTRACTS</span>
                    <span className="text-lg font-extrabold text-purple-600 dark:text-purple-400">{myPurchasedDeals.length}</span>
                  </div>
                  <div className="neu-inset p-3.5 space-y-1">
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase block">TOTAL ESCROW VOLUME</span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{totalVolume} cATKN</span>
                  </div>
                  <div className="neu-inset p-3.5 space-y-1">
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase block">COMPLIANCE RISK SCORE</span>
                    <span className={`text-lg font-extrabold ${activePersona.isVerified ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {activePersona.isVerified ? '98/100 (LOW)' : '0/100 (HIGH RISK)'}
                    </span>
                  </div>
                </div>

                {/* Live Token Balances & Faucet Row */}
                <div className="neu-inset p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase block">cATKN BALANCE</span>
                      <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">{activeBalance.catkn.toLocaleString()} cATKN</span>
                    </div>
                    <div className="h-8 w-px bg-slate-300/60 dark:bg-slate-800" />
                    <div>
                      <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase block">MON GAS BALANCE</span>
                      <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">{activeBalance.mon} MON</span>
                    </div>
                  </div>

                  <button
                    onClick={() => claimFaucet()}
                    className="neu-btn-primary px-4 py-2 text-xs font-extrabold flex items-center gap-2"
                  >
                    <Droplets className="h-4 w-4 text-white" />
                    <span>Claim Faucet (+10,000 cATKN)</span>
                  </button>
                </div>
              </div>

              {/* Section 1: MY CREATED JOBS & LISTINGS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Package className="h-4 w-4 text-indigo-500" /> MY CREATED LISTINGS & JOBS ({myCreatedDeals.length})
                  </h3>
                </div>

                {myCreatedDeals.length === 0 ? (
                  <div className="neu-inset p-6 text-center space-y-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">You have not created any escrow listings or jobs with this persona yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {myCreatedDeals.map((deal) => (
                      <div
                        key={deal.id}
                        onClick={() => {
                          onSelectDeal(deal);
                          onClose();
                        }}
                        className="neu-card hover:scale-[1.01] p-4 cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded neu-inset text-indigo-600 dark:text-indigo-400 uppercase">
                            {deal.type === 'JOB_POSTING' ? 'Job Posting' : 'Service Listing'}
                          </span>
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">{deal.price} {deal.currency}</span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors line-clamp-1">
                          {deal.title}
                        </h4>

                        <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 font-mono pt-1">
                          <span>Category: {deal.category}</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase">{deal.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: MY PURCHASED & ACCEPTED CONTRACTS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-500" /> MY PURCHASED & WORK CONTRACTS ({myPurchasedDeals.length})
                  </h3>
                </div>

                {myPurchasedDeals.length === 0 ? (
                  <div className="neu-inset p-6 text-center space-y-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">You have not purchased or accepted any escrow contracts with this persona yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {myPurchasedDeals.map((deal) => (
                      <div
                        key={deal.id}
                        onClick={() => {
                          onSelectDeal(deal);
                          onClose();
                        }}
                        className="neu-card hover:scale-[1.01] p-4 cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded neu-inset text-purple-600 dark:text-purple-400 uppercase">
                            Active Contract
                          </span>
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">{deal.price} {deal.currency}</span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-500 transition-colors line-clamp-1">
                          {deal.title}
                        </h4>

                        <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 font-mono pt-1">
                          <span>{deal.type === 'JOB_POSTING' ? 'Client' : 'Seller'}: {deal.initiatorName}</span>
                          <span className="text-purple-600 dark:text-purple-400 font-bold uppercase">{deal.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Tab 2: On-Chain Transaction History & Audit Ledger */
            <div className="space-y-4">
              <div className="neu-card p-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl neu-inset text-purple-500 flex items-center justify-center">
                    <History className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-xs">MONAD TESTNET ON-CHAIN AUDIT LEDGER</h3>
                    <p className="text-[11px] text-slate-500">Indexed from EscrowFactory (0xC068...9334) & Cleanverse REST API</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-3 py-1 rounded-xl neu-inset font-bold text-indigo-600 dark:text-indigo-400">
                    {txHistory.length} Total Txns
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                    Monad Chain 10143
                  </span>
                </div>
              </div>

              {/* Transaction List */}
              <div className="space-y-3 font-mono text-xs">
                {txHistory.map((tx) => (
                  <div
                    key={tx.id}
                    className="neu-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-indigo-500/40 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-xl neu-inset flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        tx.type === 'CREATE' ? 'text-indigo-500' :
                        tx.type === 'FUND' ? 'text-purple-500' :
                        tx.type === 'ATTESTATION' ? 'text-cyan-500' :
                        tx.type === 'RELEASE' ? 'text-emerald-500' : 'text-blue-500'
                      }`}>
                        {tx.type === 'CREATE' ? <Package className="h-4 w-4" /> :
                         tx.type === 'FUND' ? <Wallet className="h-4 w-4" /> :
                         tx.type === 'ATTESTATION' ? <ShieldCheck className="h-4 w-4" /> :
                         tx.type === 'RELEASE' ? <CheckCircle2 className="h-4 w-4" /> :
                         <Droplets className="h-4 w-4" />}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            tx.type === 'CREATE' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' :
                            tx.type === 'FUND' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                            tx.type === 'ATTESTATION' ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20' :
                            tx.type === 'RELEASE' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                            'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}>
                            {tx.type}
                          </span>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{tx.title}</h4>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {tx.status}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans truncate">{tx.subtitle}</p>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-0.5">
                          <span className="font-mono text-slate-400 flex items-center gap-1">
                            <span>Tx: {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}</span>
                          </span>
                          <button
                            onClick={() => handleCopyTx(tx.txHash)}
                            className="hover:text-indigo-500 transition-colors p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
                            title="Copy Transaction Hash"
                          >
                            {copiedTx === tx.txHash ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-slate-200 dark:border-slate-800 pt-2 md:pt-0 flex-shrink-0">
                      {tx.amount && (
                        <span className={`text-xs font-extrabold font-mono ${
                          tx.amount.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' :
                          tx.amount.startsWith('-') ? 'text-indigo-600 dark:text-indigo-400' :
                          'text-slate-900 dark:text-white'
                        }`}>
                          {tx.amount}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://testnet.monadexplorer.com/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neu-btn-secondary px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-500 transition-all"
                          title="View on Monad Explorer"
                        >
                          <span>Explorer</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>

                        {tx.deal && (
                          <button
                            onClick={() => {
                              onSelectDeal(tx.deal!);
                              onClose();
                            }}
                            className="neu-btn-primary px-2.5 py-1 text-[10px] font-bold flex items-center gap-1"
                            title="View Escrow Details"
                          >
                            <span>Deal</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="neu-inset p-4 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 rounded-none border-t border-slate-300/40 dark:border-slate-800/60">
          <div className="flex items-center gap-2">
            {appMode === 'demo' && (
              <button
                onClick={() => {
                  resetDeals();
                  showSuccess('All mock deals have been reset to clean default state!');
                }}
                className="text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-rose-500" />
                <span>Reset All Mock Deals</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="neu-btn-primary px-5 py-2 text-xs font-extrabold"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
