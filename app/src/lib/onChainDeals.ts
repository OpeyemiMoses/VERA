'use client';
/**
 * onChainDeals.ts
 * Fetches live deal state from Monad Testnet by reading EscrowFactory + individual Escrow contracts.
 * Used in Production Mode only — Demo Mode uses mock deals from DealsContext.
 */

import { createPublicClient, http, type PublicClient, type Address } from 'viem';
import { FACTORY_ADDRESS, ESCROW_FACTORY_ABI, ESCROW_ABI, ESCROW_STATE_MAP, CATKN_ADDRESS } from './contracts';
import type { Deal } from '../types/deal';

const MONAD_CHAIN = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
};

export function getPublicClient(): PublicClient {
  return createPublicClient({
    chain: MONAD_CHAIN as any,
    transport: http('https://testnet-rpc.monad.xyz'),
  }) as unknown as PublicClient;
}

function escrowStateToStatus(stateNum: number): Deal['status'] {
  const map: Record<number, Deal['status']> = {
    0: 'OPEN',       // Created
    1: 'FUNDED',     // Funded on-chain
    2: 'ACCEPTED',   // Accepted by freelancer
    3: 'RELEASED',   // Released to freelancer
    4: 'CANCELLED',  // Cancelled
    5: 'DISPUTED',   // Disputed
    6: 'RELEASED',   // Resolved
  };
  return map[stateNum] ?? 'OPEN';
}

function escrowStateToLabel(stateNum: number): string {
  const map: Record<number, string> = {
    0: 'Awaiting Funding',
    1: 'Awaiting Acceptance',
    2: 'In Progress',
    3: 'Completed',
    4: 'Cancelled',
    5: 'In Dispute',
    6: 'Resolved',
  };
  return map[stateNum] ?? 'Unknown';
}

interface OnChainEscrowData {
  address: Address;
  client: Address;
  freelancer: Address;
  amount: bigint;
  state: number;
  token: Address;
}

async function readEscrowData(client: PublicClient, escrowAddress: Address): Promise<OnChainEscrowData | null> {
  try {
    const [clientAddr, freelancerAddr, amount, state, token] = await Promise.all([
      client.readContract({ address: escrowAddress, abi: ESCROW_ABI, functionName: 'client' }),
      client.readContract({ address: escrowAddress, abi: ESCROW_ABI, functionName: 'freelancer' }),
      client.readContract({ address: escrowAddress, abi: ESCROW_ABI, functionName: 'amount' }),
      client.readContract({ address: escrowAddress, abi: ESCROW_ABI, functionName: 'state' }),
      client.readContract({ address: escrowAddress, abi: ESCROW_ABI, functionName: 'token' }),
    ]);
    return {
      address: escrowAddress,
      client: clientAddr as Address,
      freelancer: freelancerAddr as Address,
      amount: amount as bigint,
      state: Number(state),
      token: token as Address,
    };
  } catch (err) {
    console.warn('[onChainDeals] Failed to read escrow', escrowAddress, err);
    return null;
  }
}

/**
 * Fetches all escrows from the factory and returns those where walletAddress
 * is either the client or freelancer, mapped to the app's Deal type.
 */
export async function fetchDealsForWallet(
  walletAddress: string,
  publicClient?: PublicClient
): Promise<Deal[]> {
  const client = publicClient ?? getPublicClient();
  const wallet = walletAddress.toLowerCase();

  let escrowAddresses: readonly Address[];
  try {
    escrowAddresses = (await client.readContract({
      address: FACTORY_ADDRESS,
      abi: ESCROW_FACTORY_ABI,
      functionName: 'getDeployedEscrows',
    })) as Address[];
  } catch (err) {
    console.error('[onChainDeals] Failed to fetch escrow list:', err);
    return [];
  }

  if (!escrowAddresses || escrowAddresses.length === 0) return [];

  // Read all escrows in parallel (batch of max 50 to avoid RPC timeout)
  const batchSize = 50;
  const allData: (OnChainEscrowData | null)[] = [];
  for (let i = 0; i < escrowAddresses.length; i += batchSize) {
    const batch = escrowAddresses.slice(i, i + batchSize);
    const results = await Promise.all(batch.map((addr) => readEscrowData(client, addr)));
    allData.push(...results);
  }

  const STALE_TEST_ESCROWS = [
    '0xfec955745dce6df08fc1ba3ddae1fa3c978071d1',
    '0x6438a4d46ce6db6642d99d3aa4e6015b67ab5a07',
  ];

  const deals: Deal[] = allData
    .filter((d): d is OnChainEscrowData => d !== null)
    .filter((d) => !STALE_TEST_ESCROWS.includes(d.address.toLowerCase()))
    // Include escrows where the connected wallet is client or assigned freelancer
    .filter((d) => {
      const isClient = d.client.toLowerCase() === wallet;
      const isFreelancer = d.freelancer !== '0x0000000000000000000000000000000000000000' && d.freelancer.toLowerCase() === wallet;
      return isClient || isFreelancer;
    })
    .map((d, idx): Deal => {
      const isCatkn = d.token.toLowerCase() === CATKN_ADDRESS.toLowerCase();
      const amountHuman = Number(d.amount) / 1e18;
      const isClient = d.client.toLowerCase() === wallet;
      const isUnclaimedJob = d.freelancer === '0x0000000000000000000000000000000000000000';

      return {
        id: `onchain-${d.address}`,
        type: isUnclaimedJob ? ('DIRECT_DEAL' as const) : ('SERVICE_LISTING' as const),
        escrowAddress: d.address,
        title: `Escrow ${d.address.slice(0, 6)}...${d.address.slice(-4)}`,
        description: `Live escrow contract on Monad Testnet`,
        category: 'DeFi Protocols',
        price: amountHuman,
        currency: (isCatkn ? 'cATKN' : 'MON') as 'cATKN' | 'MON',
        status: isUnclaimedJob && d.state <= 1 ? 'OPEN' : escrowStateToStatus(d.state),
        statusLabel: isUnclaimedJob && d.state <= 1 ? 'Awaiting Freelancer' : escrowStateToLabel(d.state),
        chain: 'monad' as const,
        initiatorAddress: d.freelancer !== '0x0000000000000000000000000000000000000000' ? d.freelancer : d.client,
        initiatorName: d.freelancer !== '0x0000000000000000000000000000000000000000'
          ? `${d.freelancer.slice(0, 6)}...${d.freelancer.slice(-4)}`
          : `${d.client.slice(0, 6)}...${d.client.slice(-4)}`,
        counterpartyAddress: d.client,
        counterpartyName: `${d.client.slice(0, 6)}...${d.client.slice(-4)}`,
        minTier: 0,
        deliveryTerms: 'On-chain delivery confirmation',
        refundTerms: 'Client may cancel before funding; dispute resolution after acceptance',
        deliveryDeadlineHrs: 168,
        confirmationWindowHrs: 48,
        quantity: 1,
        totalSlots: 1,
        acceptedCount: isUnclaimedJob ? 0 : 1,
        clientAddress: d.client,
        freelancerAddress: d.freelancer !== '0x0000000000000000000000000000000000000000' ? d.freelancer : undefined,
        onChainState: d.state,
        onChainStateLabel: ESCROW_STATE_MAP[d.state] ?? 'UNKNOWN',
        role: isClient ? 'CLIENT' : 'FREELANCER',
        createdAt: Date.now(),
        tags: ['On-Chain', isCatkn ? 'cATKN' : 'MON', ESCROW_STATE_MAP[d.state] ?? ''],
      };
    });

  return deals;
}
