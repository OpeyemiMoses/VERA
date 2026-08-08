import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Deal, DeliverableData } from '../types/deal';
import { INITIAL_DEALS } from '../data/mockDeals';
import { usePersona } from './PersonaContext';
import { fetchDealsForWallet } from '../lib/onChainDeals';

interface DealsContextType {
  deals: Deal[];
  createDeal: (newDeal: Deal) => void;
  purchaseService: (originalDealId: string, buyerWallet: string, buyerName: string, customDepositTxHash?: string) => void;
  acceptJob: (dealId: string, freelancerWallet: string, freelancerName: string, attestationTxHash?: string) => void;
  submitDeliverable: (dealId: string, deliverable: DeliverableData, attestationTxHash?: string) => void;
  rejectDeliverable: (dealId: string, reason: string) => void;
  updateDealStatus: (dealId: string, newStatus: Deal['status'], counterpartyName?: string, counterpartyWallet?: string, releaseTxHash?: string) => void;
  resetDeals: () => void;
  refreshOnChainDeals: () => Promise<void>;
  isFetchingOnChain: boolean;
}

const STORAGE_KEY = 'vera_deals_v10';

const DealsContext = createContext<DealsContextType | undefined>(undefined);

export const DealsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { deductBalance, addBalance, appMode, prodWalletAddress } = usePersona();

  const [deals, setDeals] = useState<Deal[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('vera_deals_v1');
        localStorage.removeItem('vera_deals_v2');
        localStorage.removeItem('vera_deals_v3');
        localStorage.removeItem('vera_deals_v4');
        localStorage.removeItem('vera_deals_v5');
        localStorage.removeItem('vera_deals_v6');
        localStorage.removeItem('vera_deals_v7');
        localStorage.removeItem('vera_deals_v8');
        localStorage.removeItem('vera_deals_v9');

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to load deals from localStorage:', e);
      }
    }
    return INITIAL_DEALS;
  });

  // On-chain & Shared API deals for Production Mode
  const [onChainDeals, setOnChainDeals] = useState<Deal[]>([]);
  const [sharedApiDeals, setSharedApiDeals] = useState<Deal[]>([]);
  const [isFetchingOnChain, setIsFetchingOnChain] = useState(false);

  const refreshOnChainDeals = useCallback(async () => {
    if (appMode !== 'production' || !prodWalletAddress) return;
    setIsFetchingOnChain(true);
    try {
      // 1. Fetch on-chain escrows from Monad Testnet RPC
      const fetchedOnChain = await fetchDealsForWallet(prodWalletAddress);
      setOnChainDeals(fetchedOnChain);

      // 2. Fetch shared deal metadata from global server API registry
      const res = await fetch('/api/deals');
      const json = await res.json();
      if (json.success && Array.isArray(json.deals)) {
        setSharedApiDeals(json.deals);
      }
    } catch (err) {
      console.error('[DealsContext] Failed to fetch on-chain deals:', err);
    } finally {
      setIsFetchingOnChain(false);
    }
  }, [appMode, prodWalletAddress]);

  // Fetch on-chain deals on mount + whenever wallet or mode changes
  useEffect(() => {
    if (appMode === 'production' && prodWalletAddress) {
      refreshOnChainDeals();
      const interval = setInterval(refreshOnChainDeals, 5_000); // refresh every 5s for fast multi-wallet sync
      return () => clearInterval(interval);
    }
  }, [appMode, prodWalletAddress, refreshOnChainDeals]);

  // In Production Mode, merge: local deals + shared API registry deals + on-chain Monad escrows
  const activeDealList = useMemo(() => {
    if (appMode !== 'production') return deals;

    const combinedPoolMap = new Map<string, Deal>();

    const w = prodWalletAddress?.toLowerCase() ?? '';

    // 1. Add shared API deals — only those where the wallet is a participant, OR open/funded job postings with no freelancer yet
    sharedApiDeals
      .filter((d) => {
        const isInitiator = d.initiatorAddress?.toLowerCase() === w;
        const isCounterparty = d.counterpartyAddress?.toLowerCase() === w;
        const isParticipant = d.participantWallets?.some((pw: string) => pw.toLowerCase() === w);
        const isOpenJob = d.type === 'JOB_POSTING' && (d.status === 'OPEN' || d.status === 'FUNDED') && !d.counterpartyAddress;
        return isInitiator || isCounterparty || isParticipant || isOpenJob;
      })
      .forEach((d) => combinedPoolMap.set(d.id, d));
    // 2. Add local deals (overrides if local is fresher)
    deals.forEach((d) => combinedPoolMap.set(d.id, d));
    // 3. Add raw on-chain deals if not already in pool
    onChainDeals.forEach((oc) => {
      const existingKey = Array.from(combinedPoolMap.keys()).find((k) => {
        const item = combinedPoolMap.get(k);
        return item?.escrowAddress && oc.escrowAddress && item.escrowAddress.toLowerCase() === oc.escrowAddress.toLowerCase();
      });
      if (!existingKey) {
        combinedPoolMap.set(oc.id, oc);
      }
    });

    const pool = Array.from(combinedPoolMap.values());

    // Merge real on-chain statuses from Monad Testnet into all pool deals
    return pool.map((deal) => {
      if (!deal.escrowAddress) return deal;
      const onChainMatch = onChainDeals.find(
        (oc) => oc.escrowAddress && oc.escrowAddress.toLowerCase() === deal.escrowAddress.toLowerCase()
      );
      if (!onChainMatch) return deal;
      return {
        ...deal,
        status: onChainMatch.status,
        statusLabel: onChainMatch.statusLabel,
        counterpartyAddress: onChainMatch.counterpartyAddress || deal.counterpartyAddress,
        counterpartyName: onChainMatch.counterpartyName || deal.counterpartyName,
        acceptedCount: onChainMatch.acceptedCount ?? deal.acceptedCount,
      };
    });
  }, [deals, sharedApiDeals, onChainDeals, appMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
      } catch (e) {
        console.error('Failed to save deals to localStorage:', e);
      }
    }
  }, [deals]);

  const createDeal = (newDeal: Deal) => {
    // Note: Balance deduction is handled directly in PostJobModal / CheckoutModal upon creation/purchase
    setDeals((prev) => [newDeal, ...prev]);

    // Sync with global server API registry so 2nd wallet on another device can read it
    if (typeof window !== 'undefined') {
      fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeal),
      }).catch((err) => console.warn('[DealsContext] Failed to sync deal to global registry:', err));
    }
  };

  const generateMockTxHash = () =>
    '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const purchaseService = (originalDealId: string, rawBuyerWallet: string, rawBuyerName: string, customDepositTxHash?: string) => {
    const baseId = originalDealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    const parentDeal = deals.find((d) => d.id === baseId || d.id === originalDealId);
    if (!parentDeal) return;

    let buyerWallet = rawBuyerWallet;
    let buyerName = rawBuyerName;

    // If buyer matches creator, auto-assign counterparty to opposite persona for demo flow
    if (buyerWallet.toLowerCase() === parentDeal.initiatorAddress.toLowerCase()) {
      const isBob = parentDeal.initiatorAddress.toLowerCase().includes('0x76a4');
      buyerWallet = isBob ? '0x0b7E601E0c41B7Ac3Ce5177cb5c37A37B84a4d16' : '0x76A470f543373b596af06a52240EC779da5AEDb6';
      buyerName = isBob ? 'Alice (Client)' : 'Bob (Verified Freelancer)';
    }

    const total = parentDeal.totalSlots || parentDeal.quantity || 1;
    const currentAccepted = parentDeal.acceptedCount !== undefined ? parentDeal.acceptedCount : ((parentDeal.status !== 'OPEN' && parentDeal.status !== 'FUNDED') ? 1 : 0);
    const newAccepted = currentAccepted + 1;
    const newQty = Math.max(0, total - newAccepted);
    const updatedWallets = Array.from(new Set([...(parentDeal.participantWallets || []), buyerWallet]));

    const newOrder: Deal = {
      ...parentDeal,
      id: `${baseId}-slot-${newAccepted}`,
      slotNumber: newAccepted,
      status: 'FUNDED',
      quantity: newQty,
      acceptedCount: newAccepted,
      totalSlots: total,
      participantWallets: Array.from(new Set([parentDeal.initiatorAddress, buyerWallet])),
      counterpartyAddress: buyerWallet,
      counterpartyName: buyerName,
      creationTxHash: parentDeal.creationTxHash,
      depositTxHash: customDepositTxHash || parentDeal.depositTxHash || (appMode === 'production' ? undefined : generateMockTxHash()),
      createdAt: Date.now(),
      deliverable: undefined,
      deliverableUrl: undefined,
      deliverableNotes: undefined,
      attestationTxHash: undefined,
      releaseTxHash: undefined,
      rejectionReason: undefined,
      rejectedAt: undefined,
    };

    setDeals((prev) => [
      newOrder,
      ...prev.map((d) => {
        if (d.id === parentDeal.id) {
          return {
            ...d,
            quantity: newQty,
            acceptedCount: newAccepted,
            totalSlots: total,
            participantWallets: updatedWallets,
            counterpartyAddress: d.counterpartyAddress || buyerWallet,
            counterpartyName: d.counterpartyName || buyerName,
            status: newQty > 0 ? ('OPEN' as const) : ('FUNDED' as const),
            depositTxHash: customDepositTxHash || d.depositTxHash,
          };
        }
        return d;
      }),
    ]);
  };

  const acceptJob = (dealId: string, rawFreelancerWallet: string, rawFreelancerName: string, customAttestationTxHash?: string) => {
    const baseId = dealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    const parentJob = deals.find((d) => d.id === baseId || d.id === dealId);
    if (!parentJob) return;

    let freelancerWallet = rawFreelancerWallet;
    let freelancerName = rawFreelancerName;

    // In sandbox mode only: if freelancer matches job poster, auto-assign counterparty to opposite persona for demo flow
    if (appMode !== 'production' && freelancerWallet.toLowerCase() === parentJob.initiatorAddress.toLowerCase()) {
      const isAlice = parentJob.initiatorAddress.toLowerCase().includes('0x0b7e');
      freelancerWallet = isAlice ? '0x76A470f543373b596af06a52240EC779da5AEDb6' : '0x0b7E601E0c41B7Ac3Ce5177cb5c37A37B84a4d16';
      freelancerName = isAlice ? 'Bob (Verified Freelancer)' : 'Alice (Client)';
    }

    const total = parentJob.totalSlots || parentJob.quantity || 1;
    const currentAccepted = parentJob.acceptedCount !== undefined ? parentJob.acceptedCount : ((parentJob.status !== 'OPEN' && parentJob.status !== 'FUNDED') ? 1 : 0);
    const newAccepted = currentAccepted + 1;
    const newQty = Math.max(0, total - newAccepted);
    const updatedWallets = Array.from(new Set([...(parentJob.participantWallets || []), freelancerWallet]));

    const newAcceptedJob: Deal = {
      ...parentJob,
      id: `${baseId}-slot-${newAccepted}`,
      slotNumber: newAccepted,
      status: 'FUNDED',
      quantity: newQty,
      acceptedCount: newAccepted,
      totalSlots: total,
      participantWallets: Array.from(new Set([parentJob.initiatorAddress, freelancerWallet])),
      counterpartyAddress: freelancerWallet,
      counterpartyName: freelancerName,
      creationTxHash: parentJob.creationTxHash,
      depositTxHash: parentJob.depositTxHash,
      attestationTxHash: customAttestationTxHash || parentJob.attestationTxHash || (appMode === 'production' ? undefined : generateMockTxHash()),
      createdAt: Date.now(),
      deliverable: undefined,
      deliverableUrl: undefined,
      deliverableNotes: undefined,
      releaseTxHash: undefined,
      rejectionReason: undefined,
      rejectedAt: undefined,
    };

    setDeals((prev) => [
      newAcceptedJob,
      ...prev.map((d) => {
        if (d.id === parentJob.id) {
          return {
            ...d,
            quantity: newQty,
            acceptedCount: newAccepted,
            totalSlots: total,
            participantWallets: updatedWallets,
            counterpartyAddress: d.counterpartyAddress || freelancerWallet,
            counterpartyName: d.counterpartyName || freelancerName,
            status: newQty > 0 ? ('OPEN' as const) : ('FUNDED' as const),
            attestationTxHash: customAttestationTxHash || d.attestationTxHash,
          };
        }
        return d;
      }),
    ]);
  };

  const submitDeliverable = (dealId: string, deliverable: DeliverableData, customAttestationTxHash?: string) => {
    const baseId = dealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    setDeals((prev) =>
      prev.map((d) => {
        const isMatch = d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`);
        if (isMatch) {
          return {
            ...d,
            status: 'DELIVERED' as const,
            deliverable,
            deliverableUrl: deliverable.url,
            deliverableNotes: deliverable.instructions,
            attestationTxHash: customAttestationTxHash || d.attestationTxHash || (appMode === 'production' ? undefined : generateMockTxHash()),
            rejectionReason: undefined,
            rejectedAt: undefined,
          };
        }
        return d;
      })
    );
  };

  const rejectDeliverable = (dealId: string, reason: string) => {
    const baseId = dealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    setDeals((prev) =>
      prev.map((d) => {
        const isMatch = d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`);
        if (isMatch) {
          return {
            ...d,
            status: 'REJECTED' as const,
            rejectionReason: reason,
            rejectedAt: Date.now(),
          };
        }
        return d;
      })
    );
  };

  const updateDealStatus = (
    dealId: string,
    newStatus: Deal['status'],
    counterpartyName?: string,
    counterpartyWallet?: string,
    releaseTxHash?: string
  ) => {
    const baseId = dealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    setDeals((prev) =>
      prev.map((d) => {
        const isMatch = d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`);
        if (!isMatch) return d;
        const newReleaseHash = releaseTxHash || d.releaseTxHash || (newStatus === 'RELEASED' ? (appMode === 'production' ? undefined : generateMockTxHash()) : undefined);
        return {
          ...d,
          status: newStatus,
          counterpartyName: counterpartyName || d.counterpartyName,
          counterpartyAddress: counterpartyWallet || d.counterpartyAddress,
          releaseTxHash: newReleaseHash,
          autoTravelRuleGenerated: newStatus === 'RELEASED' ? true : d.autoTravelRuleGenerated,
        };
      })
    );
  };

  const resetDeals = () => {
    setDeals(INITIAL_DEALS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <DealsContext.Provider
      value={{
        deals: activeDealList,
        createDeal,
        purchaseService,
        acceptJob,
        submitDeliverable,
        rejectDeliverable,
        updateDealStatus,
        resetDeals,
        refreshOnChainDeals,
        isFetchingOnChain,
      }}
    >
      {children}
    </DealsContext.Provider>
  );
};

export const useDeals = () => {
  const context = useContext(DealsContext);
  if (!context) {
    throw new Error('useDeals must be used within a DealsProvider');
  }
  return context;
};
