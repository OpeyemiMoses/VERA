import { NextRequest, NextResponse } from 'next/server';
import { CleanverseClient } from '../sdk/cleanverseClient';
import { ComplianceAttestorService } from '../sdk/attestor';

const cleanverseClient = new CleanverseClient(
  process.env.CLEANVERSE_API_URL || 'https://api.cleanverse.com',
  process.env.CLEANVERSE_API_KEY || '',
  process.env.CLEANVERSE_SECRET_KEY
);

const attestor = new ComplianceAttestorService(
  process.env.ATTESTOR_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001'
);

export async function POST(req: NextRequest) {
  try {
    const { userAddress, escrowAddress, poolAddress, chain, minTier } = await req.json();

    if (!userAddress) {
      return NextResponse.json({ error: 'userAddress is required' }, { status: 400 });
    }

    // 1. Real Cleanverse /validator/verify
    const verifyResult = await cleanverseClient.verifyParticipant({
      chain: chain || 'monad-testnet',
      poolAddress: poolAddress || process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '',
      userAddress,
    });

    if (!verifyResult.valid) {
      return NextResponse.json({
        allowed: false,
        reason: verifyResult.reason || 'Cleanverse compliance check failed',
        code: verifyResult.code,
      });
    }

    // Optional min tier enforcement
    if (minTier && verifyResult.tier !== undefined && verifyResult.tier < minTier) {
      return NextResponse.json({
        allowed: false,
        reason: `A-Pass Tier (${verifyResult.tier}) is below required minimum (${minTier})`,
      });
    }

    // 2. Issue real ECDSA compliance attestation if escrow address provided
    let attestation = null;
    if (escrowAddress) {
      const sig = await attestor.signAttestation(escrowAddress, userAddress, 300);
      attestation = {
        signature: sig.signature,
        deadline: sig.deadline,
        messageHash: sig.messageHash,
      };
    }

    return NextResponse.json({
      allowed: true,
      reason: `Cleanverse A-Pass verified: Tier ${verifyResult.tier} (${verifyResult.country || 'Unknown'})`,
      tier: verifyResult.tier,
      country: verifyResult.country,
      attestation,
    });
  } catch (err: any) {
    console.error('[/api/cleanverse/verify] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
