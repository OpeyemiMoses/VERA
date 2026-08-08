import { NextRequest, NextResponse } from 'next/server';
import { CleanverseClient } from '../sdk/cleanverseClient';

const cleanverseClient = new CleanverseClient(
  process.env.CLEANVERSE_API_URL || 'https://api.cleanverse.com',
  process.env.CLEANVERSE_API_KEY || '',
  process.env.CLEANVERSE_SECRET_KEY
);

// Demo persona A-Pass configs
const DEMO_PERSONAS = [
  { address: '0x4070E534B84cC01e62a685c96d165dEedaC39f58', country: 'SG', tier: 25, name: 'Alice (Client)' },
  { address: '0x4070E534B84cC01e62a685c96d165dEedaC39f58', country: 'US', tier: 30, name: 'Bob (Verified Freelancer)' },
];

export async function POST(req: NextRequest) {
  try {
    const { address, country, tier } = await req.json();

    const result = await cleanverseClient.generateAPass(
      address,
      country || 'US',
      tier || 20
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/cleanverse/apass — seed all demo personas
export async function GET() {
  const results = [];
  for (const persona of DEMO_PERSONAS) {
    const res = await cleanverseClient.generateAPass(persona.address, persona.country, persona.tier);
    results.push({ persona: persona.name, result: res });
  }
  return NextResponse.json({ seeded: results });
}
