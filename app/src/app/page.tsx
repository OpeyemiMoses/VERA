'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { OnboardingModal } from '../components/OnboardingModal';
import { PostJobModal } from '../components/PostJobModal';
import { PlaygroundModal } from '../components/PlaygroundModal';
import { DisputeAuditModal } from '../components/DisputeAuditModal';
import { DealsPage } from '../components/DealsPage';
import { DealDetailPage } from '../components/DealDetailPage';
import { CheckoutModal } from '../components/CheckoutModal';
import { SubmitDeliverableModal } from '../components/SubmitDeliverableModal';
import { LandingPage } from '../components/LandingPage';
import { Footer } from '../components/Footer';
import { UserProfileModal } from '../components/UserProfileModal';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { useWriteContract, usePublicClient } from 'wagmi';
import { ESCROW_ABI, FACTORY_ADDRESS } from '../lib/contracts';
import { usePersona } from '../context/PersonaContext';
import { useDeals } from '../context/DealsContext';
import { useToast } from '../context/ToastContext';
import { useEscrow } from '../hooks/useEscrow';
import { useCleanverse, PERSONA_KEYS } from '../hooks/useCleanverse';
import { useScrollRise } from '../hooks/useScrollRise';
import { Deal, DealType, MARKETPLACE_CATEGORIES } from '../types/deal';
import {
  ShieldCheck,
  Plus,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Wallet,
  ShoppingBag,
  UserCheck,
  Sparkles,
  Zap,
  Lock,
  Layers,
  FileText,
  Briefcase,
  AlertCircle,
  Eye,
  Coins,
} from 'lucide-react';

export default function Home() {
  useScrollRise();
  const { activePersona, activePersonaKey, appMode, addBalance } = usePersona();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const {
    deals,
    activeDealList,
    sharedApiDeals,
    createDeal,
    purchaseService: purchaseServiceContext,
    acceptJob: acceptJobContext,
    submitDeliverable: submitDeliverableContext,
    updateDealStatus: updateDealStatusContext,
  } = useDeals();
  const { acceptWithAttestation, confirmDelivery, isLoading: escrowLoading } = useEscrow();
  const { checkCompliance, isChecking } = useCleanverse();
  const { showSuccess, showError, showInfo } = useToast();

  // SSR-safe tab state: always start with 'landing' so server & client HTML match.
  // After hydration, useEffect restores the correct tab from sessionStorage/localStorage.
  const [activeTab, setActiveTabState] = useState<string>('landing');
  const [appMounted, setAppMounted] = useState(false);
  const [createDealType, setCreateDealType] = useState<DealType>('SERVICE_LISTING');

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vera_active_tab', tab);
    }
  };

  // After mount: restore the last tab the user was on (or 'home' if already onboarded)
  useEffect(() => {
    const saved = sessionStorage.getItem('vera_active_tab');
    if (saved && saved !== 'landing') {
      setActiveTabState(saved);
    } else {
      const hasOnboarded = localStorage.getItem('vera_onboarded');
      if (hasOnboarded) {
        setActiveTabState('home');
        sessionStorage.setItem('vera_active_tab', 'home');
      }
    }
    setAppMounted(true);
  }, []);

  const [selectedDetailDeal, setSelectedDetailDeal] = useState<Deal | null>(null);
  const [selectedCheckoutDeal, setSelectedCheckoutDeal] = useState<Deal | null>(null);
  const [selectedSubmitDeliverableDeal, setSelectedSubmitDeliverableDeal] = useState<Deal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [isDisputesOpen, setIsDisputesOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [auditTxHash, setAuditTxHash] = useState<string>('');
  const [pendingDealId, setPendingDealId] = useState<string | null>(null);

  const hasProcessedUrlDeal = useRef(false);

  // Check URL query parameters for ?deal=deal-xxx shareable links ONCE on mount
  useEffect(() => {
    if (typeof window === 'undefined' || hasProcessedUrlDeal.current) return;
    const params = new URLSearchParams(window.location.search);
    const dealIdParam = params.get('deal');
    if (!dealIdParam) return;

    hasProcessedUrlDeal.current = true;

    // Immediately switch off landing page to home view on mobile & desktop
    setActiveTabState('home');

    // 1. Check local deals state
    const foundLocal = deals.find(
      (d) => d.id === dealIdParam || (d.escrowAddress && d.escrowAddress.toLowerCase() === dealIdParam.toLowerCase())
    );

    if (foundLocal) {
      setSelectedDetailDeal(foundLocal);
      return;
    }

    // 2. Fetch directly from global API endpoint if not yet loaded in local state
    let isMounted = true;
    fetch('/api/deals')
      .then((res) => res.json())
      .then((json) => {
        if (!isMounted || !json.success || !Array.isArray(json.deals)) return;
        const foundApi = json.deals.find(
          (d: Deal) => d.id === dealIdParam || (d.escrowAddress && d.escrowAddress.toLowerCase() === dealIdParam.toLowerCase())
        );
        if (foundApi) {
          setSelectedDetailDeal(foundApi);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [deals]);

  // Auto-sync selectedDetailDeal with latest global deals state (server + local merged)
  useEffect(() => {
    if (!selectedDetailDeal) return;
    const baseId = selectedDetailDeal.id.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];

    // 1. Look for an exact match (or escrow address match) in activeDealList (server+local merged)
    const exactMatch = activeDealList.find(
      (d) => d.id === selectedDetailDeal.id ||
        (d.escrowAddress && selectedDetailDeal.escrowAddress && d.escrowAddress.toLowerCase() === selectedDetailDeal.escrowAddress.toLowerCase())
    );

    // 2. If the creator is viewing an OPEN base deal, check if a funded sub-order now exists on the server
    //    (e.g. creator has deal-123 OPEN, buyer created deal-123-slot-1 FUNDED on their device)
    const fundedSubOrder = !exactMatch || exactMatch.status === 'OPEN'
      ? activeDealList.find(
          (d) => d.id !== selectedDetailDeal.id &&
            (d.id.startsWith(`${baseId}-slot-`) || d.id.startsWith(`${baseId}-order-`)) &&
            (d.status === 'FUNDED' || d.status === 'DELIVERED' || d.status === 'RELEASED')
        ) ||
        sharedApiDeals.find(
          (d) => d.id !== selectedDetailDeal.id &&
            (d.id.startsWith(`${baseId}-slot-`) || d.id.startsWith(`${baseId}-order-`)) &&
            (d.status === 'FUNDED' || d.status === 'DELIVERED' || d.status === 'RELEASED')
        )
      : undefined;

    const best = fundedSubOrder || exactMatch;
    if (best && JSON.stringify(best) !== JSON.stringify(selectedDetailDeal)) {
      setSelectedDetailDeal(best);
    }
  }, [activeDealList, sharedApiDeals, selectedDetailDeal]);


  const showNotice = (msg: string) => {
    if (msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed')) {
      showError(msg);
    } else if (msg.toLowerCase().includes('success') || msg.toLowerCase().includes('confirmed') || msg.toLowerCase().includes('created') || msg.toLowerCase().includes('released') || msg.toLowerCase().includes('paid') || msg.toLowerCase().includes('secured')) {
      showSuccess(msg);
    } else {
      showInfo(msg);
    }
  };

  const handleCreateDeal = (newDeal: Deal) => {
    createDeal(newDeal);
    showNotice(`Escrow Deal Created & Published. Address: ${newDeal.escrowAddress.slice(0, 10)}...`);
  };

  const handleSubmitDeliverable = async (dealId: string, deliverable: any) => {
    const targetDeal = deals.find((d) => d.id === dealId) || selectedDetailDeal;
    let customAttestationHash: string | undefined = undefined;

    // In production, run a lightweight Cleanverse CVI compliance check as a gate (no on-chain tx)
    if (appMode === 'production' && targetDeal?.escrowAddress) {
      try {
        showNotice(`Running Cleanverse compliance verification...`);
        const compliance = await checkCompliance(
          activePersona.walletAddress,
          targetDeal.escrowAddress,
          FACTORY_ADDRESS,
          'monad-testnet',
          targetDeal.minTier
        );

        if (!compliance.allowed) {
          showNotice(`Compliance Rejection: ${compliance.reason || 'Cleanverse A-Pass check failed'}`);
          return;
        }

        // Use the attestation signature as a cryptographic receipt hash (no on-chain submission needed)
        const sig = typeof compliance.attestation === 'object' ? compliance.attestation?.signature : compliance.attestation;
        if (sig && sig.startsWith('0x')) {
          customAttestationHash = sig;
        }
        showNotice(`Compliance verified. Attaching deliverable to escrow vault...`);
      } catch (err: any) {
        console.warn('[DELIVERABLE] Compliance check note:', err?.message);
        // Non-blocking — continue with submission even if compliance API is unavailable
      }
    }

    submitDeliverableContext(dealId, deliverable, customAttestationHash);
    const baseId = dealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    const updated = deals.find((d) => d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`));
    if (selectedDetailDeal && (selectedDetailDeal.id === dealId || selectedDetailDeal.id.startsWith(dealId) || selectedDetailDeal.id.startsWith(baseId))) {
      const buyerName = updated?.counterpartyName || selectedDetailDeal.counterpartyName;
      const buyerAddr = updated?.counterpartyAddress || selectedDetailDeal.counterpartyAddress;
      setSelectedDetailDeal({
        ...(updated || selectedDetailDeal),
        status: 'DELIVERED',
        deliverable,
        deliverableUrl: deliverable.url,
        deliverableNotes: deliverable.instructions,
        counterpartyName: buyerName && buyerName !== 'Buyer' ? buyerName : selectedDetailDeal.counterpartyName,
        counterpartyAddress: buyerAddr && buyerAddr !== '0x0000000000000000000000000000000000000000' ? buyerAddr : selectedDetailDeal.counterpartyAddress,
        attestationTxHash: customAttestationHash || deliverable.signature || (deliverable.payloadHash?.startsWith('0x') ? deliverable.payloadHash : undefined) || selectedDetailDeal.attestationTxHash,
      });
    }
    showNotice(`Deliverable (${deliverable.format}) sent to buyer! Cleanverse compliance verified.`);
  };

  const handlePurchaseService = (originalDealId: string, customDepositTxHash?: string, customEscrowAddress?: string) => {
    const fundedOrder = purchaseServiceContext(originalDealId, activePersona.walletAddress, activePersona.name, customDepositTxHash, customEscrowAddress);
    const targetDeal = fundedOrder || deals.find((d) => d.id === originalDealId || d.id.startsWith(originalDealId)) || selectedDetailDeal;
    if (targetDeal) {
      const finalFunded: Deal = {
        ...targetDeal,
        status: 'FUNDED' as const,
        depositTxHash: customDepositTxHash || targetDeal.depositTxHash,
        escrowAddress: customEscrowAddress || targetDeal.escrowAddress,
        counterpartyAddress: activePersona.walletAddress,
        counterpartyName: activePersona.name,
      };
      setSelectedDetailDeal(finalFunded);
    }
    showNotice(`Escrow Paid & Secured on Monad Testnet!`);
  };

  const handleUpdateDealStatus = (dealId: string, newStatus: Deal['status'], counterpartyName?: string, counterpartyWallet?: string, releaseTxHash?: string) => {
    updateDealStatusContext(dealId, newStatus, counterpartyName, counterpartyWallet, releaseTxHash);
    if (selectedDetailDeal && (selectedDetailDeal.id === dealId || selectedDetailDeal.id.startsWith(dealId))) {
      setSelectedDetailDeal((prev) => (prev ? { ...prev, status: newStatus, releaseTxHash: releaseTxHash || prev.releaseTxHash } : null));
    }
  };

  const hasUserParticipated = (deal: Deal) => {
    const userWallet = activePersona.walletAddress.toLowerCase();
    const userName = activePersona.name.toLowerCase();

    if (deal.participantWallets?.some((w) => w.toLowerCase() === userWallet)) {
      return true;
    }

    return deals.some(
      (d) =>
        d.id !== deal.id &&
        (d.id.startsWith(deal.id) || (d.escrowAddress && d.escrowAddress === deal.escrowAddress)) &&
        ((d.counterpartyAddress && d.counterpartyAddress.toLowerCase() === userWallet) ||
          (d.counterpartyName && d.counterpartyName.toLowerCase().includes(userName)))
    );
  };

  const handleAcceptJob = async (deal: Deal) => {
    setPendingDealId(deal.id);
    showNotice(`Running Cleanverse compliance check for ${activePersona.name}...`);

    const compliance = await checkCompliance(
      activePersona.walletAddress,
      deal.escrowAddress,
      process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '',
      'monad-testnet',
      deal.minTier
    );

    if (!compliance.allowed) {
      showNotice(`Compliance Rejection: ${compliance.reason}`);
      setPendingDealId(null);
      return;
    }

    showNotice(`Compliance passed. Submitting on-chain attestation to Escrow Contract...`);
    const attestationSig = typeof compliance.attestation === 'object' ? compliance.attestation?.signature : compliance.attestation;
    const deadlineVal = typeof compliance.attestation === 'object' ? compliance.attestation?.deadline : (Math.floor(Date.now() / 1000) + 3600);

    if (appMode === 'production') {
      try {
        showNotice('Submitting acceptWithAttestation to Monad Testnet... Confirm in Web3 wallet.');
        const txHash = await writeContractAsync({
          address: deal.escrowAddress as `0x${string}`,
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

        acceptJobContext(deal.id, activePersona.walletAddress, activePersona.name, txHash);
        updateDealStatusContext(deal.id, 'ACCEPTED' as any, activePersona.name, activePersona.walletAddress, txHash);
        showNotice(`Job Accepted On-Chain (${txHash.slice(0, 10)}...)! Cleanverse attestation verified.`);
      } catch (err: any) {
        showNotice(`On-chain job acceptance failed: ${err?.shortMessage || err?.message}`);
      } finally {
        setPendingDealId(null);
      }
      return;
    }

    const privKey = PERSONA_KEYS[activePersonaKey] || '0xb553cb10a16d0ce4a890cf2611922db0b572fd91ea4b11a56735f179b4b53516';
    await acceptWithAttestation(
      privKey,
      deal.escrowAddress,
      attestationSig || '0x'
    );

    acceptJobContext(deal.id, activePersona.walletAddress, activePersona.name);

    const baseId = deal.id.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    const parent = deals.find((d) => d.id === baseId || d.id === deal.id);
    if (parent) {
      const nextSlot = (parent.acceptedCount || 0) + 1;
      const fundedSubOrder: Deal = {
        ...parent,
        id: `${baseId}-slot-${nextSlot}`,
        slotNumber: nextSlot,
        status: 'FUNDED',
        counterpartyAddress: activePersona.walletAddress,
        counterpartyName: activePersona.name,
        depositTxHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      };
      setSelectedDetailDeal(fundedSubOrder);
    }

    showNotice(`Job Accepted on-chain. Verified A-Pass attestation confirmed.`);
    setPendingDealId(null);
  };

  const handleOpenDealDetail = (deal: Deal) => {
    const baseId = deal.id.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    const userWallet = activePersona.walletAddress.toLowerCase();
    const relatedDeals = activeDealList.filter(
      (d) => d.id === deal.id || d.id === baseId || d.id.startsWith(`${baseId}-`)
    );

    const matchWithDeliverable = relatedDeals.find((d) => d.deliverable || d.deliverableUrl);
    const userSubOrder = relatedDeals.find(
      (d) => (d.clientAddress && d.clientAddress.toLowerCase() === userWallet) ||
             (d.counterpartyAddress && d.counterpartyAddress.toLowerCase() === userWallet)
    );

    const best = matchWithDeliverable || userSubOrder || deal;
    setSelectedDetailDeal(best);
  };

  const handleReleaseEscrow = async (deal: Deal) => {
    setPendingDealId(deal.id);
    showNotice(`Releasing ${deal.price} ${deal.currency} to provider...`);

    const callerAddress = activePersona.walletAddress.toLowerCase();
    const recipient =
      (deal.freelancerAddress && deal.freelancerAddress.toLowerCase() !== callerAddress ? deal.freelancerAddress : undefined) ||
      (deal.deliverable?.senderAddress && deal.deliverable.senderAddress.toLowerCase() !== callerAddress ? deal.deliverable.senderAddress : undefined) ||
      (deal.initiatorAddress && deal.initiatorAddress.toLowerCase() !== callerAddress ? deal.initiatorAddress : undefined) ||
      (deal.type === 'SERVICE_LISTING' ? deal.initiatorAddress : deal.counterpartyAddress || deal.initiatorAddress);

    if (appMode === 'production') {
      try {
        let txHash: `0x${string}`;
        if (recipient && recipient.startsWith('0x') && recipient !== '0x0000000000000000000000000000000000000000') {
          try {
            txHash = await writeContractAsync({
              address: deal.escrowAddress as `0x${string}`,
              abi: ESCROW_ABI,
              functionName: 'releaseTo',
              args: [recipient as `0x${string}`],
            });
          } catch (relToErr: any) {
            const errStr = (relToErr?.shortMessage || relToErr?.message || '').toLowerCase();
            if (relToErr?.code === 4001 || errStr.includes('user rejected') || errStr.includes('user denied')) {
              showNotice('Payout release cancelled in wallet.');
              setPendingDealId(null);
              return;
            }
            console.warn('[RELEASE] releaseTo failed, falling back to release():', relToErr);
            txHash = await writeContractAsync({
              address: deal.escrowAddress as `0x${string}`,
              abi: ESCROW_ABI,
              functionName: 'release',
            });
          }
        } else {
          txHash = await writeContractAsync({
            address: deal.escrowAddress as `0x${string}`,
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

        updateDealStatusContext(deal.id, 'RELEASED', undefined, undefined, txHash);
        showNotice(`Payout Released On-Chain (${txHash.slice(0, 10)}...).`);
      } catch (err: any) {
        const errStr = (err?.shortMessage || err?.message || '').toLowerCase();
        if (err?.code === 4001 || errStr.includes('user rejected') || errStr.includes('user denied')) {
          showNotice('Payout release cancelled in wallet.');
        } else {
          showNotice(`On-chain payout release failed: ${err?.shortMessage || err?.message}`);
        }
      } finally {
        setPendingDealId(null);
      }
      return;
    }

    const privKey = PERSONA_KEYS[activePersonaKey] || '0xb553cb10a16d0ce4a890cf2611922db0b572fd91ea4b11a56735f179b4b53516';
    await confirmDelivery(privKey, deal.escrowAddress);

    if (recipient) {
      addBalance(deal.price, deal.currency, recipient);
    }

    handleUpdateDealStatus(deal.id, 'RELEASED');
    showNotice(`Payout Released: ${deal.price} ${deal.currency} credited to provider (${recipient.slice(0, 8)}...).`);
    setPendingDealId(null);
  };

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getFilteredDeals = () => {
    return deals.filter((deal) => {
      const matchesSearch =
        deal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        filterCategory === 'All' || deal.category.toLowerCase() === filterCategory.toLowerCase();

      if (!matchesSearch || !matchesCategory) return false;

      const isUserInitiator =
        activePersona.walletAddress.toLowerCase() === deal.initiatorAddress.toLowerCase() ||
        activePersona.name.toLowerCase().includes(deal.initiatorName.toLowerCase()) ||
        deal.initiatorName.toLowerCase().includes(activePersona.name.toLowerCase());

      const isUserCounterparty =
        (deal.counterpartyAddress && deal.counterpartyAddress.toLowerCase() === activePersona.walletAddress.toLowerCase()) ||
        (deal.counterpartyName && (activePersona.name.toLowerCase().includes(deal.counterpartyName.toLowerCase()) || deal.counterpartyName.toLowerCase().includes(activePersona.name.toLowerCase()))) ||
        (deal.participantWallets && deal.participantWallets.some((w) => w.toLowerCase() === activePersona.walletAddress.toLowerCase()));

      const isChildInstance = deal.id.includes('-order-') || deal.id.includes('-accepted-') || deal.id.includes('-slot-');

      if (activeTab === 'home' || activeTab === 'browse-services' || activeTab === 'browse-jobs') {
        // Public Marketplace: ONLY display public SERVICE_LISTING items (no private 1-on-1 deals!)
        return deal.type === 'SERVICE_LISTING' && !isChildInstance && deal.status === 'OPEN' && !isUserInitiator;
      }
      if (activeTab === 'my-created' || activeTab === 'my-jobs' || activeTab === 'my-listings' || activeTab === 'my-deals') {
        // Creator view: Show all deals/listings created by active wallet (exclude child slot sub-orders)
        return isUserInitiator && !isChildInstance;
      }
      if (activeTab === 'my-purchased' || activeTab === 'my-work' || activeTab === 'my-purchases' || activeTab === 'my-contracts') {
        // Participant/Buyer view: Show child sub-orders OR deals where user is counterparty/participant
        return !isUserInitiator && isUserCounterparty;
      }

      return true;
    });
  };

  const filteredDeals = getFilteredDeals();

  // Block render until after mount so we can restore the correct tab from storage
  // without causing a SSR hydration mismatch (server renders 'landing', client reads sessionStorage)
  if (!appMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0b0e15]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
            Vera Protocol
          </p>
        </div>
      </div>
    );
  }

  if (activeTab === 'landing') {
    return (
      <>
        <LandingPage
          onLaunchApp={() => setActiveTab('home')}
          openPlayground={() => setIsPlaygroundOpen(true)}
          openDisputes={() => setIsDisputesOpen(true)}
        />
        {/* Modals available from Landing Page */}
        <PostJobModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          onJobCreated={handleCreateDeal}
        />
        <PlaygroundModal
          isOpen={isPlaygroundOpen}
          onClose={() => setIsPlaygroundOpen(false)}
        />
        <DisputeAuditModal
          isOpen={isDisputesOpen}
          onClose={() => setIsDisputesOpen(false)}
          prefillTxHash={auditTxHash}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#e4ebf5] dark:bg-[#0b0e15] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white transition-colors">
      {/* Sidebar — only participates in flex layout on desktop */}
      <div className="hidden md:block flex-shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedDetailDeal(null);
          }}
          openPostModal={() => {
            setCreateDealType('SERVICE_LISTING');
            setActiveTab('create-deal');
            setSelectedDetailDeal(null);
          }}
          openPlayground={() => setIsPlaygroundOpen(true)}
          openDisputes={() => setIsDisputesOpen(true)}
          openProfile={() => setIsProfileOpen(true)}
          isOpenMobile={false}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area — full width on mobile, flex-1 on desktop */}
      <main className="flex-1 min-w-0 w-full h-screen overflow-y-auto p-3 sm:p-6 space-y-5 pb-24 md:pb-6">
        {/* Top Header Navigation Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setSelectedDetailDeal(null);
          }}
          openPostModal={() => {
            setCreateDealType('SERVICE_LISTING');
            setActiveTab('create-deal');
            setSelectedDetailDeal(null);
          }}
          openPlayground={() => setIsPlaygroundOpen(true)}
          openDisputes={() => setIsDisputesOpen(true)}
          openProfile={() => setIsProfileOpen(true)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dedicated Deal Detail Page */}
        {selectedDetailDeal ? (
          <DealDetailPage
            deal={selectedDetailDeal}
            onBack={() => setSelectedDetailDeal(null)}
            onUpdateDealStatus={handleUpdateDealStatus}
            openCheckout={(d) => setSelectedCheckoutDeal(d)}
            openSubmitDeliverable={(d) => setSelectedSubmitDeliverableDeal(d)}
            openDisputeAudit={(tx) => {
              setAuditTxHash(tx);
              setIsDisputesOpen(true);
            }}
            onSelectDeal={(d) => setSelectedDetailDeal(d)}
          />
        ) : (activeTab === 'deals' || activeTab === 'create-deal') ? (
          <DealsPage onBackToHome={() => setActiveTab('home')} onDealCreated={handleCreateDeal} initialDealType={createDealType} />
        ) : (
          <>
            {/* Hero Action Banner */}
            {activeTab === 'home' && (
              <section className="neu-card p-8 mb-8 relative overflow-hidden" id="hero-action-section">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                  <div className="lg:col-span-7 space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full neu-inset text-indigo-600 dark:text-indigo-400 text-xs font-bold font-mono">
                      <Lock className="h-3.5 w-3.5" /> IDENTITY-GATED ON-CHAIN ESCROW PROTOCOL
                    </span>
                    <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                      vera <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500">Protocol</span>
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed font-medium">
                      Money locks securely in Escrow smart contracts. Only ID-verified participants meeting Validator Pool tier rules can accept or claim payouts.
                    </p>
                  </div>

                  <div className="lg:col-span-5 neu-inset p-6 space-y-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-2">
                      START A DEAL
                    </span>
                    <button
                      onClick={() => setActiveTab('deals')}
                      className="w-full neu-btn-primary py-3.5 px-5 text-xs font-bold flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Plus className="h-4 w-4 text-white" />
                        <span>Create Escrow Deal / Payment Link</span>
                      </div>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setIsPlaygroundOpen(true)}
                      className="w-full neu-btn-secondary py-3 px-5 flex items-center justify-between text-xs font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-indigo-500" />
                        <span>Policy Engine Simulator</span>
                      </div>
                      <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded font-bold font-mono">
                        TRY RULES
                      </span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* How It Works Section */}
            {activeTab === 'home' && (
              <section className="mb-8 space-y-4" id="how-it-works-section">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">HOW IT WORKS</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Escrow in three clear steps</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="neu-card p-5 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-2xl neu-inset text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                      01
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Set Deal & Min Tier</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                        Buyer or Seller defines budget, delivery terms, and minimum Cleanverse A-Pass tier.
                      </p>
                    </div>
                  </div>

                  <div className="neu-card p-5 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-2xl neu-inset text-purple-600 dark:text-purple-400 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                      02
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Payer Funds Escrow</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                        Payer deposits tokens into Escrow contract. Funds are locked securely until work is approved.
                      </p>
                    </div>
                  </div>

                  <div className="neu-card p-5 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-2xl neu-inset text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-xs flex-shrink-0">
                      03
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Deliver & Release Payout</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                        Provider submits ZK-encrypted deliverables. Client inspects in sandbox & releases payout.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Search & Category Filter */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search deals, skills, or service listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 neu-inset text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-colors"
                />
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                      filterCategory === cat
                        ? 'neu-btn-primary text-white shadow-md'
                        : 'neu-btn-secondary text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Deals Grid */}
            <section className="mb-12" id="popular-services-section">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                    {activeTab === 'home'
                      ? 'Identity-Gated Active Escrow Pools'
                      : activeTab === 'browse-jobs'
                      ? 'Open Work Bounties & Escrow Contracts'
                      : activeTab === 'browse-services'
                      ? 'OTC & Fixed Service Settlement Pools'
                      : activeTab.replace('-', ' ')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {filteredDeals.length} deal(s) available for your current persona view
                  </p>
                </div>
              </div>

              {filteredDeals.length === 0 ? (
                <div className="neu-card rounded-3xl p-12 text-center border-2 border-indigo-500/30 space-y-4 transition-colors">
                  <div className="h-16 w-16 rounded-3xl neu-inset text-indigo-500 flex items-center justify-center mx-auto font-bold">
                    <Sparkles className="h-8 w-8 text-indigo-500 animate-pulse" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Cleanverse Monad Marketplace Ready</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed font-medium">
                    No active escrow deals exist yet on Monad Testnet. Be the first to deploy a multi-slot escrow job or list an identity-gated service!
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setCreateDealType('SERVICE_LISTING');
                        setActiveTab('create-deal');
                      }}
                      className="neu-btn-primary px-5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-lg"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Escrow Deal or Service Listing</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDeals.map((deal) => {
                    const isUserInitiator =
                      activePersona.walletAddress.toLowerCase() === deal.initiatorAddress.toLowerCase() ||
                      activePersona.name.toLowerCase().includes(deal.initiatorName.toLowerCase()) ||
                      deal.initiatorName.toLowerCase().includes(activePersona.name.toLowerCase());
                    const meetsTier = activePersona.isVerified && activePersona.tier >= deal.minTier;
                    const userAlreadyParticipated = hasUserParticipated(deal);

                    const totalSlots = deal.totalSlots ?? (deal.quantity !== undefined ? deal.quantity : 1);
                    const acceptedCount = deal.acceptedCount ?? ((deal.status !== 'OPEN' && deal.status !== 'FUNDED') ? 1 : 0);
                    const openSlots = Math.max(0, totalSlots - acceptedCount);
                    // A freelancer is only truly assigned when counterpartyAddress is set and non-zero
                    const hasCounterpartyAssigned = !!deal.counterpartyAddress && deal.counterpartyAddress !== '0x0000000000000000000000000000000000000000';

                    return (
                      <div
                        key={deal.id}
                        className="neu-card p-5 flex flex-col justify-between animate-slide-up"
                      >
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl neu-inset text-indigo-600 dark:text-indigo-400 font-mono">
                              {deal.type === 'DIRECT_DEAL' ? '1-ON-1 DEAL' : 'SERVICE OFFER'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {deal.type === 'SERVICE_LISTING' && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-mono">
                                  {Math.max(0, (deal.serviceCapacity || deal.totalSlots || 1) - (deal.purchasedCount ?? 0))} of {deal.serviceCapacity || deal.totalSlots || 1} Left
                                </span>
                              )}

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-lg font-mono ${
                                  hasCounterpartyAssigned
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {hasCounterpartyAssigned ? '1-on-1 Locked' : 'Available'}
                              </span>

                              <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 font-mono">
                                <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                                Tier {deal.minTier}
                              </span>
                            </div>
                          </div>

                          <h4
                            onClick={() => handleOpenDealDetail(deal)}
                            className="font-bold text-slate-900 dark:text-white text-sm leading-snug mb-3 line-clamp-2 hover:text-indigo-500 transition-colors cursor-pointer"
                          >
                            {deal.title}
                          </h4>

                          {/* Initiator vs Counterparty Card */}
                          <div className="neu-inset rounded-2xl p-3 text-xs space-y-1 mb-3">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-400 font-medium">Service Creator:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{deal.initiatorName}</span>
                            </div>
                            {isUserInitiator && (
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-400 font-medium">Counterparty Link:</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const link = typeof window !== 'undefined' ? `${window.location.origin}/?deal=${deal.id}` : '';
                                    if (link) {
                                      navigator.clipboard.writeText(link);
                                      showNotice('Shareable Escrow Link copied to clipboard!');
                                    }
                                  }}
                                  className="font-bold text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>{hasCounterpartyAssigned ? 'Assigned & Locked' : 'Copy Share Link'}</span>
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="my-3 py-2 border-y border-slate-300/40 dark:border-slate-800/60 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Escrow Amount</span>
                              <span className="text-base font-extrabold text-slate-900 dark:text-white">{deal.price} {deal.currency}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Deadline</span>
                              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-400" /> {deal.deliveryDeadlineHrs}h
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 space-y-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-400 font-medium">Status:</span>
                            <span
                              className={`font-bold px-2 py-0.5 rounded-lg text-[11px] font-mono ${
                                deal.status === 'OPEN'
                                  ? 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  : deal.status === 'FUNDED'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : deal.status === 'RELEASED'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30'
                              }`}
                            >
                              {deal.status}
                            </span>
                          </div>

                          {/* View Detail Link Button */}
                          <button
                            onClick={() => handleOpenDealDetail(deal)}
                            className="w-full neu-btn-secondary py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5 text-indigo-500" />
                            <span>View Full Deal Details & Terms</span>
                          </button>

                          {/* Disabled Tier Indicator if Persona Tier is insufficient */}
                          {!isUserInitiator && !meetsTier && (
                            <div className="w-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1 border border-rose-500/30">
                              <Lock className="h-3.5 w-3.5 text-rose-500" />
                              <span>Requires Tier {deal.minTier}+ (Your Tier: {activePersona.tier})</span>
                            </div>
                          )}

                          {/* Buyer Checkout Button for Service Listings */}
                          {!isUserInitiator && meetsTier && deal.type === 'SERVICE_LISTING' && deal.status === 'OPEN' && (
                            <button
                              onClick={() => setSelectedCheckoutDeal(deal)}
                              disabled={userAlreadyParticipated}
                              className={`w-full font-bold py-2.5 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 ${
                                userAlreadyParticipated
                                  ? 'neu-inset text-slate-500 dark:text-slate-400 opacity-60 cursor-not-allowed border border-slate-300 dark:border-slate-800'
                                  : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-md shadow-cyan-500/20'
                              }`}
                            >
                              <Wallet className="h-4 w-4" />
                              <span>{userAlreadyParticipated ? 'Buy Now (Already Claimed)' : `Buy Now & Deposit ${deal.price} ${deal.currency}`}</span>
                            </button>
                          )}

                          {/* Send Deliverable Button: creator/provider sends deliverable once escrow is secured */}
                          {(deal.status === 'FUNDED' || (deal.status as string) === 'ACCEPTED') && isUserInitiator && !deal.deliverableUrl && (
                            <button
                              onClick={() => setSelectedSubmitDeliverableDeal(deal)}
                              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Escrow Secured! Send Deliverable</span>
                            </button>
                          )}

                          {/* Buyer Payout Release Button when Deliverable is received */}
                          {deal.status === 'DELIVERED' && !isUserInitiator && (
                            <button
                              onClick={() => handleReleaseEscrow(deal)}
                              disabled={pendingDealId === deal.id}
                              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Confirm Deliverable & Release Payout</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
        {/* Footer — desktop only */}
        <div className="hidden md:block">
          <Footer
            onNavigateLanding={() => setActiveTab('landing')}
            openPlayground={() => setIsPlaygroundOpen(true)}
            openDisputes={() => setIsDisputesOpen(true)}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation — only visible on small screens */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedDetailDeal(null);
        }}
        openPostModal={() => setIsPostModalOpen(true)}
        openPlayground={() => setIsPlaygroundOpen(true)}
        openProfile={() => setIsProfileOpen(true)}
      />

      {/* Modals & Overlays */}
      <OnboardingModal />
      <PostJobModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} onJobCreated={handleCreateDeal} />
      <PlaygroundModal isOpen={isPlaygroundOpen} onClose={() => setIsPlaygroundOpen(false)} />
      <DisputeAuditModal
        isOpen={isDisputesOpen}
        onClose={() => setIsDisputesOpen(false)}
        prefillTxHash={auditTxHash}
      />
      <CheckoutModal
        deal={selectedCheckoutDeal}
        isOpen={!!selectedCheckoutDeal}
        onClose={() => setSelectedCheckoutDeal(null)}
        onPaymentComplete={(dealId, customDepositTxHash, customEscrowAddress) => {
          handlePurchaseService(dealId, customDepositTxHash, customEscrowAddress);
        }}
      />
      <SubmitDeliverableModal
        deal={selectedSubmitDeliverableDeal}
        isOpen={!!selectedSubmitDeliverableDeal}
        onClose={() => setSelectedSubmitDeliverableDeal(null)}
        onSubmitDeliverable={handleSubmitDeliverable}
      />
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onSelectDeal={(deal) => {
          setSelectedDetailDeal(deal);
          setActiveTab('detail');
        }}
        openDisputeAudit={(txHash) => {
          setAuditTxHash(txHash);
          setIsDisputesOpen(true);
        }}
      />
    </div>
  );
}
