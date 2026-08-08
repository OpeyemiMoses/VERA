import { Persona } from '../context/PersonaContext';

export interface TrustScoreDetails {
  score: number;
  tierLevel: 'Low' | 'Mid' | 'High' | 'Elite';
  collateralPct: number;      // 15%, 5%, 0%
  releaseWindowHrs: number;   // 72h, 48h, 24h, 12h
  feePct: number;             // 3.0%, 1.5%, 0.5%, 0.25%
  reason: string;
}

export const calculateTrustScore = (
  persona?: Persona | null,
  completedDeals: number = 0,
  disputeRate: number = 0
): TrustScoreDetails => {
  if (!persona || !persona.isVerified) {
    return {
      score: 0,
      tierLevel: 'Low',
      collateralPct: 0,
      releaseWindowHrs: 72,
      feePct: 3.0,
      reason: 'Identity Unverified (No Cleanverse A-Pass) · Maximum Security Terms Enforced',
    };
  }

  // Base score from Cleanverse A-Pass Verification Tier (70% weight)
  const tier = persona.tier || 0;
  let cleanverseScore = 0;

  if (tier >= 50) {
    cleanverseScore = 70; // Institutional / VASP / Bank Clearance
  } else if (tier >= 40) {
    cleanverseScore = 65; // Enterprise / DAO Treasury / Auditor (e.g. Diana, Zara)
  } else if (tier >= 30) {
    cleanverseScore = 60; // Professional / Senior Developer (e.g. Bob, Marcus)
  } else if (tier >= 20) {
    cleanverseScore = 50; // Standard Verified Retail (e.g. Alice)
  } else if (tier >= 10) {
    cleanverseScore = 30; // Basic Self-Certified Identity
  } else {
    cleanverseScore = 10;
  }

  // Platform history score (30% weight) — rewards repeat successful deals
  const historyScore = Math.min(30, Math.max(0, completedDeals * 5 - disputeRate * 15));

  const totalScore = Math.min(100, Math.max(0, cleanverseScore + historyScore));

  if (totalScore < 30) {
    return {
      score: totalScore,
      tierLevel: 'Low',
      collateralPct: 0,
      releaseWindowHrs: 72,
      feePct: 3.0,
      reason: `Trust Score ${totalScore}/100 (Tier ${persona.tier}) · Standard 72h Hold`,
    };
  } else if (totalScore < 70) {
    return {
      score: totalScore,
      tierLevel: 'Mid',
      collateralPct: 0,
      releaseWindowHrs: 48,
      feePct: 1.5,
      reason: `Trust Score ${totalScore}/100 (Tier ${persona.tier}) · Standard 48h Hold`,
    };
  } else if (totalScore < 90) {
    return {
      score: totalScore,
      tierLevel: 'High',
      collateralPct: 0,
      releaseWindowHrs: 24,
      feePct: 0.5,
      reason: `Trust Score ${totalScore}/100 (Tier ${persona.tier}) · 24h Fast-Track Payout`,
    };
  } else {
    return {
      score: totalScore,
      tierLevel: 'Elite',
      collateralPct: 0,
      releaseWindowHrs: 12,
      feePct: 0.25,
      reason: `Trust Score ${totalScore}/100 (Tier ${persona.tier} · Elite) · 12h Express Settlement`,
    };
  }
};
