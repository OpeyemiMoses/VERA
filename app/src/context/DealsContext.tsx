import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Deal, DeliverableData } from '../types/deal';
import { INITIAL_DEALS } from '../data/mockDeals';
import { usePersona } from './PersonaContext';
import { fetchDealsForWallet } from '../lib/onChainDeals';

interface DealsContextType {
  deals: Deal[];
  createDeal: (newDeal: Deal) => void;
  purchaseService: (originalDealId: string, buyerWallet: string, buyerName: string, customDepositTxHash?: string, customEscrowAddress?: string) => Deal | undefined;
  acceptJob: (dealId: string, freelancerWallet: string, freelancerName: string, attestationTxHash?: string) => void;
  submitDeliverable: (dealId: string, deliverable: DeliverableData, attestationTxHash?: string) => void;
  rejectDeliverable: (dealId: string, reason: string) => void;
  updateDealStatus: (dealId: string, newStatus: Deal['status'], counterpartyName?: string, counterpartyWallet?: string, releaseTxHash?: string) => void;
  resetDeals: () => void;
  refreshOnChainDeals: () => Promise<void>;
  isFetchingOnChain: boolean;
}

const STORAGE_KEY = 'vera_deals_v500_fresh';

const DealsContext = createContext<DealsContextType | undefined>(undefined);

export const DealsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { deductBalance, addBalance, appMode, prodWalletAddress } = usePersona();

  const [deals, setDeals] = useState<Deal[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('vera_deals_v50');
        localStorage.removeItem('vera_deals_v40');
        localStorage.removeItem('vera_deals_v30');
        localStorage.removeItem('vera_deals_v20');
        fetch('/api/deals', { method: 'DELETE' }).catch(() => {});
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.error('Failed to load deals from localStorage:', e);
      }
    }
    return [];
  });

  // On-chain & Shared API deals for Production Mode
  const [onChainDeals, setOnChainDeals] = useState<Deal[]>([]);
  const [sharedApiDeals, setSharedApiDeals] = useState<Deal[]>([]);
  const [isFetchingOnChain, setIsFetchingOnChain] = useState(false);

  const refreshOnChainDeals = useCallback(async () => {
    try {
      // 1. Fetch shared deal metadata from global server API registry
      const res = await fetch('/api/deals');
      const json = await res.json();
      if (json.success && Array.isArray(json.deals)) {
        setSharedApiDeals(json.deals);
      }

      // 2. Fetch on-chain escrows from Monad Testnet RPC if in production mode
      const activeWallet = prodWalletAddress || (typeof window !== 'undefined' ? (window as any).ethereum?.selectedAddress : null);
      if (appMode === 'production' && activeWallet) {
        setIsFetchingOnChain(true);
        const fetchedOnChain = await fetchDealsForWallet(activeWallet);
        setOnChainDeals(fetchedOnChain);
      }
    } catch (err) {
      console.error('[DealsContext] Failed to fetch deals:', err);
    } finally {
      setIsFetchingOnChain(false);
    }
  }, [appMode, prodWalletAddress]);

  // Fetch deals on mount + whenever wallet or mode changes
  useEffect(() => {
    refreshOnChainDeals();
    const interval = setInterval(refreshOnChainDeals, 5_000); // refresh every 5s for fast multi-wallet sync
    return () => clearInterval(interval);
  }, [refreshOnChainDeals]);

  // Merge deals: local deals + shared API registry deals + on-chain Monad escrows
  const activeDealList = useMemo(() => {
    const combinedPoolMap = new Map<string, Deal>();
    const w = prodWalletAddress?.toLowerCase() ?? '';

    // 1. Add shared API deals
    sharedApiDeals.forEach((d) => combinedPoolMap.set(d.id, d));

    // 2. Add local deals (overrides API defaults if updated locally)
    deals.forEach((d) => combinedPoolMap.set(d.id, d));

    // 3. Add raw on-chain deals in Production Mode
    if (appMode === 'production') {
      onChainDeals.forEach((oc) => {
        const existingKey = Array.from(combinedPoolMap.keys()).find((k) => {
          const item = combinedPoolMap.get(k);
          return item?.escrowAddress && oc.escrowAddress && item.escrowAddress.toLowerCase() === oc.escrowAddress.toLowerCase();
        });
        if (!existingKey) {
          combinedPoolMap.set(oc.id, oc);
        }
      });
    }

    const pool = Array.from(combinedPoolMap.values()).map((deal) => {
      if (!deal.escrowAddress || appMode !== 'production') return deal;
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

    return pool;
  }, [deals, sharedApiDeals, onChainDeals, appMode, prodWalletAddress]);

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

  const purchaseService = (
    originalDealId: string,
    rawBuyerWallet: string,
    rawBuyerName: string,
    customDepositTxHash?: string,
    customEscrowAddress?: string
  ): Deal | undefined => {
    const baseId = originalDealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    const parentDeal = deals.find((d) => d.id === baseId || d.id === originalDealId);
    if (!parentDeal) return undefined;

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
      escrowAddress: customEscrowAddress || parentDeal.escrowAddress,
      quantity: 0,
      acceptedCount: newAccepted,
      totalSlots: total,
      participantWallets: Array.from(new Set([parentDeal.initiatorAddress, buyerWallet])),
      clientAddress: buyerWallet,
      freelancerAddress: parentDeal.initiatorAddress,
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
            escrowAddress: customEscrowAddress || d.escrowAddress,
            quantity: newQty,
            acceptedCount: newAccepted,
            totalSlots: total,
            participantWallets: updatedWallets,
            clientAddress: d.clientAddress || buyerWallet,
            freelancerAddress: d.freelancerAddress || parentDeal.initiatorAddress,
            counterpartyAddress: d.counterpartyAddress || buyerWallet,
            counterpartyName: d.counterpartyName || buyerName,
            status: 'FUNDED' as const,
            depositTxHash: customDepositTxHash || d.depositTxHash,
          };
        }
        return d;
      }),
    ]);

    fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch(() => {});

    return newOrder;
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
    let updatedObj: Deal | undefined;
    setDeals((prev) =>
      prev.map((d) => {
        const isMatch = d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`);
        if (isMatch) {
          const updated = {
            ...d,
            status: 'DELIVERED' as const,
            deliverable,
            deliverableUrl: deliverable.url,
            deliverableNotes: deliverable.instructions,
            attestationTxHash: customAttestationTxHash || deliverable.signature || (deliverable.payloadHash?.startsWith('0x') ? deliverable.payloadHash : undefined) || d.attestationTxHash || (appMode === 'production' ? undefined : generateMockTxHash()),
            rejectionReason: undefined,
            rejectedAt: undefined,
          };
          updatedObj = updated;
          return updated;
        }
        return d;
      })
    );

    if (updatedObj) {
      fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedObj),
      }).catch(() => {});
    }
  };

  const rejectDeliverable = (dealId: string, reason: string) => {
    const baseId = dealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    let updatedObj: Deal | undefined;
    setDeals((prev) =>
      prev.map((d) => {
        const isMatch = d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`);
        if (isMatch) {
          const updated = {
            ...d,
            status: 'REJECTED' as const,
            rejectionReason: reason,
            rejectedAt: Date.now(),
          };
          updatedObj = updated;
          return updated;
        }
        return d;
      })
    );

    if (updatedObj) {
      fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedObj),
      }).catch(() => {});
    }
  };

  const updateDealStatus = (
    dealId: string,
    newStatus: Deal['status'],
    counterpartyName?: string,
    counterpartyWallet?: string,
    releaseTxHash?: string
  ) => {
    const baseId = dealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    let updatedObj: Deal | undefined;
    setDeals((prev) =>
      prev.map((d) => {
        const isMatch = d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`);
        if (!isMatch) return d;
        const newReleaseHash = releaseTxHash || d.releaseTxHash || (newStatus === 'RELEASED' ? (appMode === 'production' ? undefined : generateMockTxHash()) : undefined);
        const updated = {
          ...d,
          status: newStatus,
          counterpartyName: counterpartyName || d.counterpartyName,
          counterpartyAddress: counterpartyWallet || d.counterpartyAddress,
          releaseTxHash: newReleaseHash,
          autoTravelRuleGenerated: newStatus === 'RELEASED' ? true : d.autoTravelRuleGenerated,
        };
        updatedObj = updated;
        return updated;
      })
    );

    if (updatedObj) {
      fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedObj),
      }).catch(() => {});
    }
  };

  const resetDeals = () => {
    setDeals([]);
    setOnChainDeals([]);
    setSharedApiDeals([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      fetch('/api/deals', { method: 'DELETE' }).catch(() => {});
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
