'use client';
/**
 * useEscrowActions.ts
 * Wagmi-powered write hooks for all on-chain escrow actions in Production Mode.
 * Each hook wraps a single contract interaction with pending/confirmed/error state.
 */

import { useState, useCallback } from 'react';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi';
import { parseUnits } from 'viem';
import type { Address } from 'viem';
import {
  FACTORY_ADDRESS,
  CATKN_ADDRESS,
  ESCROW_FACTORY_ABI,
  ESCROW_ABI,
  CATKN_ABI,
  CATKN_DECIMALS,
} from '../lib/contracts';

// ─── Types ─────────────────────────────────────────────────────────────────
export interface TxState {
  isPending: boolean;
  isConfirmed: boolean;
  isError: boolean;
  error: string | null;
  txHash: string | null;
}

const INITIAL_TX: TxState = {
  isPending: false,
  isConfirmed: false,
  isError: false,
  error: null,
  txHash: null,
};

// ─── Helper: watch tx receipt ──────────────────────────────────────────────
function useTxReceipt(hash: string | undefined) {
  return useWaitForTransactionReceipt({
    hash: hash as `0x${string}` | undefined,
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 1. Claim on-chain Faucet (calls cATKN.faucet())
// ──────────────────────────────────────────────────────────────────────────
export function useClaimFaucet() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess: isConfirmed } = useTxReceipt(hash);

  const claim = useCallback(() => {
    writeContract({
      address: CATKN_ADDRESS,
      abi: CATKN_ABI,
      functionName: 'faucet',
    });
  }, [writeContract]);

  return {
    claim,
    isPending,
    isConfirmed,
    isError: !!error,
    error: error?.message ?? null,
    txHash: hash ?? null,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 2. Check faucet cooldown for a wallet
// ──────────────────────────────────────────────────────────────────────────
export function useFaucetCooldown(walletAddress: string | null) {
  const { data } = useReadContract({
    address: CATKN_ADDRESS,
    abi: CATKN_ABI,
    functionName: 'timeUntilNextClaim',
    args: [walletAddress as Address],
    query: { enabled: !!walletAddress },
  });
  return Number(data ?? 0); // seconds until next claim (0 = ready)
}

// ──────────────────────────────────────────────────────────────────────────
// 3. Read live cATKN balance
// ──────────────────────────────────────────────────────────────────────────
export function useCatknBalance(walletAddress: string | null) {
  const { data, refetch } = useReadContract({
    address: CATKN_ADDRESS,
    abi: CATKN_ABI,
    functionName: 'balanceOf',
    args: [walletAddress as Address],
    query: { enabled: !!walletAddress, refetchInterval: 8000 },
  });
  const balanceRaw = data as bigint | undefined;
  const balance = balanceRaw ? Number(balanceRaw) / 10 ** CATKN_DECIMALS : 0;
  return { balance, refetch };
}

// ──────────────────────────────────────────────────────────────────────────
// 4. Create Escrow — factory.createEscrow(token, amount)
// ──────────────────────────────────────────────────────────────────────────
export function useCreateEscrow() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess: isConfirmed } = useTxReceipt(hash);

  const createEscrow = useCallback(
    (amountHuman: number) => {
      const amount = parseUnits(amountHuman.toString(), CATKN_DECIMALS);
      writeContract({
        address: FACTORY_ADDRESS,
        abi: ESCROW_FACTORY_ABI,
        functionName: 'createEscrow',
        args: [CATKN_ADDRESS, amount],
      });
    },
    [writeContract]
  );

  return {
    createEscrow,
    isPending,
    isConfirmed,
    isError: !!error,
    error: error?.message ?? null,
    txHash: hash ?? null,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 5. Approve cATKN spend for an escrow
// ──────────────────────────────────────────────────────────────────────────
export function useApprove(escrowAddress: string | null) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess: isConfirmed } = useTxReceipt(hash);

  const approve = useCallback(
    (amountHuman: number) => {
      if (!escrowAddress) return;
      const amount = parseUnits(amountHuman.toString(), CATKN_DECIMALS);
      writeContract({
        address: CATKN_ADDRESS,
        abi: CATKN_ABI,
        functionName: 'approve',
        args: [escrowAddress as Address, amount],
      });
    },
    [writeContract, escrowAddress]
  );

  return {
    approve,
    isPending,
    isConfirmed,
    isError: !!error,
    error: error?.message ?? null,
    txHash: hash ?? null,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 6. Fund Escrow — escrow.fund()  (call AFTER approve is confirmed)
// ──────────────────────────────────────────────────────────────────────────
export function useFundEscrow(escrowAddress: string | null) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess: isConfirmed } = useTxReceipt(hash);

  const fund = useCallback(() => {
    if (!escrowAddress) return;
    writeContract({
      address: escrowAddress as Address,
      abi: ESCROW_ABI,
      functionName: 'fund',
    });
  }, [writeContract, escrowAddress]);

  return {
    fund,
    isPending,
    isConfirmed,
    isError: !!error,
    error: error?.message ?? null,
    txHash: hash ?? null,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 7. Accept Escrow (Freelancer) — fetches attestation then calls acceptWithAttestation
// ──────────────────────────────────────────────────────────────────────────
export function useAcceptEscrow(escrowAddress: string | null) {
  const { writeContract, data: hash, isPending: writePending, error: writeError } = useWriteContract();
  const { isSuccess: isConfirmed } = useTxReceipt(hash);
  const [fetchPending, setFetchPending] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const accept = useCallback(
    async (walletAddress: string) => {
      if (!escrowAddress) return;
      setFetchPending(true);
      setFetchError(null);
      try {
        const res = await fetch('/api/cleanverse/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: walletAddress,
            escrowAddress,
            chain: 'monad-testnet',
          }),
        });
        const data = await res.json();
        if (!data.allowed) throw new Error(data.reason ?? 'Compliance check failed');
        if (!data.attestation) throw new Error('No attestation returned from compliance server');

        const { signature, deadline } = data.attestation;
        writeContract({
          address: escrowAddress as Address,
          abi: ESCROW_ABI,
          functionName: 'acceptWithAttestation',
          args: [signature as `0x${string}`, BigInt(deadline)],
        });
      } catch (err: any) {
        setFetchError(err.message ?? 'Failed to fetch attestation');
      } finally {
        setFetchPending(false);
      }
    },
    [escrowAddress, writeContract]
  );

  return {
    accept,
    isPending: fetchPending || writePending,
    isConfirmed,
    isError: !!writeError || !!fetchError,
    error: writeError?.message ?? fetchError,
    txHash: hash ?? null,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 8. Release Payment (Client approves delivery) — escrow.release()
// ──────────────────────────────────────────────────────────────────────────
export function useReleasePayment(escrowAddress: string | null) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess: isConfirmed } = useTxReceipt(hash);

  const release = useCallback(() => {
    if (!escrowAddress) return;
    writeContract({
      address: escrowAddress as Address,
      abi: ESCROW_ABI,
      functionName: 'release',
    });
  }, [writeContract, escrowAddress]);

  return {
    release,
    isPending,
    isConfirmed,
    isError: !!error,
    error: error?.message ?? null,
    txHash: hash ?? null,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 9. Cancel Escrow (Client before funded) — escrow.cancel()
// ──────────────────────────────────────────────────────────────────────────
export function useCancelEscrow(escrowAddress: string | null) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess: isConfirmed } = useTxReceipt(hash);

  const cancel = useCallback(() => {
    if (!escrowAddress) return;
    writeContract({
      address: escrowAddress as Address,
      abi: ESCROW_ABI,
      functionName: 'cancel',
    });
  }, [writeContract, escrowAddress]);

  return {
    cancel,
    isPending,
    isConfirmed,
    isError: !!error,
    error: error?.message ?? null,
    txHash: hash ?? null,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// 10. Dispute Escrow — escrow.dispute()
// ──────────────────────────────────────────────────────────────────────────
export function useDisputeEscrow(escrowAddress: string | null) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isSuccess: isConfirmed } = useTxReceipt(hash);

  const dispute = useCallback(() => {
    if (!escrowAddress) return;
    writeContract({
      address: escrowAddress as Address,
      abi: ESCROW_ABI,
      functionName: 'dispute',
    });
  }, [writeContract, escrowAddress]);

  return {
    dispute,
    isPending,
    isConfirmed,
    isError: !!error,
    error: error?.message ?? null,
    txHash: hash ?? null,
  };
}
