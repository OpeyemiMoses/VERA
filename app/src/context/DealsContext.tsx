import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

const STORAGE_KEY = 'vera_deals_v8';

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

  // On-chain deals for Production Mode
  const [onChainDeals, setOnChainDeals] = useState<Deal[]>([]);
  const [isFetchingOnChain, setIsFetchingOnChain] = useState(false);

  const refreshOnChainDeals = useCallback(async () => {
    if (appMode !== 'production' || !prodWalletAddress) return;
    setIsFetchingOnChain(true);
    try {
      const fetched = await fetchDealsForWallet(prodWalletAddress);
      setOnChainDeals(fetched);
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
      const interval = setInterval(refreshOnChainDeals, 10_000); // refresh every 10s
      return () => clearInterval(interval);
    }
  }, [appMode, prodWalletAddress, refreshOnChainDeals]);

  // In Production Mode, expose on-chain deals merged with any locally created ones
  const activeDealList = appMode === 'production'
    ? [...onChainDeals, ...deals.filter((d) => d.id.startsWith('prod-'))]
    : deals;

  useEffect(() => {
    if (typeof window !== 'undefined' && appMode !== 'production') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
      } catch (e) {
        console.error('Failed to save deals to localStorage:', e);
      }
    }
  }, [deals, appMode]);

  const createDeal = (newDeal: Deal) => {
    // Note: Balance deduction is handled directly in PostJobModal / CheckoutModal upon creation/purchase
    setDeals((prev) => [newDeal, ...prev]);
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
    const currentAccepted = parentDeal.acceptedCount !== undefined ? parentDeal.acceptedCount : (parentDeal.status !== 'OPEN' ? 1 : 0);
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

    // If freelancer matches job poster, auto-assign counterparty to opposite persona for demo flow
    if (freelancerWallet.toLowerCase() === parentJob.initiatorAddress.toLowerCase()) {
      const isAlice = parentJob.initiatorAddress.toLowerCase().includes('0x0b7e');
      freelancerWallet = isAlice ? '0x76A470f543373b596af06a52240EC779da5AEDb6' : '0x0b7E601E0c41B7Ac3Ce5177cb5c37A37B84a4d16';
      freelancerName = isAlice ? 'Bob (Verified Freelancer)' : 'Alice (Client)';
    }

    const total = parentJob.totalSlots || parentJob.quantity || 1;
    const currentAccepted = parentJob.acceptedCount !== undefined ? parentJob.acceptedCount : (parentJob.status !== 'OPEN' ? 1 : 0);
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
            status: newQty > 0 ? ('OPEN' as const) : ('FUNDED' as const),
            attestationTxHash: customAttestationTxHash || d.attestationTxHash,
          };
        }
        return d;
      }),
    ]);
  };

  const submitDeliverable = (dealId: string, deliverable: DeliverableData, customAttestationTxHash?: string) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
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
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === dealId) {
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
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id !== dealId) return d;
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
