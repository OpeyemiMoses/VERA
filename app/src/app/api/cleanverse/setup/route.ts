import { NextRequest, NextResponse } from 'next/server';
import { CleanverseClient } from '../sdk/cleanverseClient';

const cleanverseClient = new CleanverseClient(
  process.env.CLEANVERSE_API_URL || 'https://api.cleanverse.com',
  process.env.CLEANVERSE_API_KEY || '',
  process.env.CLEANVERSE_SECRET_KEY
);

// POST /api/cleanverse/setup — register Validator Pool + set rules
export async function POST(req: NextRequest) {
  try {
    const { chain, ownerAddress, minTier, blockedCountries } = await req.json();

    // 1. Register the Vera validator pool
    const poolResult = await cleanverseClient.registerValidatorPool(
      chain || 'monad-testnet',
      ownerAddress || process.env.NEXT_PUBLIC_ATTESTOR_ADDRESS!,
      'Vera Compliance Pool'
    );

    // 2. Set tier + country rules
    const rulesResult = await cleanverseClient.setValidatorRules(
      chain || 'monad-testnet',
      poolResult?.data?.pool_address || process.env.NEXT_PUBLIC_FACTORY_ADDRESS!,
      minTier || 10,
      blockedCountries || ['RU', 'IR', 'KP']
    );

    return NextResponse.json({
      success: true,
      pool: poolResult,
      rules: rulesResult,
    });
  } catch (err: any) {
    console.error('[/api/cleanverse/setup] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
