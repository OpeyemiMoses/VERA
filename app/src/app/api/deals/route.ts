import { NextRequest, NextResponse } from 'next/server';

interface RegisteredDeal {
  id: string;
  type: 'SERVICE_LISTING' | 'JOB_POSTING';
  title: string;
  description: string;
  category: string;
  price: number;
  currency: 'cATKN' | 'MON';
  status: string;
  escrowAddress?: string;
  initiatorAddress: string;
  initiatorName: string;
  minTier: number;
  deliveryTerms: string;
  refundTerms: string;
  quantity?: number;
  totalSlots?: number;
  acceptedCount?: number;
  createdAt: number;
  [key: string]: any;
}

// Global server memory store for deals created across wallets/devices
const globalDealsRegistry: RegisteredDeal[] = [];

export async function GET() {
  return NextResponse.json({ success: true, deals: globalDealsRegistry });
}

export async function POST(req: NextRequest) {
  try {
    const dealData: RegisteredDeal = await req.json();
    if (!dealData || !dealData.id) {
      return NextResponse.json({ error: 'Invalid deal data' }, { status: 400 });
    }

    const existingIdx = globalDealsRegistry.findIndex((d) => d.id === dealData.id || (d.escrowAddress && d.escrowAddress.toLowerCase() === dealData.escrowAddress?.toLowerCase()));
    if (existingIdx >= 0) {
      globalDealsRegistry[existingIdx] = { ...globalDealsRegistry[existingIdx], ...dealData };
    } else {
      globalDealsRegistry.unshift(dealData);
    }

    return NextResponse.json({ success: true, count: globalDealsRegistry.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
