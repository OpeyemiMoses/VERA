'use client';

import { useState, useCallback } from 'react';

export interface ComplianceResult {
  allowed: boolean;
  reason: string;
  tier?: number;
  country?: string;
  attestation?: {
    signature: string;
    deadline: number;
    messageHash: string;
  };
}

export const PERSONA_KEYS: Record<string, string> = {
  alice: '0xb553cb10a16d0ce4a890cf2611922db0b572fd91ea4b11a56735f179b4b53516',
  bob: '0xb553cb10a16d0ce4a890cf2611922db0b572fd91ea4b11a56735f179b4b53516',
  charlie: '0xb553cb10a16d0ce4a890cf2611922db0b572fd91ea4b11a56735f179b4b53516',
  vlad: '0xb553cb10a16d0ce4a890cf2611922db0b572fd91ea4b11a56735f179b4b53516',
};

export function useCleanverse() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<ComplianceResult | null>(null);

  /**
   * Real Cleanverse /validator/verify call via Next.js API route (server-side SDK)
   */
  const checkCompliance = useCallback(async (
    userAddress: string,
    escrowAddress: string,
    poolAddress: string,
    chain: string,
    minTier?: number,
    prohibitedCountries?: string[]
  ): Promise<ComplianceResult> => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/cleanverse/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress,
          escrowAddress,
          poolAddress,
          chain,
          minTier,
          prohibitedCountries,
        }),
      });

      const data = await res.json();
      const result: ComplianceResult = {
        allowed: data.allowed ?? false,
        reason: data.reason || data.error || 'Unknown compliance result',
        tier: data.tier,
        country: data.country,
        attestation: data.attestation,
      };
      setLastResult(result);
      return result;
    } catch (err: any) {
      const result: ComplianceResult = {
        allowed: false,
        reason: `Network error: ${err.message}`,
      };
      setLastResult(result);
      return result;
    } finally {
      setIsChecking(false);
    }
  }, []);

  /**
   * Real Cleanverse /download_travel_rule via API route → triggers PDF download
   */
  const downloadTravelRuleReport = useCallback(async (txHash: string, chain: string = 'monad-testnet') => {
    const res = await fetch('/api/cleanverse/travel-rule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash, chain }),
    });

    if (!res.ok) {
      throw new Error('Failed to fetch Travel Rule report');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vera_TravelRule_${txHash.slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Generate A-Pass for a wallet address via real Cleanverse /generate_apass
   */
  const generateAPass = useCallback(async (
    address: string,
    country: string,
    tier: number
  ) => {
    const res = await fetch('/api/cleanverse/apass', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, country, tier }),
    });
    return res.json();
  }, []);

  return {
    isChecking,
    lastResult,
    checkCompliance,
    downloadTravelRuleReport,
    generateAPass,
  };
}
