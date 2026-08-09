import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Deal, DeliverableData } from '../types/deal';
import { INITIAL_DEALS } from '../data/mockDeals';
import { usePersona } from './PersonaContext';
import { fetchDealsForWallet } from '../lib/onChainDeals';

interface DealsContextType {
  deals: Deal[];
  activeDealList: Deal[];
  sharedApiDeals: Deal[];
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

const STATUS_RANK: Record<string, number> = {
  'OPEN': 1,
  'FUNDED': 2,
  'ACCEPTED': 3,
  'DELIVERED': 4,
  'RELEASED': 5,
  'COMPLETED': 5,
  'DISPUTED': 6,
  'REJECTED': 2,
  'REFUNDED': 6,
  'CANCELLED': 6,
};

function mergeDealObjects(d1: Deal, d2: Deal): Deal {
  const r1 = STATUS_RANK[d1.status] ?? 1;
  const r2 = STATUS_RANK[d2.status] ?? 1;

  const advanced = r2 >= r1 ? d2 : d1;
  const secondary = r2 >= r1 ? d1 : d2;

  return {
    ...secondary,
    ...advanced,
    escrowAddress: advanced.escrowAddress || secondary.escrowAddress,
    depositTxHash: advanced.depositTxHash || secondary.depositTxHash,
    attestationTxHash: advanced.attestationTxHash || secondary.attestationTxHash,
    releaseTxHash: advanced.releaseTxHash || secondary.releaseTxHash,
    deliverable: advanced.deliverable || secondary.deliverable,
    deliverableUrl: advanced.deliverableUrl || secondary.deliverableUrl,
    deliverableNotes: advanced.deliverableNotes || secondary.deliverableNotes,
    counterpartyAddress: advanced.counterpartyAddress || secondary.counterpartyAddress,
    counterpartyName: advanced.counterpartyName || secondary.counterpartyName,
    clientAddress: advanced.clientAddress || secondary.clientAddress,
    freelancerAddress: advanced.freelancerAddress || secondary.freelancerAddress,
    rejectionReason: advanced.rejectionReason || secondary.rejectionReason,
    rejectedAt: advanced.rejectedAt || secondary.rejectedAt,
  };
}

const STORAGE_KEY = 'vera_deals_v700_clean';
const DealsContext = createContext<DealsContextType | undefined>(undefined);

export const DealsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { activePersona, deductBalance, addBalance, appMode, prodWalletAddress } = usePersona();

  const [deals, setDeals] = useState<Deal[]>(() => {
    if (typeof window !== 'undefined') {
      try {
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
        setSharedApiDeals((prev) => {
          const map = new Map<string, Deal>();
          prev.forEach((d) => map.set(d.id, d));
          json.deals.forEach((d: Deal) => {
            const existing = map.get(d.id);
            map.set(d.id, existing ? mergeDealObjects(existing, d) : d);
          });
          return Array.from(map.values());
        });
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
    const interval = setInterval(refreshOnChainDeals, 2_000); // refresh every 2s for instant multi-device sync
    return () => clearInterval(interval);
  }, [refreshOnChainDeals]);

  // Merge deals: local deals + shared API registry deals (enriched by on-chain Monad status)
  const activeDealList = useMemo(() => {
    const combinedPoolMap = new Map<string, Deal>();

    // 1. Add shared API deals
    sharedApiDeals.forEach((d) => combinedPoolMap.set(d.id, d));

    // 2. Add local deals (merge with API using status rank hierarchy)
    deals.forEach((d) => {
      const existing = combinedPoolMap.get(d.id);
      if (existing) {
        combinedPoolMap.set(d.id, mergeDealObjects(existing, d));
      } else {
        combinedPoolMap.set(d.id, d);
      }
    });

    // 3. Enrich existing registered deals with live on-chain status from Monad Testnet
    const pool = Array.from(combinedPoolMap.values()).map((deal) => {
      if (!deal.escrowAddress || appMode !== 'production') return deal;
      const onChainMatch = onChainDeals.find(
        (oc) => oc.escrowAddress && oc.escrowAddress.toLowerCase() === deal.escrowAddress.toLowerCase()
      );
      if (!onChainMatch) return deal;
      return {
        ...deal,
        status: mergeDealObjects(deal, onChainMatch).status,
        statusLabel: onChainMatch.statusLabel,
        counterpartyAddress: onChainMatch.counterpartyAddress || deal.counterpartyAddress,
        counterpartyName: onChainMatch.counterpartyName || deal.counterpartyName,
        acceptedCount: onChainMatch.acceptedCount ?? deal.acceptedCount,
      };
    });

    return pool;
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

  const purchaseService = (
    originalDealId: string,
    rawBuyerWallet: string,
    rawBuyerName: string,
    customDepositTxHash?: string,
    customEscrowAddress?: string
  ): Deal | undefined => {
    const baseId = originalDealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    const parentDeal =
      activeDealList.find((d) => d.id === baseId || d.id === originalDealId) ||
      deals.find((d) => d.id === baseId || d.id === originalDealId) ||
      sharedApiDeals.find((d) => d.id === baseId || d.id === originalDealId);

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

    let updatedParentDeal: Deal | undefined;
    setDeals((prev) => {
      const parentInPrev = prev.find((d) => d.id === parentDeal.id || d.id === baseId);
      const updatedParent = parentInPrev
        ? {
            ...parentInPrev,
            escrowAddress: customEscrowAddress || parentInPrev.escrowAddress,
            quantity: newQty,
            acceptedCount: newAccepted,
            totalSlots: total,
            participantWallets: updatedWallets,
            clientAddress: parentInPrev.clientAddress || buyerWallet,
            freelancerAddress: parentInPrev.freelancerAddress || parentDeal.initiatorAddress,
            counterpartyAddress: buyerWallet,
            counterpartyName: buyerName,
            status: 'FUNDED' as const,
            depositTxHash: customDepositTxHash || parentInPrev.depositTxHash,
          }
        : {
            ...parentDeal,
            escrowAddress: customEscrowAddress || parentDeal.escrowAddress,
            quantity: newQty,
            acceptedCount: newAccepted,
            totalSlots: total,
            participantWallets: updatedWallets,
            clientAddress: buyerWallet,
            freelancerAddress: parentDeal.initiatorAddress,
            counterpartyAddress: buyerWallet,
            counterpartyName: buyerName,
            status: 'FUNDED' as const,
            depositTxHash: customDepositTxHash || parentDeal.depositTxHash,
          };

      updatedParentDeal = updatedParent;
      const filteredPrev = prev.filter((d) => d.id !== parentDeal.id && d.id !== baseId && d.id !== newOrder.id);
      return [newOrder, updatedParent, ...filteredPrev];
    });

    // POST the sub-order (deal-123-slot-1) to the server
    fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch(() => {});

    // POST the updated base deal (deal-123, status: FUNDED) so the SELLER's device polls and sees FUNDED too
    setTimeout(() => {
      if (updatedParentDeal) {
        fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedParentDeal),
        }).catch(() => {});
      }
    }, 100);

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

    fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAcceptedJob),
    }).catch(() => {});
  };

  const submitDeliverable = (dealId: string, deliverable: DeliverableData, customAttestationTxHash?: string) => {
    const baseId = dealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    const attestHash = customAttestationTxHash || deliverable.signature || (deliverable.payloadHash?.startsWith('0x') ? deliverable.payloadHash : undefined);

    const deliverableWithSender: DeliverableData = {
      ...deliverable,
      senderAddress: deliverable.senderAddress || activePersona.walletAddress,
    };

    // Find any buyer info from local state or shared server state
    const knownBuyerDeal =
      deals.find((d) => (d.id === dealId || d.id.startsWith(`${baseId}-`)) && d.counterpartyAddress && d.counterpartyAddress !== '0x0000000000000000000000000000000000000000') ||
      sharedApiDeals.find((d) => (d.id === dealId || d.id.startsWith(`${baseId}-`)) && d.counterpartyAddress && d.counterpartyAddress !== '0x0000000000000000000000000000000000000000');

    const makeDelivered = (d: Deal): Deal => {
      const initAddr = d.initiatorAddress.toLowerCase();
      const realBuyerWallet =
        (d.clientAddress && d.clientAddress.toLowerCase() !== initAddr ? d.clientAddress : undefined) ||
        (d.counterpartyAddress && d.counterpartyAddress.toLowerCase() !== initAddr ? d.counterpartyAddress : undefined) ||
        (knownBuyerDeal?.clientAddress && knownBuyerDeal.clientAddress.toLowerCase() !== initAddr ? knownBuyerDeal.clientAddress : undefined) ||
        (knownBuyerDeal?.counterpartyAddress && knownBuyerDeal.counterpartyAddress.toLowerCase() !== initAddr ? knownBuyerDeal.counterpartyAddress : undefined);

      const realBuyerName =
        (d.counterpartyName && !d.counterpartyName.toLowerCase().includes(d.initiatorName.toLowerCase().split(' ')[0]) ? d.counterpartyName : undefined) ||
        (knownBuyerDeal?.counterpartyName && !knownBuyerDeal.counterpartyName.toLowerCase().includes(d.initiatorName.toLowerCase().split(' ')[0]) ? knownBuyerDeal.counterpartyName : undefined);

      return {
        ...d,
        status: 'DELIVERED' as const,
        deliverable: deliverableWithSender,
        deliverableUrl: deliverableWithSender.url,
        deliverableNotes: deliverableWithSender.instructions,
        attestationTxHash: attestHash || d.attestationTxHash || (appMode === 'production' ? undefined : generateMockTxHash()),
        clientAddress: realBuyerWallet || (d.clientAddress !== initAddr ? d.clientAddress : undefined),
        counterpartyAddress: realBuyerWallet || (d.counterpartyAddress !== initAddr ? d.counterpartyAddress : undefined),
        counterpartyName: realBuyerName || d.counterpartyName,
        rejectionReason: undefined,
        rejectedAt: undefined,
      };
    };

    const updatedLocally: Deal[] = [];

    setDeals((prev) => {
      const updatedPrev = prev.map((d) => {
        const isMatch = d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`);
        if (isMatch) {
          const updated = makeDelivered(d);
          updatedLocally.push(updated);
          return updated;
        }
        return d;
      });

      const missingFromServer = sharedApiDeals.filter(
        (d) => (d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`)) &&
          !updatedPrev.some((u) => u.id === d.id)
      );

      const deliveredServerDeals = missingFromServer.map((d) => {
        const updated = makeDelivered(d);
        updatedLocally.push(updated);
        return updated;
      });

      return [...deliveredServerDeals, ...updatedPrev];
    });

    setTimeout(() => {
      updatedLocally.forEach((u) => {
        fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(u),
        }).catch(() => {});
      });

      // ─── GUARANTEE: Fetch the server directly and update ALL related deals ───
      // This catches buyer sub-orders (deal-123-slot-1) that the seller hasn't
      // polled into sharedApiDeals yet, ensuring the CLIENT always sees DELIVERED.
      fetch('/api/deals')
        .then((res) => res.json())
        .then((json) => {
          if (!json.success || !Array.isArray(json.deals)) return;
          const serverRelated: Deal[] = json.deals.filter(
            (d: Deal) =>
              (d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`)) &&
              d.status !== 'DELIVERED' &&
              !updatedLocally.find((u) => u.id === d.id)
          );
          serverRelated.forEach((d) => {
            const delivered = makeDelivered(d);
            fetch('/api/deals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(delivered),
            }).catch(() => {});
            // Also add to local sharedApiDeals so selector picks it up immediately
            setSharedApiDeals((prev) => {
              const map = new Map(prev.map((x) => [x.id, x]));
              map.set(delivered.id, delivered);
              return Array.from(map.values());
            });
          });
        })
        .catch(() => {});
    }, 50);
  };

  const rejectDeliverable = (dealId: string, reason: string) => {
    const baseId = dealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];
    const makeRejected = (d: Deal): Deal => ({ ...d, status: 'REJECTED' as const, rejectionReason: reason, rejectedAt: Date.now() });
    const updatedLocally: Deal[] = [];

    setDeals((prev) =>
      prev.map((d) => {
        const isMatch = d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`);
        if (isMatch) { const u = makeRejected(d); updatedLocally.push(u); return u; }
        return d;
      })
    );

    updatedLocally.forEach((u) => fetch('/api/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u) }).catch(() => {}));
    sharedApiDeals
      .filter((d) => (d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`)) && !updatedLocally.find((u) => u.id === d.id))
      .forEach((d) => fetch('/api/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(makeRejected(d)) }).catch(() => {}));
  };

  const updateDealStatus = (
    dealId: string,
    newStatus: Deal['status'],
    counterpartyName?: string,
    counterpartyWallet?: string,
    releaseTxHash?: string
  ) => {
    const baseId = dealId.split('-slot-')[0].split('-order-')[0].split('-accepted-')[0];

    const makeUpdated = (d: Deal): Deal => {
      const newReleaseHash = releaseTxHash || d.releaseTxHash || (newStatus === 'RELEASED' ? (appMode === 'production' ? undefined : generateMockTxHash()) : undefined);
      return {
        ...d,
        status: newStatus,
        counterpartyName: counterpartyName || d.counterpartyName,
        counterpartyAddress: counterpartyWallet || d.counterpartyAddress,
        releaseTxHash: newReleaseHash,
        autoTravelRuleGenerated: newStatus === 'RELEASED' ? true : d.autoTravelRuleGenerated,
      };
    };

    const updatedLocally: Deal[] = [];
    setDeals((prev) =>
      prev.map((d) => {
        const isMatch = d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`);
        if (!isMatch) return d;
        const u = makeUpdated(d);
        updatedLocally.push(u);
        return u;
      })
    );

    updatedLocally.forEach((u) => fetch('/api/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(u) }).catch(() => {}));
    sharedApiDeals
      .filter((d) => (d.id === dealId || d.id === baseId || d.id.startsWith(`${baseId}-`)) && !updatedLocally.find((u) => u.id === d.id))
      .forEach((d) => fetch('/api/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(makeUpdated(d)) }).catch(() => {}));
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
        activeDealList,
        sharedApiDeals,
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
