/**
 * contracts.ts
 * Single source of truth for all on-chain constants and ABIs used in Production Mode.
 */

// ─── Deployed addresses (Monad Testnet — Chain 10143) ──────────────────────
export const FACTORY_ADDRESS  = '0xF01Da8383e5949DB1BccDeC278975f002Cfc0fe1' as const;
export const CATKN_ADDRESS    = '0x5A7a2f264E6618d61Bd03a586C2F816fEe521Ea8' as const;
export const MONAD_CHAIN_ID   = 10143;
export const CATKN_DECIMALS   = 18;
export const FAUCET_AMOUNT_CATKN = 10_000; // human-readable units

// ─── EscrowFactory ABI ─────────────────────────────────────────────────────
export const ESCROW_FACTORY_ABI = [
  {
    type: 'event',
    name: 'EscrowCreated',
    inputs: [
      { indexed: true,  name: 'escrowAddress', type: 'address' },
      { indexed: true,  name: 'client',        type: 'address' },
      { indexed: true,  name: 'token',         type: 'address' },
      { indexed: false, name: 'amount',        type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'createEscrow',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token',  type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'escrowAddress', type: 'address' }],
  },
  {
    type: 'function',
    name: 'getDeployedEscrows',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'getDeployedEscrowsCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'deployedEscrows',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'complianceAttestor',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

// ─── Escrow ABI ────────────────────────────────────────────────────────────
export const ESCROW_ABI = [
  // Events
  { type: 'event', name: 'EscrowFunded',    inputs: [{ indexed: true,  name: 'client',      type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }] },
  { type: 'event', name: 'EscrowAccepted',  inputs: [{ indexed: true,  name: 'freelancer',  type: 'address' }] },
  { type: 'event', name: 'EscrowReleased',  inputs: [{ indexed: true,  name: 'freelancer',  type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }] },
  { type: 'event', name: 'EscrowCancelled', inputs: [] },
  { type: 'event', name: 'EscrowDisputed',  inputs: [{ indexed: true,  name: 'triggeredBy', type: 'address' }] },
  { type: 'event', name: 'EscrowResolved',  inputs: [{ indexed: true,  name: 'winner',      type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }] },
  // View functions
  { type: 'function', name: 'client',              stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'freelancer',           stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'amount',               stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint256' }] },
  { type: 'function', name: 'token',                stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  { type: 'function', name: 'state',                stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8'   }] },
  { type: 'function', name: 'complianceAttestor',   stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
  // Write functions
  {
    type: 'function', name: 'fund',
    stateMutability: 'nonpayable', inputs: [], outputs: [],
  },
  {
    type: 'function', name: 'setFreelancer',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_freelancer', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function', name: 'acceptWithAttestation',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'signature', type: 'bytes' }, { name: 'deadline', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'release',
    stateMutability: 'nonpayable', inputs: [], outputs: [],
  },
  {
    type: 'function', name: 'releaseTo',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_freelancer', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function', name: 'cancel',
    stateMutability: 'nonpayable', inputs: [], outputs: [],
  },
  {
    type: 'function', name: 'dispute',
    stateMutability: 'nonpayable', inputs: [], outputs: [],
  },
  {
    type: 'function', name: 'resolve',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'winner', type: 'address' }],
    outputs: [],
  },
] as const;

// ─── ERC-20 ABI (minimal — balanceOf, approve, allowance) ──────────────────
export const ERC20_ABI = [
  {
    type: 'function', name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function', name: 'allowance',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

// ─── MockAToken (cATKN) extended ABI — includes public faucet ──────────────
export const CATKN_ABI = [
  ...ERC20_ABI,
  {
    type: 'function', name: 'faucet',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function', name: 'timeUntilNextClaim',
    stateMutability: 'view',
    inputs: [{ name: 'wallet', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'lastFaucetClaim',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'event', name: 'FaucetClaimed',
    inputs: [{ indexed: true, name: 'recipient', type: 'address' }, { indexed: false, name: 'amount', type: 'uint256' }],
  },
] as const;

// ─── On-chain Escrow state enum mapping ────────────────────────────────────
export const ESCROW_STATE_MAP: Record<number, string> = {
  0: 'CREATED',
  1: 'FUNDED',
  2: 'ACCEPTED',
  3: 'COMPLETED',
  4: 'DISPUTED',
  5: 'RESOLVED',
  6: 'CANCELLED',
};
