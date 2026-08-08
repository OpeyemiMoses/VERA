export type DealType = 'DIRECT_DEAL' | 'SERVICE_LISTING';
export type DealStatus = 'OPEN' | 'FUNDED' | 'ACCEPTED' | 'DELIVERED' | 'RELEASED' | 'COMPLETED' | 'REJECTED' | 'DISPUTED' | 'REFUNDED' | 'CANCELLED';
export type DeliverableFormat = 'URL' | 'FILE' | 'CREDENTIALS' | 'MULTI_ASSET';

export const MARKETPLACE_CATEGORIES = [
  'All',
  'Smart Contract Audits',
  'Full-Stack Web3 & Frontend',
  'DeFi & Yield Protocols',
  'ZKP & Identity Security',
  'Tokenomics & Governance',
  'Web3 Design & Branding',
] as const;

export interface DeliverableData {
  format: DeliverableFormat;
  url?: string;
  previewUrl?: string;          // Watermarked preview or sandbox demo URL for pre-release inspection
  imageUrl?: string;            // Exact uploaded image DataURL or URL for watermarked visual inspection
  fileContent?: string;         // Exact raw text/code content for code files (.ts, .sol, .json, .txt, .md)
  fileKind?: 'IMAGE' | 'CODE' | 'PDF' | 'ARCHIVE' | 'UNSUPPORTED';
  payloadHash?: string;         // SHA-256 cryptographic attestation hash of raw secret payload
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  textCredentials?: string;
  instructions?: string;
  submittedAt: number;
}

export interface Deal {
  id: string;
  type: DealType;
  initiatorAddress: string;     // Wallet address of creator
  initiatorName: string;        // Persona/Name of creator
  counterpartyAddress?: string; // Wallet address of counterparty (assigned upon link acceptance/funding)
  counterpartyName?: string;    // Persona/Name of counterparty
  chain: 'monad';
  title: string;
  description: string;
  price: number;
  currency: 'cATKN' | 'MON';
  minTier: number;
  prohibitedCountries?: string[]; // Array of excluded ISO country codes (e.g. ['RU', 'CN', 'US'])
  allowedRegions?: string[];      // Array of allowed whitelisted country codes
  deliveryTerms: string;        // What counts as delivery
  refundTerms: string;          // When refunds apply
  deliveryDeadlineHrs: number;
  confirmationWindowHrs: number;
  expectedDeliverableFormat?: DeliverableFormat;
  category: string;
  status: DealStatus;
  escrowAddress: string;
  deliverable?: DeliverableData;
  rejectionReason?: string;     // Reason provided by buyer when requesting revisions
  rejectedAt?: number;          // Timestamp when deliverable was rejected
  deliverableUrl?: string;     // Legacy fallback
  deliverableNotes?: string;   // Legacy fallback
  participantWallets?: string[]; // Array of wallet addresses that participate in this deal
  creationTxHash?: string;     // EVM Tx Hash for Escrow Smart Contract Deployment
  depositTxHash?: string;      // EVM Tx Hash for Buyer Escrow Deposit
  attestationTxHash?: string;  // EVM Tx Hash for Deliverable Attestation
  releaseTxHash?: string;      // EVM Tx Hash for On-Chain Payout Release
  createdAt: number;
  shareableLink?: string;       // Direct shareable deal link URL

  // Service Capacity (for Service Listings)
  serviceCapacity?: number;     // Max number of times this service can be rendered to clients (e.g. 5)
  purchasedCount?: number;      // Number of times purchased so far

  // Sub-order tracking
  quantity?: number;
  totalSlots?: number;
  acceptedCount?: number;
  slotNumber?: number;

  // Trust-Adjusted Escrow Terms Engine fields
  trustScoreAtCreation?: number; // 0-100 Trust Score at time of deal creation/acceptance
  requiredCollateral?: number;   // Good-faith deposit (cATKN/MON) required from freelancer
  platformFeePct?: number;       // Platform fee rate (3.0%, 1.5%, 0.5%, 0.25%)
  autoTravelRuleGenerated?: boolean; // True if Travel Rule report auto-routed on payout release

  // On-chain specific fields (Production Mode)
  onChainState?: number;          // Raw state enum from contract (0-6)
  onChainStateLabel?: string;     // Human-readable state label
  statusLabel?: string;           // Display label for current status
  role?: 'CLIENT' | 'FREELANCER'; // Wallet's role in this escrow
  clientAddress?: string;         // Client wallet address (from on-chain)
  freelancerAddress?: string;     // Freelancer wallet address (from on-chain, if set)
  tags?: string[];                // Category/display tags
}
