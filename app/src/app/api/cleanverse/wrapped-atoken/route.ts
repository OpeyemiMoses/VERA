import { NextRequest, NextResponse } from 'next/server';
import { CleanverseClient } from '../sdk/cleanverseClient';

const cleanverseClient = new CleanverseClient(
  process.env.CLEANVERSE_API_URL || 'https://api.cleanverse.com',
  process.env.CLEANVERSE_API_KEY || '',
  process.env.CLEANVERSE_SECRET_KEY
);

// POST /api/cleanverse/wrapped-atoken
// Action: "launch" | "authorize_mint" | "whitelist_institutional"
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'launch') {
      const { name, symbol, underlyingAsset, chain } = body;
      const result = await cleanverseClient.launchWrappedAToken(
        name || 'Wrapped Cleanverse A-Token',
        symbol || 'wcATKN',
        underlyingAsset || '0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03',
        chain || 'monad-testnet'
      );
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'authorize_mint') {
      const { atokenAddress, minterAddress } = body;
      const result = await cleanverseClient.authorizeMint(atokenAddress, minterAddress);
      return NextResponse.json({ success: true, data: result });
    }

    if (action === 'whitelist_institutional') {
      const { userAddress, depositAddress, chain } = body;
      const result = await cleanverseClient.addWhitelistForInstitutional(userAddress, depositAddress, chain || 'monad-testnet');
      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ error: 'Invalid action. Expected "launch", "authorize_mint", or "whitelist_institutional"' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
