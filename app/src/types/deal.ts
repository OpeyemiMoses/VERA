export type DealType = 'JOB_POSTING' | 'SERVICE_LISTING';
export type DealStatus = 'OPEN' | 'FUNDED' | 'ACCEPTED' | 'DELIVERED' | 'RELEASED' | 'COMPLETED' | 'REJECTED' | 'DISPUTED' | 'REFUNDED' | 'CANCELLED';
export type DeliverableFormat = 'URL' | 'FILE' | 'CREDENTIALS' | 'MULTI_ASSET';

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
  counterpartyAddress?: string; // Wallet address of acceptor/buyer
  counterpartyName?: string;    // Persona/Name of acceptor/buyer
  chain: 'monad';
  title: string;
  description: string;
  price: number;
  currency: 'cATKN' | 'MON';
  minTier: number;
  deliveryTerms: string;        // What counts as delivery
  refundTerms: string;          // When refunds apply
  deliveryDeadlineHrs: number;
  confirmationWindowHrs: number;
  quantity?: number;            // Remaining available slots
  totalSlots?: number;          // Total initial slots
  acceptedCount?: number;       // Number of slots accepted/paid
  expectedDeliverableFormat?: DeliverableFormat;
  category: string;
  status: DealStatus;
  escrowAddress: string;
  deliverable?: DeliverableData;
  rejectionReason?: string;     // Reason provided by buyer when requesting revisions
  rejectedAt?: number;          // Timestamp when deliverable was rejected
  deliverableUrl?: string;     // Legacy fallback
  deliverableNotes?: string;   // Legacy fallback
  participantWallets?: string[]; // Array of wallet addresses that have bought or accepted this deal
  slotNumber?: number;          // Slot index (#1, #2, #3...) for multi-slot sub-orders
  creationTxHash?: string;     // EVM Tx Hash for Escrow Smart Contract Deployment
  depositTxHash?: string;      // EVM Tx Hash for Buyer Escrow Deposit
  attestationTxHash?: string;  // EVM Tx Hash for Deliverable Attestation
  releaseTxHash?: string;      // EVM Tx Hash for On-Chain Payout Release
  createdAt: number;

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
