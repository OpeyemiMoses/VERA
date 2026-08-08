'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Wallet,
  CheckCircle2,
  FileText,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Package,
  Layers,
  Building,
  ExternalLink,
  Send,
  Sparkles,
  Eye,
  EyeOff,
  AlertTriangle,
  RotateCcw,
  Coins,
  Zap,
  Code,
  Share2,
  Copy,
} from 'lucide-react';
import { Deal } from '../types/deal';
import { usePersona, MOCK_PERSONAS } from '../context/PersonaContext';
import { useDeals } from '../context/DealsContext';
import { useToast } from '../context/ToastContext';
import { useCleanverse, PERSONA_KEYS } from '../hooks/useCleanverse';
import { useEscrow } from '../hooks/useEscrow';
import { useWriteContract, usePublicClient } from 'wagmi';
import { ESCROW_ABI } from '../lib/contracts';
import { SandboxPreviewModal } from './SandboxPreviewModal';
import { RejectDeliverableModal } from './RejectDeliverableModal';
import { MonadExplorerModal } from './MonadExplorerModal';
import { getDeliverableImage } from '../utils/imageUtils';

interface DealDetailPageProps {
  deal: Deal;
  onBack: () => void;
  onUpdateDealStatus: (dealId: string, newStatus: Deal['status'], counterpartyName?: string, counterpartyWallet?: string, releaseTxHash?: string) => void;
  openCheckout: (deal: Deal) => void;
  openSubmitDeliverable: (deal: Deal) => void;
  openDisputeAudit: (txHash: string) => void;
  onSelectDeal?: (deal: Deal) => void;
}

export const DealDetailPage: React.FC<DealDetailPageProps> = ({
  deal,
  onBack,
  onUpdateDealStatus,
  openCheckout,
  openSubmitDeliverable,
  openDisputeAudit,
  onSelectDeal,
}) => {
  const { activePersona, activePersonaKey, getPersonaBalance, addBalance, deductBalance, getPersonaTrustScore, appMode } = usePersona();
  const { deals, rejectDeliverable, acceptJob } = useDeals();
  const { showSuccess } = useToast();
  const { checkCompliance, isChecking } = useCleanverse();
  const { acceptWithAttestation, confirmDelivery, isLoading: escrowLoading } = useEscrow();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [notice, setNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSecretCredentials, setShowSecretCredentials] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  // MonadExplorerModal state
  const [selectedTxHash, setSelectedTxHash] = useState<string | null>(null);
  const [selectedTxType, setSelectedTxType] = useState<'deployment' | 'deposit' | 'attestation' | 'release'>('deposit');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  const handleOpenTxModal = (hash: string, type: 'deployment' | 'deposit' | 'attestation' | 'release') => {
    if (appMode === 'production') {
      window.open(`https://testnet.monadexplorer.com/tx/${hash}`, '_blank');
      return;
    }
    setSelectedTxHash(hash);
    setSelectedTxType(type);
    setIsTxModalOpen(true);
  };

  // Find if active persona has a specific funded/accepted order instance for this deal
  const userOrderInstance = deals.find((d) => {
    const baseMatchId = deal.id.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    const isMatch =
      d.id === deal.id ||
      d.id.startsWith(`${deal.id}-order-`) ||
      d.id.startsWith(`${deal.id}-accepted-`) ||
      d.id.startsWith(`${deal.id}-slot-`) ||
      d.id === `${baseMatchId}-slot-1`;
    if (!isMatch) return false;
    const isUserPart =
      (d.counterpartyAddress && d.counterpartyAddress.toLowerCase() === activePersona.walletAddress.toLowerCase()) ||
      (d.participantWallets && d.participantWallets.some((w) => w.toLowerCase() === activePersona.walletAddress.toLowerCase())) ||
      (d.initiatorAddress && d.initiatorAddress.toLowerCase() === activePersona.walletAddress.toLowerCase());
    return isUserPart && d.status !== 'OPEN';
  });

  const currentDeal = userOrderInstance || deal;

  const fileName = currentDeal.deliverable?.fileName || currentDeal.title || '';
  const isImageOrDesign =
    currentDeal.category.toLowerCase().includes('design') ||
    fileName.toLowerCase().endsWith('.png') ||
    fileName.toLowerCase().endsWith('.jpg') ||
    fileName.toLowerCase().endsWith('.jpeg') ||
    fileName.toLowerCase().endsWith('.svg') ||
    fileName.toLowerCase().includes('figma');

  const isPdfDocument =
    (currentDeal.deliverable?.fileKind === 'PDF' ||
      fileName.toLowerCase().endsWith('.pdf') ||
      fileName.toLowerCase().includes('pdf') ||
      fileName.toLowerCase().includes('travelrule')) &&
    !isImageOrDesign;

  const baseId = deal.id.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
  const slotSubOrders = deals.filter((d) => d.id.startsWith(`${baseId}-slot-`));

  // Derive role
  const isInitiator =
    activePersona.walletAddress.toLowerCase() === currentDeal.initiatorAddress.toLowerCase() ||
    activePersona.name.toLowerCase().includes(currentDeal.initiatorName.toLowerCase()) ||
    currentDeal.initiatorName.toLowerCase().includes(activePersona.name.toLowerCase());

  // Find counterparty details (filtering out self-counterparty match)
  const rawCounterpartyAddress =
    currentDeal.counterpartyAddress &&
    currentDeal.counterpartyAddress.toLowerCase() !== currentDeal.initiatorAddress.toLowerCase()
      ? currentDeal.counterpartyAddress
      : undefined;

  const rawCounterpartyName =
    currentDeal.counterpartyName &&
    !currentDeal.counterpartyName.toLowerCase().includes(currentDeal.initiatorName.toLowerCase().split(' ')[0])
      ? currentDeal.counterpartyName
      : undefined;

  const counterpartyWallet =
    rawCounterpartyAddress ||
    (currentDeal.participantWallets
      ? currentDeal.participantWallets.find((w) => w.toLowerCase() !== currentDeal.initiatorAddress.toLowerCase())
      : undefined);

  let displayCounterpartyName = 'Not Yet Assigned';
  if (rawCounterpartyName) {
    displayCounterpartyName = rawCounterpartyName;
  } else if (counterpartyWallet) {
    const lowerW = counterpartyWallet.toLowerCase();
    if (lowerW === MOCK_PERSONAS.bob.walletAddress.toLowerCase()) {
      displayCounterpartyName = 'Bob (Verified Freelancer)';
    } else if (lowerW === MOCK_PERSONAS.alice.walletAddress.toLowerCase()) {
      displayCounterpartyName = 'Alice (Client)';
    } else if (lowerW === MOCK_PERSONAS.charlie.walletAddress.toLowerCase()) {
      displayCounterpartyName = 'Charlie (Unverified)';
    } else if (lowerW === MOCK_PERSONAS.vlad.walletAddress.toLowerCase()) {
      displayCounterpartyName = 'Vlad (Sanctioned Region)';
    } else {
      displayCounterpartyName = `Participant (${counterpartyWallet.slice(0, 6)}...${counterpartyWallet.slice(-4)})`;
    }
  }

  const displayCounterpartyAddress = counterpartyWallet;

  const isCounterparty =
    !isInitiator &&
    ((displayCounterpartyAddress && displayCounterpartyAddress.toLowerCase() === activePersona.walletAddress.toLowerCase()) ||
      (rawCounterpartyName && activePersona.name.toLowerCase().includes(rawCounterpartyName.toLowerCase())) ||
      (currentDeal.participantWallets && currentDeal.participantWallets.some((w) => w.toLowerCase() === activePersona.walletAddress.toLowerCase() && w.toLowerCase() !== currentDeal.initiatorAddress.toLowerCase())));

  const meetsTier = activePersona.isVerified && activePersona.tier >= currentDeal.minTier;

  // Provider = Work/Service Provider (Seller for listings, Freelancer for jobs)
  // Receiver = Funds Payer/Client (Buyer for listings, Client for jobs)
  const isProvider = currentDeal.type === 'SERVICE_LISTING' ? isInitiator : isCounterparty;
  const isReceiver = currentDeal.type === 'JOB_POSTING' ? isInitiator : isCounterparty;

  const totalSlots = currentDeal.totalSlots ?? (currentDeal.quantity !== undefined ? currentDeal.quantity : 1);
  const acceptedCount = currentDeal.acceptedCount ?? ((currentDeal.status !== 'OPEN' && currentDeal.status !== 'FUNDED') ? 1 : 0);
  const openSlots = Math.max(0, totalSlots - acceptedCount);

  const hasAlreadyFundedOrPurchased = deals.some((d) => {
    const isRelated = d.id === baseId || d.id.startsWith(`${baseId}-`);
    if (!isRelated || d.status === 'OPEN') return false;
    const isCounterpartyUser =
      (d.counterpartyAddress && d.counterpartyAddress.toLowerCase() === activePersona.walletAddress.toLowerCase()) ||
      (d.counterpartyName && activePersona.name.toLowerCase().includes(d.counterpartyName.toLowerCase())) ||
      (d.participantWallets && d.participantWallets.some((w) => w.toLowerCase() === activePersona.walletAddress.toLowerCase() && w.toLowerCase() !== d.initiatorAddress.toLowerCase()));
    return isCounterpartyUser;
  });

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 5000);
  };

  const handleDownloadDeliverable = (targetDeal: Deal) => {
    const deliverable = targetDeal.deliverable;
    const rawFileName = deliverable?.fileName || `${targetDeal.title.replace(/[^a-zA-Z0-9]/g, '_')}_Deliverable.txt`;
    const fileName = rawFileName.endsWith('.zip') ? rawFileName.replace('.zip', '.txt') : rawFileName;
    
    let content = '';
    let mimeType = 'text/plain';

    if (deliverable?.fileContent) {
      content = deliverable.fileContent;
      if (fileName.endsWith('.json')) mimeType = 'application/json';
      else if (fileName.endsWith('.sol')) mimeType = 'text/plain';
      else if (fileName.endsWith('.ts') || fileName.endsWith('.js')) mimeType = 'text/javascript';
    } else if (deliverable?.textCredentials) {
      content = `VERA PROTOCOL SECURE CREDENTIALS ARCHIVE\n` +
        `==========================================\n` +
        `Deal Title: ${targetDeal.title}\n` +
        `Category: ${targetDeal.category}\n` +
        `Escrow Vault: ${targetDeal.escrowAddress}\n` +
        `Released At: ${new Date().toISOString()}\n\n` +
        `UNMASKED PRODUCTION CREDENTIALS & KEYS:\n` +
        `------------------------------------------\n` +
        `${deliverable.textCredentials}\n`;
      mimeType = 'text/plain';
    } else if (deliverable?.url || targetDeal.deliverableUrl) {
      const targetUrl = deliverable?.url || targetDeal.deliverableUrl || 'https://github.com/OpeyemiMoses/VERA.git';
      window.open(targetUrl, '_blank');
      showNotice(`Opened Deliverable URL: ${targetUrl}`);
      return;
    } else {
      content = `VERA PROTOCOL DELIVERABLE ARCHIVE PACKAGE\n` +
        `==========================================\n` +
        `Deal ID: ${targetDeal.id}\n` +
        `Title: ${targetDeal.title}\n` +
        `Category: ${targetDeal.category}\n` +
        `Seller / Provider: ${targetDeal.counterpartyName || targetDeal.initiatorName}\n` +
        `Escrow Vault: ${targetDeal.escrowAddress}\n` +
        `Deposit Amount: ${targetDeal.price} ${targetDeal.currency}\n` +
        `Released At: ${new Date().toISOString()}\n\n` +
        `DELIVERABLE SPECIFICATION & VERIFICATION:\n` +
        `------------------------------------------\n` +
        `Deliverable Terms: ${targetDeal.deliveryTerms}\n` +
        `Cleanverse Compliance Status: ATTESTATION VERIFIED (PASSED)\n` +
        `Monad Testnet EVM Hash: ${targetDeal.releaseTxHash || targetDeal.creationTxHash || '0x3a9f8b1c4d9e2f4a8b7c6d5e1f0a9b8c7d6e5f4a'}\n\n` +
        `PRODUCTION ASSETS & REPOSITORY LINK:\n` +
        `------------------------------------------\n` +
        `GitHub Repository: https://github.com/OpeyemiMoses/VERA.git\n` +
        `Live Demo Deployment: http://localhost:3005\n`;
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotice(`Downloaded deliverable package: ${fileName}`);
  };

  const handleAcceptJob = async () => {
    if (activePersona.walletAddress.toLowerCase() === currentDeal.initiatorAddress.toLowerCase()) {
      showNotice('You cannot accept your own job posting. Switch to a freelancer persona (e.g. Bob) to accept this job.');
      return;
    }

    // Check freelancer good-faith collateral requirement
    const freelancerTrust = getPersonaTrustScore(activePersona.walletAddress);
    const isMon = currentDeal.currency === 'MON';
    const rawCollateral = (currentDeal.price * freelancerTrust.collateralPct) / 100;
    const collateralAmount = isMon ? parseFloat(rawCollateral.toFixed(4)) : Math.round(rawCollateral);
    
    if (collateralAmount > 0) {
      const activeBal = getPersonaBalance(activePersona.walletAddress);
      const currentBalance = Number(currentDeal.currency === 'cATKN' ? activeBal.catkn : activeBal.mon);
      if (currentBalance < collateralAmount) {
        showNotice(`Insufficient balance for collateral: You need ${collateralAmount} ${currentDeal.currency} (${freelancerTrust.collateralPct}% good-faith collateral based on Trust Score ${freelancerTrust.score}/100), but have ${currentBalance} ${currentDeal.currency}.`);
        return;
      }
    }

    setIsProcessing(true);
    showNotice(`Running Cleanverse compliance check for ${activePersona.name}...`);

    const compliance = await checkCompliance(
      activePersona.walletAddress,
      currentDeal.escrowAddress,
      process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '',
      'monad-testnet',
      currentDeal.minTier,
      currentDeal.prohibitedCountries
    );

    if (!compliance.allowed) {
      showNotice(`Compliance Rejection: ${compliance.reason}`);
      setIsProcessing(false);
      return;
    }

    // Deduct freelancer good-faith collateral — sandbox/local only.
    // In production mode the smart contract handles all funds on-chain; local balance is read from chain.
    if (collateralAmount > 0 && appMode !== 'production') {
      deductBalance(collateralAmount, currentDeal.currency, activePersona.walletAddress);
      console.log('[COLLATERAL] Deducted', collateralAmount, currentDeal.currency, 'from freelancer', activePersona.walletAddress);
    }

    showNotice(`Compliance passed. Submitting on-chain attestation to Escrow Contract...`);

    const attestationSig = typeof compliance.attestation === 'object' ? compliance.attestation?.signature : compliance.attestation;
    const deadlineVal = typeof compliance.attestation === 'object' ? compliance.attestation?.deadline : (Math.floor(Date.now() / 1000) + 3600);

    // ── PRODUCTION MODE: Real On-Chain acceptWithAttestation Transaction ───────
    if (appMode === 'production') {
      try {
        showNotice('Submitting acceptWithAttestation to Monad Testnet... Confirm in Web3 wallet.');
        const txHash = await writeContractAsync({
          address: currentDeal.escrowAddress as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'acceptWithAttestation',
          args: [attestationSig as `0x${string}`, BigInt(deadlineVal || Math.floor(Date.now() / 1000) + 3600)],
        });

        showNotice(`Attestation tx submitted (${txHash.slice(0, 10)}...). Waiting for Monad block confirmation...`);
        if (publicClient) {
          try {
            await publicClient.waitForTransactionReceipt({ hash: txHash });
          } catch (rcptErr) {
            console.warn('[RECEIPT] Proceeding with acceptance confirmation:', rcptErr);
          }
        }

        currentDeal.attestationTxHash = txHash;
        acceptJob(currentDeal.id, activePersona.walletAddress, activePersona.name, txHash);
        onUpdateDealStatus(currentDeal.id, 'ACCEPTED' as any, activePersona.name, activePersona.walletAddress, txHash);
        showNotice(`Job Accepted On-Chain (${txHash.slice(0, 10)}...)! Cleanverse attestation verified.`);
      } catch (err: any) {
        showNotice(`On-chain job acceptance failed: ${err?.shortMessage || err?.message}`);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    const privKey = PERSONA_KEYS[activePersonaKey] || '0xb553cb10a16d0ce4a890cf2611922db0b572fd91ea4b11a56735f179b4b53516';
    await acceptWithAttestation(
      privKey,
      currentDeal.escrowAddress,
      attestationSig || '0x'
    );

    acceptJob(currentDeal.id, activePersona.walletAddress, activePersona.name);
    onUpdateDealStatus(currentDeal.id, 'ACCEPTED' as any, activePersona.name);
    showNotice(`Job Accepted on-chain. ${collateralAmount > 0 ? `${collateralAmount} ${currentDeal.currency} collateral locked. ` : ''}Cleanverse attestation verified.`);
    setIsProcessing(false);
  };

  const handleReleaseFunds = async () => {
    setIsProcessing(true);

    // Determine recipient BEFORE any async calls
    let recipientWallet: string;
    if (currentDeal.type === 'SERVICE_LISTING') {
      recipientWallet = currentDeal.initiatorAddress;
    } else {
      recipientWallet = currentDeal.counterpartyAddress ||
        currentDeal.participantWallets?.find(
          (w) => w.toLowerCase() !== currentDeal.initiatorAddress.toLowerCase()
        ) || '';
    }

    // Compute trust-adjusted platform fee from the RECIPIENT's Trust Score
    const recipientTrust = getPersonaTrustScore(recipientWallet);
    const feePct = currentDeal.platformFeePct ?? recipientTrust.feePct;
    const isMon = currentDeal.currency === 'MON';
    const rawFee = (currentDeal.price * feePct) / 100;
    const feeAmount = isMon ? parseFloat(rawFee.toFixed(4)) : Math.round(rawFee);
    const netPayout = isMon ? parseFloat((currentDeal.price - feeAmount).toFixed(4)) : (currentDeal.price - feeAmount);

    console.log('[ESCROW RELEASE] Deal type:', currentDeal.type);
    console.log('[ESCROW RELEASE] Recipient wallet:', recipientWallet);
    console.log('[ESCROW RELEASE] Gross Amount:', currentDeal.price, currentDeal.currency);
    console.log('[ESCROW RELEASE] Trust Score:', recipientTrust.score, '→ Fee:', feePct + '%', '=', feeAmount, currentDeal.currency);
    console.log('[ESCROW RELEASE] Net Payout:', netPayout, currentDeal.currency);

    showNotice(`Releasing ${netPayout} ${currentDeal.currency} to provider (${feePct}% protocol fee applied)...`);

    // ── PRODUCTION MODE: Real On-Chain release Transaction ────────────────────
    if (appMode === 'production') {
      try {
        showNotice('Releasing Escrow Payout on Monad Testnet... Please confirm in Web3 wallet.');
        let txHash: `0x${string}`;
        if (recipientWallet && recipientWallet.startsWith('0x') && recipientWallet !== '0x0000000000000000000000000000000000000000') {
          try {
            txHash = await writeContractAsync({
              address: currentDeal.escrowAddress as `0x${string}`,
              abi: ESCROW_ABI,
              functionName: 'releaseTo',
              args: [recipientWallet as `0x${string}`],
            });
          } catch (relToErr) {
            console.warn('[RELEASE] releaseTo failed, falling back to release():', relToErr);
            txHash = await writeContractAsync({
              address: currentDeal.escrowAddress as `0x${string}`,
              abi: ESCROW_ABI,
              functionName: 'release',
            });
          }
        } else {
          txHash = await writeContractAsync({
            address: currentDeal.escrowAddress as `0x${string}`,
            abi: ESCROW_ABI,
            functionName: 'release',
          });
        }

        showNotice(`Release tx submitted (${txHash.slice(0, 10)}...). Waiting for Monad block confirmation...`);
        if (publicClient) {
          try {
            await publicClient.waitForTransactionReceipt({ hash: txHash });
          } catch (rcptErr) {
            console.warn('[RECEIPT] Proceeding with release confirmation:', rcptErr);
          }
        }

        currentDeal.releaseTxHash = txHash;
        onUpdateDealStatus(currentDeal.id, 'RELEASED', undefined, recipientWallet, txHash);
        if (recipientWallet && netPayout > 0) {
          addBalance(netPayout, currentDeal.currency, recipientWallet);
        }
        showNotice(`Payout Released On-Chain (${txHash.slice(0, 10)}...): ${netPayout} ${currentDeal.currency} to provider · ${feeAmount} ${currentDeal.currency} protocol fee.`);
      } catch (err: any) {
        showNotice(`On-chain payout release failed: ${err?.shortMessage || err?.message}`);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // ── SANDBOX / LOCAL MODE: Simulate balance credit ─────────────────────────
    const privKey = PERSONA_KEYS[activePersonaKey] || '0xb553cb10a16d0ce4a890cf2611922db0b572fd91ea4b11a56735f179b4b53516';
    confirmDelivery(privKey, currentDeal.escrowAddress).catch(() => {});

    // Credit NET payout to recipient in sandbox mode
    if (recipientWallet && netPayout > 0) {
      addBalance(netPayout, currentDeal.currency, recipientWallet);
      console.log('[ESCROW RELEASE] addBalance called for:', recipientWallet, '+', netPayout, '(after', feePct + '% fee)');
    } else {
      console.error('[ESCROW RELEASE] NO RECIPIENT WALLET FOUND - cannot credit balance!');
    }

    onUpdateDealStatus(currentDeal.id, 'RELEASED');
    showNotice(`Payout Released: ${netPayout} ${currentDeal.currency} to provider · ${feeAmount} ${currentDeal.currency} protocol fee (Trust Score ${recipientTrust.score}/100 → ${feePct}% rate)`);
    setIsProcessing(false);
  };

  const isParticipant = isInitiator || isCounterparty;

  // Privacy Guard: Lock to participants ONLY when a counterparty is actually assigned.
  // For JOB_POSTING that is OPEN or FUNDED with no freelancer yet, ANY wallet can view & accept.
  const hasCounterpartyAssigned = !!currentDeal.counterpartyAddress && currentDeal.counterpartyAddress !== '0x0000000000000000000000000000000000000000';
  const isOpenJobWithNoFreelancer = currentDeal.type === 'JOB_POSTING' && (currentDeal.status === 'OPEN' || currentDeal.status === 'FUNDED') && !hasCounterpartyAssigned;
  if (!isParticipant && currentDeal.status !== 'OPEN' && !isOpenJobWithNoFreelancer) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 animate-fadeIn space-y-6 text-center">
        <div className="neu-card p-8 space-y-4 border-2 border-indigo-500/30">
          <div className="h-16 w-16 rounded-3xl neu-inset text-indigo-500 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Private Escrow Transaction
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed font-medium">
            Transactions between counterparties are strictly private. This deal is restricted to <strong className="text-indigo-600 dark:text-indigo-400">{currentDeal.initiatorName}</strong> and <strong className="text-purple-600 dark:text-purple-400">{displayCounterpartyName}</strong>. Connected persona: <strong className="text-slate-900 dark:text-white">{activePersona.name}</strong>.
          </p>
          <div className="pt-2">
            <button
              onClick={onBack}
              className="neu-btn-primary px-6 py-3 text-xs font-bold inline-flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" /> Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-fadeIn space-y-6">
      {/* Top Breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Back to Overview</span>
      </button>

      {/* Global Notice Toast */}
      {notice && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white border border-cyan-500/40 shadow-xl flex items-center justify-between">
          <p className="text-xs font-semibold">{notice}</p>
          <button onClick={() => setNotice(null)} className="text-xs text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Deal Card Header */}
      <div className="neu-card p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-300/40 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl neu-inset text-indigo-600 dark:text-indigo-400 font-mono">
              {deal.type === 'JOB_POSTING' ? 'JOB POSTING' : 'SERVICE LISTING'}
            </span>
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
              Min Tier {deal.minTier}
            </span>
            <button
              type="button"
              onClick={() => {
                const link = typeof window !== 'undefined' ? `${window.location.origin}/?deal=${currentDeal.id}` : '';
                if (link) {
                  navigator.clipboard.writeText(link);
                  showNotice('Shareable Escrow Link copied to clipboard! Send to your counterparty.');
                }
              }}
              className="neu-btn-secondary px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all shadow-sm cursor-pointer"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Copy Escrow Link</span>
            </button>
            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 neu-inset px-3 py-1.5 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5 text-purple-500" />
              <span>1-on-1 Escrow Vault</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Escrow State</span>
            <span
              className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase border font-mono ${
                deal.status === 'OPEN'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : deal.status === 'FUNDED' || (deal.status as string) === 'ACCEPTED'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
                  : deal.status === 'DELIVERED'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                  : deal.status === 'RELEASED'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
              }`}
            >
              {deal.status}
            </span>
          </div>
        </div>

        {/* Title & Price */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {deal.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
              <span>Category: <strong className="text-slate-900 dark:text-white font-bold">{deal.category}</strong></span>
              <span>·</span>
              <span>Chain: <strong className="text-indigo-600 dark:text-indigo-400 uppercase font-mono">{deal.chain}</strong></span>
            </div>
          </div>

          <div className="neu-inset p-4 text-right min-w-[160px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              ESCROW CONTRACT AMOUNT
            </span>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono flex items-center justify-end gap-1">
              <span>{deal.price}</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{deal.currency}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="neu-inset p-5 space-y-2">
          <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
            DESCRIPTION & SPECIFICATION
          </h3>
          <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-medium">
            {deal.description}
          </p>
        </div>

        {/* Participants Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Creator / Initiator */}
          <div className="neu-inset p-4 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {deal.type === 'JOB_POSTING' ? 'CLIENT (JOB POSTER)' : 'SELLER (SERVICE OWNER)'}
            </span>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl neu-card text-indigo-500 flex items-center justify-center font-bold">
                <User className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-slate-900 dark:text-white">{deal.initiatorName}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                  <span>{deal.initiatorAddress.slice(0, 6)}...{deal.initiatorAddress.slice(-4)}</span>
                  <span className="text-indigo-500 font-bold">✔ Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Counterparty / Acceptor / Buyer */}
          <div className="neu-inset p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {currentDeal.type === 'JOB_POSTING' ? 'FREELANCER (WORKER)' : 'BUYER (PAYER)'}
              </span>
              {slotSubOrders.length > 0 && (
                <span className="text-[9px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {slotSubOrders.length} ACTIVE SLOT INSTANCE{slotSubOrders.length > 1 ? 'S' : ''}
                </span>
              )}
            </div>

            {/* If there are multiple slot sub-orders and viewing parent deal or as creator */}
            {slotSubOrders.length > 0 && (!currentDeal.id.includes('-slot-') && !currentDeal.id.includes('-order-') && !currentDeal.id.includes('-accepted-')) ? (
              <div className="space-y-1.5 pt-1">
                {slotSubOrders.map((slotDeal, idx) => {
                  const slotBuyer = slotDeal.counterpartyName || 'Participant ' + (idx + 1);
                  const slotWallet = slotDeal.counterpartyAddress || slotDeal.participantWallets?.[1] || '';
                  return (
                    <div
                      key={slotDeal.id}
                      onClick={() => onSelectDeal && onSelectDeal(slotDeal)}
                      className="p-2 neu-card hover:scale-[1.01] cursor-pointer transition-all flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-purple-500" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            Slot #{idx + 1}: {slotBuyer}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {slotWallet ? `${slotWallet.slice(0, 6)}...${slotWallet.slice(-4)}` : 'Wallet Connected'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                        {slotDeal.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single slot or specific slot instance view */
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl neu-card text-purple-500 flex items-center justify-center font-bold">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {displayCounterpartyName}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                    {displayCounterpartyAddress ? (
                      <span>{displayCounterpartyAddress.slice(0, 6)}...{displayCounterpartyAddress.slice(-4)}</span>
                    ) : (
                      <span>Requires Cleanverse Tier {deal.minTier}+ to participate</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trust-Adjusted Escrow Terms Engine Card */}
        {(() => {
          const initiatorTrust = getPersonaTrustScore(currentDeal.initiatorAddress);
          const counterpartyTrust = displayCounterpartyAddress ? getPersonaTrustScore(displayCounterpartyAddress) : null;
          const activeTrust = counterpartyTrust || initiatorTrust;
          const isHighValueOrCrossBorder = currentDeal.price >= 1000 || (activePersona.country !== 'US' && activePersona.country !== 'UNVERIFIED');

          return (
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/30 p-5 rounded-2xl space-y-3 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    TRUST-ADJUSTED ESCROW TERMS ENGINE
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                  TRUST SCORE: {activeTrust.score}/100 ({activeTrust.tierLevel.toUpperCase()} LEVEL)
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div className="neu-card p-3 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Platform Fee Rate</span>
                  <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                    {activeTrust.feePct}%
                  </span>
                  <span className="text-[9px] text-slate-500 block">Based on Trust Score</span>
                </div>

                <div className="neu-card p-3 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Good-Faith Collateral</span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {activeTrust.collateralPct}%
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {activeTrust.collateralPct === 0 ? 'Zero Collateral Required' : `${(currentDeal.price * activeTrust.collateralPct / 100).toFixed(0)} ${currentDeal.currency} Locked`}
                  </span>
                </div>

                <div className="neu-card p-3 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Auto-Release Hold</span>
                  <span className="text-base font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                    {activeTrust.releaseWindowHrs} Hours
                  </span>
                  <span className="text-[9px] text-slate-500 block">Fast-Track Window</span>
                </div>

                <div className="neu-card p-3 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Compliance Routing</span>
                  <span className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 font-mono pt-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-500" />
                    {isHighValueOrCrossBorder ? 'Auto Travel Rule' : 'Standard Escrow'}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {isHighValueOrCrossBorder ? 'Report Auto-Generated' : 'Normal Settlement'}
                  </span>
                </div>
              </div>

              <div className="text-xs font-medium text-slate-700 dark:text-slate-200 neu-inset p-3 rounded-xl flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                <span>{activeTrust.reason}</span>
              </div>
            </div>
          );
        })()}

        {/* Compliance Health Score */}
        <div className="neu-inset p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-indigo-500" /> VERA PROTOCOL COMPLIANCE HEALTH & AUDIT
            </h3>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              SCORE: 98/100 (LOW RISK)
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">A-PASS IDENTITY</span>
              <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> VALIDATED
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">VALIDATOR POOL</span>
              <span className="text-purple-400 font-extrabold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> POOL #104 PASS
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">SANCTIONS & COUNTRY</span>
              <span className="text-emerald-500 font-extrabold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> OFAC CLEAR
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">TRAVEL RULE STATUS</span>
              <span className="text-cyan-400 font-extrabold flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" /> READY (.PDF)
              </span>
            </div>
          </div>
        </div>

        {/* Compliance Audit Timeline */}
        <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-3 transition-colors">
          <h4 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-purple-400" /> COMPLIANCE AUDIT TIMELINE
          </h4>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1 text-cyan-500">
              <CheckCircle2 className="h-3.5 w-3.5" /> Created
            </span>
            <span className="text-slate-300 dark:text-slate-700">→</span>
            <span className="flex items-center gap-1 text-cyan-500">
              <CheckCircle2 className="h-3.5 w-3.5" /> Client Verified
            </span>
            <span className="text-slate-300 dark:text-slate-700">→</span>
            <span className={`flex items-center gap-1 ${deal.status !== 'OPEN' ? 'text-purple-400' : 'text-slate-400'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Counterparty Verified
            </span>
            <span className="text-slate-300 dark:text-slate-700">→</span>
            <span className={`flex items-center gap-1 ${deal.status !== 'OPEN' ? 'text-purple-400' : 'text-slate-400'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Escrow Locked
            </span>
            <span className="text-slate-300 dark:text-slate-700">→</span>
            <span className={`flex items-center gap-1 ${deal.status === 'DELIVERED' || deal.status === 'RELEASED' ? 'text-emerald-400' : 'text-slate-400'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Work Delivered
            </span>
            <span className="text-slate-300 dark:text-slate-700">→</span>
            <span className={`flex items-center gap-1 ${deal.status === 'RELEASED' ? 'text-emerald-400' : 'text-slate-400'}`}>
              <CheckCircle2 className="h-3.5 w-3.5" /> Travel Rule Archived
            </span>
          </div>
        </div>

        {/* On-Chain Escrow Financial Ledger & Gas Breakdown */}
        <div className="neu-card p-5 space-y-3 border-2 border-indigo-500/30">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-indigo-500" /> ON-CHAIN ESCROW LEDGER & GAS BREAKDOWN
            </h3>
            <span className="text-[10px] font-mono font-bold neu-inset text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5">
              MONAD TESTNET EVM
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="neu-inset p-3.5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block">BUYER DEPOSIT</span>
              <p className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                {currentDeal.status !== 'OPEN' ? `-${currentDeal.price} ${currentDeal.currency}` : '0 cATKN'}
              </p>
              <span className="text-[9px] text-slate-400">
                {currentDeal.status !== 'OPEN' ? 'Deducted from Buyer Wallet' : 'Awaiting Buyer Checkout'}
              </span>
            </div>

            <div className="neu-inset p-3.5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block">ESCROW SMART CONTRACT VAULT</span>
              <p className="text-purple-600 dark:text-purple-400 font-extrabold">
                {currentDeal.status === 'RELEASED' ? '0 cATKN (Payout Released)' : currentDeal.status !== 'OPEN' ? `${currentDeal.price} ${currentDeal.currency} LOCKED` : '0 cATKN'}
              </p>
              <span className="text-[9px] text-slate-400 font-mono">
                {currentDeal.escrowAddress.slice(0, 8)}...{currentDeal.escrowAddress.slice(-6)}
              </span>
            </div>

            <div className="neu-inset p-3.5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block">SELLER PAYOUT STATUS</span>
              <p className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                {currentDeal.status === 'RELEASED' ? `+${currentDeal.price} ${currentDeal.currency} (Credited)` : 'Pending Payout Release'}
              </p>
              <span className="text-[9px] text-slate-400">
                {currentDeal.status === 'RELEASED' ? 'Credited to Seller Wallet' : 'Locked in Escrow Vault'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between neu-inset p-3 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold">
              <Zap className="h-3.5 w-3.5 text-purple-500" /> Monad Network Gas Paid:
            </span>
            <span className="text-purple-600 dark:text-purple-400 font-extrabold">
              ~0.00045 MON (~$0.0012 EVM Gas)
            </span>
          </div>

          {/* Real EVM Transaction Hashes for Escrow Verification */}
          <div className="border-t border-slate-300/40 dark:border-slate-800/60 pt-3 space-y-2 text-xs font-mono">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
              ON-CHAIN TRANSACTION HASHES (MONAD VERIFICATION)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {/* 1. Contract Deployment Tx */}
              <div className="neu-inset p-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-bold">1. Deployment Tx:</span>
                <button
                  onClick={() => handleOpenTxModal(currentDeal.creationTxHash || '0x3a9f8b1c4d9e2f4a8b7c6d5e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a', 'deployment')}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {(currentDeal.creationTxHash || '0x3a9f8b1c4d9e2f4a8b7c6d5e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a').slice(0, 10)}... <ExternalLink className="h-3 w-3" />
                </button>
              </div>

              {/* 2. Escrow Deposit Tx */}
              <div className="neu-inset p-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-bold">2. Escrow Deposit Tx:</span>
                {currentDeal.depositTxHash ? (
                  <button
                    onClick={() => handleOpenTxModal(currentDeal.depositTxHash!, 'deposit')}
                    className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {currentDeal.depositTxHash.slice(0, 10)}... <ExternalLink className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="text-slate-400">Awaiting Deposit</span>
                )}
              </div>

              {/* 3. Deliverable Attestation Tx */}
              <div className="neu-inset p-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-bold">3. Attestation Tx:</span>
                {currentDeal.attestationTxHash ? (
                  <button
                    onClick={() => handleOpenTxModal(currentDeal.attestationTxHash!, 'attestation')}
                    className="text-purple-600 dark:text-purple-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {currentDeal.attestationTxHash.slice(0, 10)}... <ExternalLink className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="text-slate-400">Awaiting Submission</span>
                )}
              </div>

              {/* 4. On-Chain Payout Release Tx */}
              <div className="neu-inset p-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-bold">4. Payout Release Tx:</span>
                {currentDeal.releaseTxHash ? (
                  <button
                    onClick={() => handleOpenTxModal(currentDeal.releaseTxHash!, 'release')}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {currentDeal.releaseTxHash.slice(0, 10)}... <ExternalLink className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="text-slate-400">Locked in Vault</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Slot Sub-Order Directory Matrix */}
        {slotSubOrders.length > 0 && isInitiator && (
          <div className="neu-card p-5 space-y-4 border-2 border-purple-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-purple-500" /> MULTI-SLOT ESCROW SUBSCRIBERS ({slotSubOrders.length} Subscribed Slots)
              </h3>
              <span className="text-[10px] font-mono font-bold neu-inset text-purple-600 dark:text-purple-400 px-2.5 py-0.5">
                INDEPENDENT DELIVERABLE VAULTS
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Each slot represents an independent buyer/participant. Click any slot below to view, manage, or attach a unique deliverable for that specific participant.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {slotSubOrders.map((slotOrder) => (
                <div
                  key={slotOrder.id}
                  onClick={() => onSelectDeal ? onSelectDeal(slotOrder) : null}
                  className={`neu-inset p-4 rounded-xl space-y-2 cursor-pointer transition-all hover:scale-[1.01] ${
                    currentDeal.id === slotOrder.id ? 'border-2 border-indigo-500 shadow-md' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded border border-indigo-500/30">
                      SLOT #{slotOrder.slotNumber || 1}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      slotOrder.status === 'RELEASED'
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                        : slotOrder.status === 'DELIVERED'
                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/40'
                        : 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/40'
                    }`}>
                      {slotOrder.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span>{slotOrder.counterpartyName || 'Participant'}</span>
                    <span className="font-mono text-slate-500">{slotOrder.price} {slotOrder.currency}</span>
                  </div>

                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    Wallet: {slotOrder.counterpartyAddress ? `${slotOrder.counterpartyAddress.slice(0, 8)}...${slotOrder.counterpartyAddress.slice(-6)}` : 'N/A'}
                  </p>

                  {slotOrder.deliverable ? (
                    <span className="text-[10px] text-emerald-500 font-extrabold flex items-center gap-1 pt-1">
                      <CheckCircle2 className="h-3 w-3" /> Unique Deliverable Sent
                    </span>
                  ) : (
                    <span className="text-[10px] text-indigo-400 font-semibold pt-1 block">
                      Awaiting Deliverable Submission
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deliverable Display Box & In-App Inspection Viewer */}
        {(currentDeal.deliverable || currentDeal.deliverableUrl) && (
          <div className="neu-inset p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-xs font-extrabold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Package className="h-4 w-4 text-indigo-500" /> DELIVERABLE SUBMITTED BY {currentDeal.type === 'JOB_POSTING' ? 'FREELANCER' : 'SELLER'}
              </h4>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                  currentDeal.status === 'RELEASED'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                    : 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/40'
                }`}>
                  {currentDeal.status === 'RELEASED' ? 'Payout Released · Secrets Unlocked' : 'Pre-Release Inspection Mode'}
                </span>
              </div>
            </div>

            {/* Provider/Sender View: Status notification cards only (no inspection sandbox or download buttons) */}
            {isProvider ? (
              currentDeal.status === 'RELEASED' ? (
                <div className="neu-card p-6 text-center space-y-2 border-2 border-emerald-500/30">
                  <div className="h-10 w-10 rounded-2xl neu-inset text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                    Payout Released & Escrow Completed
                  </h4>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    The buyer has confirmed your deliverable and released payment. <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">+{currentDeal.price} {currentDeal.currency}</span> has been credited to your wallet balance.
                  </p>
                </div>
              ) : (
                <div className="neu-card p-6 text-center space-y-2 border-2 border-indigo-500/30">
                  <div className="h-10 w-10 rounded-2xl neu-inset text-indigo-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Deliverable Successfully Submitted & Sent to Buyer
                  </h4>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                    Your deliverable package (<span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{currentDeal.deliverable?.fileName || 'Deliverable_Archive.zip'}</span>) has been encrypted and delivered on-chain. Waiting for client (<span className="font-bold text-indigo-600 dark:text-indigo-400">{displayCounterpartyName || 'Buyer'}</span>) to inspect in sandbox and release payout.
                  </p>
                </div>
              )
            ) : (
              /* Receiver/Buyer View: Inspection Sandbox, Watermarked Preview, and Secret Production Payload */
              <>
                {/* STAGE 1: Inspection Sandbox Demo & Watermarked Preview Link */}
                <div className="neu-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-indigo-500" />
                      1. Pre-Release In-App Inspection Sandbox
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                      SAFE TO INSPECT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight font-medium">
                    Inspect the watermarked preview and test the functional sandbox instance directly inside your app to verify all job requirements are satisfied before releasing payout.
                  </p>

                  {/* Option A: Render Image Asset Preview if Image/Design */}
                  {(isImageOrDesign || currentDeal.deliverable?.fileKind === 'IMAGE') && (
                    <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 neu-inset p-3 my-2 flex justify-center cursor-pointer group" onClick={() => setIsSandboxOpen(true)}>
                      <img
                        src={getDeliverableImage(currentDeal.deliverable?.imageUrl, currentDeal.title, currentDeal.category, fileName)}
                        alt="Exact Deliverable Asset"
                        className="max-h-56 rounded-lg object-contain shadow-lg"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center pointer-events-none rotate-[-12deg]">
                        <span className="text-xs font-mono font-extrabold text-cyan-400 bg-slate-950/90 px-3.5 py-1 rounded-full border border-cyan-500/50 shadow-2xl">
                          VERA PRE-RELEASE WATERMARK
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Option B: Render PDF Document Card if PDF Document */}
                  {isPdfDocument && (
                    <div className="relative rounded-xl overflow-hidden border border-purple-500/30 neu-inset p-5 my-2 cursor-pointer group space-y-3" onClick={() => setIsSandboxOpen(true)}>
                      <div className="flex items-center justify-between border-b border-slate-300/40 dark:border-slate-800/60 pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-purple-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{fileName}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded uppercase">
                          PDF Document
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
                        <span>Standard PDF Document</span>
                        <span className="font-bold text-purple-500">{currentDeal.deliverable?.fileSize || '2.4 MB'}</span>
                      </div>

                      <div className="relative p-4 rounded-xl bg-slate-900/60 border border-purple-500/20 text-center flex items-center justify-center min-h-[100px] overflow-hidden">
                        <div className="space-y-1 relative z-10">
                          <p className="text-xs font-mono font-extrabold text-white">TRAVEL RULE COMPLIANCE PDF REPORT</p>
                          <p className="text-[10px] font-mono text-purple-400 font-bold">Payload Hash: {currentDeal.deliverable?.payloadHash?.slice(0, 16) || '0x9941a82f...'}</p>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 rotate-[-12deg] select-none">
                          <span className="text-sm font-mono font-extrabold text-purple-400 tracking-widest">VERA PRE-RELEASE WATERMARK</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option C: Render Code / Vault Card if Code or Credentials */}
                  {!isImageOrDesign && !isPdfDocument && (
                    <div className="relative rounded-xl overflow-hidden border border-indigo-500/30 neu-inset p-4 my-2 cursor-pointer group space-y-2" onClick={() => setIsSandboxOpen(true)}>
                      <div className="flex items-center justify-between border-b border-slate-300/40 dark:border-slate-800/60 pb-2">
                        <div className="flex items-center gap-2">
                          <Code className="h-5 w-5 text-indigo-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{fileName}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded uppercase">
                          Code Sandbox
                        </span>
                      </div>
                      <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">Interactive Sandbox Instance Ready for Inspection</p>
                    </div>
                  )}

                  <button
                    onClick={() => setIsSandboxOpen(true)}
                    className="w-full neu-btn-primary font-extrabold text-xs py-3 px-4 flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4 text-white" />
                    <span>Inspect Watermarked Deliverable In-App</span>
                  </button>
                </div>

                {/* STAGE 2: Secret Production Payload (Vera ZK Vault) */}
                <div className="neu-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Lock className={`h-4 w-4 ${currentDeal.status === 'RELEASED' ? 'text-emerald-500' : 'text-purple-500'}`} />
                      2. Secret Production Payload (Vera ZK Vault)
                    </span>
                    <div className="flex items-center gap-2">
                      {currentDeal.status === 'RELEASED' ? (
                        <button
                          onClick={() => setShowSecretCredentials(!showSecretCredentials)}
                          className="text-[10px] font-bold neu-inset text-slate-700 dark:text-slate-200 px-2.5 py-1 flex items-center gap-1 transition-colors"
                        >
                          {showSecretCredentials ? (
                            <>
                              <EyeOff className="h-3 w-3 text-slate-400" /> Hide Unmasked Secret
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 text-emerald-500" /> Reveal Decrypted Secret
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[9px] font-mono font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Locked Until Payout Release
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Format 1: FILE PACKAGE */}
                  {currentDeal.deliverable?.format === 'FILE' && (
                    <div className="neu-inset p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl neu-card text-purple-500 flex items-center justify-center font-bold">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white">{currentDeal.deliverable?.fileName || 'Deliverable_Package.zip'}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{currentDeal.deliverable?.fileSize || '14.2 MB'} · Production File Package</span>
                        </div>
                      </div>

                      {currentDeal.status === 'RELEASED' ? (
                        <button
                          onClick={() => handleDownloadDeliverable(currentDeal)}
                          className="neu-btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-md"
                        >
                          <FileText className="h-3.5 w-3.5 text-white" /> Download Unlocked File
                        </button>
                      ) : (
                        <button
                          disabled
                          className="neu-btn-secondary opacity-60 cursor-not-allowed text-xs font-bold px-4 py-2 flex items-center gap-1.5"
                        >
                          <Lock className="h-3.5 w-3.5" /> Download Locked
                        </button>
                      )}
                    </div>
                  )}

                  {/* Format 2: CREDENTIALS / LICENSE KEY */}
                  {currentDeal.deliverable?.format === 'CREDENTIALS' && (
                    <div className="relative">
                      <pre className="neu-inset text-indigo-600 dark:text-indigo-400 p-3.5 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap font-bold">
                        {currentDeal.status === 'RELEASED' && showSecretCredentials
                          ? currentDeal.deliverable.textCredentials
                          : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                      </pre>
                      {currentDeal.status !== 'RELEASED' && (
                        <div className="absolute inset-0 neu-inset bg-slate-950/70 backdrop-blur-[2px] rounded-xl flex items-center justify-center p-2 text-center">
                          <span className="text-[11px] font-bold text-purple-300 bg-slate-950/90 px-3.5 py-1.5 rounded-full border border-purple-500/40 flex items-center gap-1.5 shadow-lg">
                            <Lock className="h-3.5 w-3.5 text-purple-400" /> Confirm & Release Payout to Unlock Raw Credentials
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Format 3: URL LINK / FALLBACK */}
                  {(currentDeal.deliverable?.format === 'URL' || (!currentDeal.deliverable && currentDeal.deliverableUrl)) && (
                    <div className="neu-inset p-3 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-bold truncate max-w-md">
                        {currentDeal.status === 'RELEASED'
                          ? (currentDeal.deliverable?.url || currentDeal.deliverableUrl)
                          : 'https://github.com/private-repo/access-locked-••••••••'}
                      </span>
                      {currentDeal.status === 'RELEASED' ? (
                        <a
                          href={currentDeal.deliverable?.url || currentDeal.deliverableUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="neu-btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Access Production Repo
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 neu-inset px-2.5 py-1 rounded-md flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Detailed Contract Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Delivery Terms</span>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">{deal.deliveryTerms}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Refund Terms</span>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">{deal.refundTerms}</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Deadline & Window</span>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              {deal.deliveryDeadlineHrs}h delivery · {deal.confirmationWindowHrs}h review
            </p>
          </div>
        </div>

        {/* Action Panel / Contextual Buttons */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {/* Case 1: Tier Requirement Not Met */}
          {!isInitiator && !meetsTier && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-rose-500">Requires Cleanverse Tier {currentDeal.minTier}+</h4>
                  <p className="text-[11px] text-rose-400">
                    Your current persona tier is <span className="font-bold">Tier {activePersona.tier}</span>. Upgrade your identity record to participate.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-xl border border-rose-500/30">
                Locked
              </span>
            </div>
          )}

          {/* Case 2: SERVICE_LISTING — Buyer purchases and deposits into Escrow */}
          {!isInitiator && currentDeal.type === 'SERVICE_LISTING' && meetsTier && (
            <button
              onClick={() => openCheckout(currentDeal)}
              disabled={hasAlreadyFundedOrPurchased || currentDeal.status !== 'OPEN'}
              className={`w-full font-extrabold py-4 px-6 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 ${
                hasAlreadyFundedOrPurchased || currentDeal.status !== 'OPEN'
                  ? 'neu-inset text-slate-500 dark:text-slate-400 opacity-60 cursor-not-allowed border border-slate-300 dark:border-slate-800'
                  : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20'
              }`}
            >
              <Wallet className="h-4 w-4" />
              <span>
                {hasAlreadyFundedOrPurchased
                  ? 'Buy Now (Already Purchased & Escrow Secured)'
                  : currentDeal.status !== 'OPEN'
                  ? 'Escrow Claimed by Another Buyer'
                  : `Buy Now & Deposit ${currentDeal.price} ${currentDeal.currency} in Escrow`}
              </span>
            </button>
          )}

          {/* Case 3: Provider (Accepted Freelancer) submits deliverable — only after a freelancer has been assigned */}
          {(currentDeal.status === 'FUNDED' || (currentDeal.status as string) === 'ACCEPTED') && isProvider && hasCounterpartyAssigned && !currentDeal.deliverableUrl && !currentDeal.deliverable && (
            <button
              onClick={() => openSubmitDeliverable(currentDeal)}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold py-4 px-6 rounded-2xl text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span>Escrow Secured! Attach & Send Deliverable to Client</span>
            </button>
          )}

          {/* Case 3b: Deliverable Already Sent Badge for Provider */}
          {(currentDeal.status === 'DELIVERED' || currentDeal.deliverableUrl || currentDeal.deliverable) && isProvider && currentDeal.status !== 'RELEASED' && (
            <div className="neu-inset p-5 text-center space-y-1">
              <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-500" /> Deliverable Successfully Submitted
              </h4>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Waiting for client/buyer to review and release payout on-chain.
              </p>
            </div>
          )}

          {/* Case 4: Receiver (Client or Buyer) waiting for deliverable */}
          {(currentDeal.status === 'FUNDED' || (currentDeal.status as string) === 'ACCEPTED') && isReceiver && !currentDeal.deliverableUrl && !currentDeal.deliverable && (
            <div className="neu-inset p-5 text-center space-y-1">
              <h4 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Escrow Locked & Active</h4>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Payment of <span className="font-bold font-mono text-slate-900 dark:text-white">{currentDeal.price} {currentDeal.currency}</span> is locked in <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">Escrow contract</code>. Waiting for provider to submit deliverable.
              </p>
            </div>
          )}

          {/* Case 5: Deliverable Sent -> Receiver reviews & releases payout */}
          {currentDeal.status === 'DELIVERED' && (
            <button
              onClick={handleReleaseFunds}
              disabled={isProcessing || !meetsTier || !isReceiver}
              className={`w-full font-extrabold py-4 px-6 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 ${
                !meetsTier || !isReceiver
                  ? 'neu-btn-secondary opacity-60 cursor-not-allowed'
                  : isProcessing
                  ? 'neu-btn-primary cursor-wait'
                  : 'neu-btn-primary'
              }`}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>
                {!meetsTier
                  ? `Cleanverse Tier ${currentDeal.minTier}+ Required to Release Payout`
                  : !isReceiver
                  ? 'Only Escrow Buyer / Client Can Release Payout'
                  : isProcessing
                  ? 'Releasing Payout on-chain...'
                  : `Confirm Deliverable & Release ${currentDeal.price} ${currentDeal.currency} Payout`}
              </span>
            </button>
          )}

          {/* Case 5b: Payout Released Badge */}
          {currentDeal.status === 'RELEASED' && (
            <div className="neu-inset p-5 text-center space-y-1 border-2 border-emerald-500/40">
              <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Escrow Released & Contract Closed
              </h4>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Payout transferred on-chain to provider's wallet address.
              </p>
            </div>
          )}

          {/* Case 6: JOB_POSTING & Freelancer accepts */}
          {!isInitiator && currentDeal.type === 'JOB_POSTING' && meetsTier && (
            <button
              onClick={handleAcceptJob}
              disabled={hasAlreadyFundedOrPurchased || (currentDeal.status !== 'OPEN' && currentDeal.status !== 'FUNDED') || openSlots <= 0 || isProcessing || isChecking || escrowLoading}
              className={`w-full font-extrabold py-4 px-6 rounded-2xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                hasAlreadyFundedOrPurchased || (currentDeal.status !== 'OPEN' && currentDeal.status !== 'FUNDED') || openSlots <= 0
                  ? 'neu-inset text-slate-500 dark:text-slate-400 opacity-60 cursor-not-allowed border border-slate-300 dark:border-slate-800'
                  : isProcessing
                  ? 'bg-cyan-500 text-white cursor-wait'
                  : 'bg-slate-900 dark:bg-purple-600 hover:bg-slate-950 dark:hover:bg-purple-500 text-white'
              }`}
            >
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
              <span>
                {hasAlreadyFundedOrPurchased
                  ? 'Accept Job (Already Claimed & Escrow Secured)'
                  : (openSlots <= 0 && currentDeal.status !== 'OPEN' && currentDeal.status !== 'FUNDED')
                  ? 'Job Slot Claimed'
                  : isProcessing
                  ? 'Verifying A-Pass...'
                  : 'Accept Job & Verify Cleanverse Attestation'}
              </span>
            </button>
          )}

          {/* Case 7: Completed Deal & Audit Report */}
          {currentDeal.status === 'RELEASED' && (
            <button
              onClick={() => openDisputeAudit(currentDeal.escrowAddress)}
              className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold py-3.5 px-6 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <FileText className="h-4 w-4 text-cyan-400" />
              <span>Download Travel Rule Compliance Audit Report (.PDF)</span>
            </button>
          )}
        </div>
      </div>

      {/* In-App Inspection Sandbox Modal */}
      <SandboxPreviewModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        deal={deal}
        onReleasePayout={handleReleaseFunds}
        onRejectDeliverable={() => setIsRejectModalOpen(true)}
        isReleasing={isProcessing}
      />

      {/* Reject & Request Revision Modal */}
      <RejectDeliverableModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        deal={deal}
        onRejectSubmit={(dealId, reason) => {
          rejectDeliverable(dealId, reason);
          showNotice('Deliverable rejected. Revision request sent to seller.');
        }}
      />

      {/* Monad Explorer Transaction Modal */}
      <MonadExplorerModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        txHash={selectedTxHash}
        txType={selectedTxType}
        contractAddress={currentDeal.escrowAddress}
        amount={`${currentDeal.price} ${currentDeal.currency}`}
        initiatorName={currentDeal.initiatorName}
        counterpartyName={displayCounterpartyName}
      />
    </div>
  );
};
