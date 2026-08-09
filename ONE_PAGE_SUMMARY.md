# VERA PROTOCOL
### *The Compliant On-Chain Escrow Primitive for Global Web3 Commerce*

**Track:** Cleanverse Verified Finance Hackathon — DeFi & Infrastructure Track
**Network:** Monad Testnet (Chain ID 10143)
**Live dApp:** vera-escrow.vercel.app
**Repository:** github.com/OpeyemiMoses/VERA

---

## Executive Summary

VERA Protocol is a reusable, identity-gated, compliant Web3 escrow settlement layer built natively on Monad Testnet. It gives buyers, sellers, freelancers, and Web3 agencies a way to structure, fund, and settle high-value transactions trustlessly on-chain, backed by real-time compliance screening, zero-knowledge identity gating, and cryptographic attestation proofs.

By combining the fast execution of Monad Testnet, the zero-knowledge identity and sanctions layer of Cleanverse CVI (Verification Infrastructure), and on-chain ECDSA attestation validation via Cleanverse CVA (Verification Attestation), VERA makes Web3 commerce as simple as sharing a payment link — while keeping every transaction compliant behind the scenes.

---

## The Problem

Global freelancing, software auditing, and peer-to-peer Web3 commerce represent a multi-billion dollar economy. Yet transactions conducted today face a persistent three-sided dilemma:

- **DM Insecurity & Counterparty Fraud** — most Web3 deals begin in direct messages on Telegram, WhatsApp, or Twitter/X. Sellers want payment upfront; buyers fear non-delivery or an exit scam.
- **The Cost & Friction of Web2 Escrow** — centralized platforms charge steep fees (15–20%), take days to settle payouts, impose arbitrary account freezes, and require centralized-database KYC.
- **The Regulatory Risk of Anonymous Web3 Escrow** — purely anonymous smart contract escrows expose participants to OFAC sanctions and AML liability, with zero identity recourse if something goes wrong.

---

## The Solution

VERA resolves this trilemma with a frictionless, compliant, and shareable escrow layer:

- **Identity-Gated Smart Vaults** — escrows deploy as isolated smart contract vaults on Monad Testnet (`Escrow.sol`).
- **Cleanverse CVI Compliance** — real-time sanctions geofencing, zero-knowledge A-Pass verification, and risk-tier rating before any funds move.
- **Cleanverse CVA Attestations** — ECDSA signatures verified directly inside Monad smart contracts before any state transition.
- **Shareable Payment Suite** — a 2×2 share card for instant deal distribution via URL, QR code, WhatsApp, or Telegram.
- **FATF Travel Rule Exports** — one-click PDF generation providing immutable proof of payment and compliance timestamps.

---

## How Compliance Works: CVI & CVA

### Cleanverse Verification Infrastructure (CVI)

CVI handles off-chain identity verification and risk assessment. It validates user credentials using zero-knowledge proofs to preserve Web3 privacy, screens counterparty wallets against OFAC, EU, and custom prohibited-country lists, and assigns each wallet a compliance tier from 0–100 that determines deal limits, collateral requirements, and fee discounts.

### Cleanverse Verification Attestation (CVA)

CVA is the cryptographic bridge between that off-chain identity check and the on-chain contract. Once a wallet passes CVI verification, the Cleanverse Attestor wallet signs a cryptographic digest binding the escrow address, the user's wallet, and a deadline. The `Escrow.sol` contract then recovers the signer from that signature on-chain and requires it to match the registered compliance attestor before allowing the state transition to proceed — meaning compliance is enforced at the contract level, not just in the UI.

---

## The 5-Gate Escrow Lifecycle

VERA enforces five mandatory compliance gates across the full lifecycle of a deal — from creation through payout. Any wallet that fails a check at any gate is blocked, and funds already deposited remain safely locked in the vault.

| # | Touchpoint | Enforced Check | If Non-Compliant |
|---|---|---|---|
| 1 | **Deal Creation** | Screens creator wallet; enforces minimum tier before deploying the Escrow Vault. | Vault deployment aborted |
| 2 | **Escrow Funding** | Verifies buyer identity and sanctions status before cATKN deposit. | Funding rejected |
| 3 | **Job Acceptance** | Verifies seller CVI tier; requires a valid CVA ECDSA signature. | Acceptance rejected |
| 4 | **Deliverable Submission** | Verifies seller CVI status; registers seller on-chain (`setFreelancer`). | Submission rejected |
| 5 | **Payout Release** | Verifies buyer CVI status before `releaseTo(seller)` executes. | Funds stay locked in vault |

---

## Dynamic Trust-Adjusted Fee Engine

Platform fees scale automatically with a participant's trust score (0–100), rewarding verified, high-completion-rate users with lower fees:

| Trust Tier | Score Range | Platform Fee |
|---|---|---|
| Low | 0 – 29 | 3.0% |
| Mid | 30 – 69 | 1.5% |
| High | 70 – 100 | 0.5% |

---

## Key Features & Capabilities

**1. Public Service Marketplace**
Creators list fixed-price services across six Web3 categories — Smart Contract Audits, Full-Stack Web3 & Frontend, DeFi & Yield Protocols, ZKP & Identity Security, Tokenomics & Governance, and Web3 Design & Branding. Each listing sets a service capacity (e.g. five audit slots); claiming a slot deploys an isolated escrow contract and tracks remaining availability.

**2. Private 1-on-1 Deals & Social Share Suite**
Custom bilateral deals stay unlisted from the public marketplace for commercial privacy, and share instantly via a 2×2 suite: copy link, a scannable QR code with SVG download, and direct WhatsApp or Telegram share buttons.

**3. Transparent On-Chain Verification**
Every escrow logs four milestone transactions, each linked to the Monad Testnet block explorer: the factory deployment, the cATKN deposit, the acceptance/attestation transaction, and the final payout release.

**4. FATF Travel Rule PDF Exporter**
Generates institutional-grade compliance reports containing sender/receiver wallet addresses, CVI verification scores, cryptographic transaction hashes, and Monad block timestamps — ready for corporate accounting.

---

## Monad Testnet Smart Contracts

- **`EscrowFactory.sol`** — factory contract that deploys isolated `Escrow.sol` vaults and tracks every escrow created on Monad Testnet.
- **`Escrow.sol`** — individual vault holding deposited cATKN tokens, enforcing state transitions (Funded, Accepted, Completed, Disputed), and verifying Cleanverse CVA signatures.
- **`MockAToken.sol` (cATKN)** — the ERC-20 compliance token used for funding and settlement, with a built-in 10,000-token test faucet.

---

## Live Production Deployments

| Resource | Address / Endpoint | Network |
|---|---|---|
| Live Web dApp | vera-escrow.vercel.app | Vercel (Production) |
| `EscrowFactory.sol` | `0xC06815e0...7Eee9334` | Monad Testnet |
| cATKN Token (MockAToken) | `0x505B3F7C...4467a91Ce03` | Monad Testnet |
| Cleanverse Attestor | `0x4070E534...96d165dEedaC39f58` | EIP-712 Signer |

---

## Technology Stack

- **Blockchain & Network** — Monad Testnet (Chain ID 10143)
- **Smart Contracts** — Solidity 0.8.20, OpenZeppelin Contracts, Hardhat
- **Frontend** — Next.js 14 (App Router), React 18, TypeScript
- **Web3 Integration** — Wagmi v2, Viem, Ethers.js v6, ConnectKit / RainbowKit
- **Styling & UI** — TailwindCSS with a neumorphic glass design system, Lucide Icons
- **PDF Generation** — PDF-Lib / jsPDF for the FATF Travel Rule report exporter

---

## Why It Matters

VERA Protocol turns three unresolved frictions in Web3 commerce — counterparty risk, expensive centralized escrow, and unregulated anonymous settlement — into a single compliant primitive. Built on Monad for speed and Cleanverse for identity, it lets any DAO, marketplace, or freelance platform integrate compliant, shareable escrow today, without trading away speed or privacy.