import { NextRequest, NextResponse } from 'next/server';

interface RegisteredDeal {
  id: string;
  type: 'SERVICE_LISTING' | 'DIRECT_DEAL';
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

const CLOUD_STORAGE_OBJECT_ID = 'ff8081819f7e10ae019fe724f7fd1675';
const CLOUD_STORAGE_URL = `https://api.restful-api.dev/objects/${CLOUD_STORAGE_OBJECT_ID}`;

// In-memory cache fallback
let memoryDealsRegistry: RegisteredDeal[] = [];

async function fetchCloudDeals(): Promise<RegisteredDeal[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(CLOUD_STORAGE_URL, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json?.data?.deals && Array.isArray(json.data.deals)) {
        memoryDealsRegistry = json.data.deals;
        return json.data.deals;
      }
    }
  } catch (err) {
    console.warn('[API/DEALS] Cloud fetch fallback to memory:', err);
  }
  return memoryDealsRegistry;
}

async function saveCloudDeals(deals: RegisteredDeal[]): Promise<void> {
  memoryDealsRegistry = deals;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    await fetch(CLOUD_STORAGE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'vera_escrow_global_deals_registry_v1',
        data: { deals },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    console.warn('[API/DEALS] Cloud save error:', err);
  }
}

export async function GET() {
  const deals = await fetchCloudDeals();
  return NextResponse.json({ success: true, deals });
}

export async function POST(req: NextRequest) {
  try {
    const dealData: RegisteredDeal = await req.json();
    if (!dealData || !dealData.id) {
      return NextResponse.json({ error: 'Invalid deal data' }, { status: 400 });
    }

    const currentDeals = await fetchCloudDeals();
    const existingIdx = currentDeals.findIndex((d) => d.id === dealData.id);

    if (existingIdx >= 0) {
      currentDeals[existingIdx] = { ...currentDeals[existingIdx], ...dealData };
    } else {
      currentDeals.unshift(dealData);
    }

    await saveCloudDeals(currentDeals);

    return NextResponse.json({ success: true, count: currentDeals.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  await saveCloudDeals([]);
  return NextResponse.json({ success: true, message: 'All global deals cleared.' });
}
