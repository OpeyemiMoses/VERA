# VERA PROTOCOL
### The Compliant On-Chain Escrow Primitive for Global Web3 Commerce

**Track:** Cleanverse Verified Finance Hackathon — DeFi & Infrastructure
**Network:** Monad Testnet (Chain ID 10143)
**Live dApp:** vera-escrow.vercel.app
**Repository:** github.com/OpeyemiMoses/VERA

---

## 1. The Opportunity

Independent, contract-based work is no longer a side economy — it is a mainstream labor model. Roughly 1.57 billion people now do freelance or independent work worldwide, close to half of the global workforce, and the freelance-platform market itself is valued at roughly $8–10 billion in 2026, on track to more than double by the early 2030s as enterprises increasingly route specialized, cross-border work through platform-mediated talent. A meaningful and fast-growing share of that work — smart contract audits, protocol engineering, tokenomics design, ZK development — is native to Web3, denominated in crypto, and settled peer-to-peer with no institutional intermediary at all.

That last point is the opportunity and the danger at once. On-chain commerce has no default trust layer, and the cost of that gap is now measurable at national scale: the FBI's IC3 recorded $11.4 billion in reported U.S. crypto fraud losses in 2025 alone, a 22% jump year-over-year, while Chainalysis puts global on-chain scam losses closer to $17 billion — and consumer-advocacy estimates that account for underreporting put the true figure several times higher. Every one of those dollars represents a transaction that had no compliant, trust-minimized settlement rail to run through. VERA is built to be that rail.

## 2. The Problem: A Three-Sided Dilemma

Today, a Web3 freelance or service transaction is forced to pick its poison:

- **DM-native deals invite counterparty fraud.** Most engagements still start in a Telegram or X DM. Sellers want payment up front because they have no recourse if a buyer disappears; buyers hesitate because they have no recourse if a seller never delivers. Both sides are negotiating blind.
- **Centralized escrow is slow, expensive, and custodial.** Legacy platforms charge 15–20% in fees, hold funds for days before release, can freeze accounts unilaterally, and require handing sensitive KYC documents to a centralized database that becomes a single point of failure and a breach target.
- **Anonymous on-chain escrow is a compliance time bomb.** A smart contract that locks funds with no identity layer at all is exactly the profile regulators are targeting. It exposes both counterparties to OFAC and sanctions liability, offers zero AML defensibility, and gives either party no recourse if the other is a bad actor operating from a prohibited jurisdiction.

No existing primitive resolves all three failure modes simultaneously — deals are either unsafe, uncompetitive, or non-compliant. VERA is designed to be all three solved at once: trust-minimized, cost-competitive, and provably compliant, without asking users to sacrifice the privacy Web3 was built on.

## 3. The Solution

VERA is a reusable, identity-gated escrow settlement layer deployed natively on Monad Testnet. Instead of a single escrow contract, VERA is infrastructure: any marketplace, DAO, or freelance platform can plug into it to originate compliant, shareable, on-chain deals in minutes.

- **Identity-Gated Smart Vaults** — every deal deploys as its own isolated `Escrow.sol` vault via `EscrowFactory.sol`, so one counterparty's dispute or default never touches another user's funds.
- **Cleanverse CVI Compliance Layer** — real-time sanctions and geofencing screening, zero-knowledge A-Pass identity verification, and a 0–100 risk-tier score computed off-chain, without ever exposing raw PII on-chain.
- **Cleanverse CVA On-Chain Attestation** — the cryptographic bridge from that off-chain check to the contract: once a wallet clears CVI, the Cleanverse Attestor signs an EIP-712 digest binding the escrow address, the user's wallet, and a deadline. `Escrow.sol` recovers the signer on-chain via ECDSA and requires an exact match against the registered attestor address before any state transition executes. Compliance isn't a UI checkbox here — it's a require() statement the funds cannot move past.
- **Shareable Deal Distribution** — every deal gets an instant 2×2 share suite (copy link, downloadable QR/SVG, WhatsApp and Telegram deep links), turning "send me your wallet address" into a single, trustworthy link.
- **FATF Travel Rule Exports** — one click generates an institutional-grade PDF with sender/receiver addresses, CVI scores, transaction hashes, and Monad block timestamps, giving both individual freelancers and platforms an audit trail they can hand to an accountant or a regulator without extra work.

## 4. The 5-Gate Escrow Lifecycle

Compliance is enforced at every touchpoint of a deal, not just at onboarding. A wallet that fails a check at any gate is blocked outright; funds already in the vault stay locked rather than being exposed.

| # | Touchpoint | Enforced Check | If Non-Compliant |
|---|---|---|---|
| 1 | Deal Creation | Screens creator wallet, enforces minimum CVI tier before vault deployment | Vault deployment aborted |
| 2 | Escrow Funding | Verifies buyer identity and sanctions status before cATKN deposit | Funding rejected |
| 3 | Job Acceptance | Verifies seller CVI tier; requires a valid CVA ECDSA signature | Acceptance rejected |
| 4 | Deliverable Submission | Verifies seller CVI status; registers seller on-chain (`setFreelancer`) | Submission rejected |
| 5 | Payout Release | Verifies buyer CVI status before `releaseTo(seller)` executes | Funds stay locked in vault |

## 5. Dynamic Trust-Adjusted Fee Engine

Rather than a flat platform cut, fees scale inversely with a participant's on-chain trust score — rewarding verified, high-completion-rate users and giving every user a direct, compounding incentive to build reputation on the protocol instead of starting a new anonymous wallet for every deal.

| Trust Tier | Score Range | Platform Fee |
|---|---|---|
| Low | 0–29 | 3.0% |
| Mid | 30–69 | 1.5% |
| High | 70–100 | 0.5% |

This single mechanic is what lets VERA undercut the 15–20% fees of centralized escrow incumbents while *increasing* the compliance guarantees a transaction carries — the opposite trade-off Web2 platforms force users to make today.

## 6. Product Surface

- **Public Service Marketplace** across six Web3-native categories (Smart Contract Audits, Full-Stack Web3/Frontend, DeFi & Yield Protocols, ZKP & Identity Security, Tokenomics & Governance, Web3 Design & Branding), with per-listing capacity — e.g. five audit slots — so claiming a slot deploys an isolated escrow and decrements availability automatically.
- **Private 1-on-1 Deals** that never touch the public marketplace, for counterparties who need commercial confidentiality but still want compliant settlement.
- **Full On-Chain Transparency** — every deal exposes its four milestone transactions (factory deployment, cATKN deposit, acceptance/attestation, payout release), each linked straight to the Monad block explorer, so any party — or auditor — can independently verify the entire lifecycle without trusting VERA's own UI.

## 7. Technical Architecture

| Contract | Role |
|---|---|
| `EscrowFactory.sol` | Deploys and indexes every isolated escrow vault created on Monad Testnet |
| `Escrow.sol` | Holds deposited cATKN, enforces the Funded → Accepted → Completed/Disputed state machine, verifies CVA ECDSA signatures on-chain before any transition |
| `MockAToken.sol` (cATKN) | ERC-20 settlement token with a built-in 10,000-token test faucet for judges and testers |

**Stack:** Solidity 0.8.20 + OpenZeppelin + Hardhat on the contract layer; Next.js 14 (App Router), React 18, and TypeScript on the frontend; Wagmi v2, Viem, and Ethers.js v6 for chain interaction; TailwindCSS with a neumorphic glass UI system; PDF-Lib/jsPDF for compliance-report generation.

## 8. Live Deployment (Verifiable Today)

| Resource | Address / Endpoint | Network |
|---|---|---|
| Live Web dApp | vera-escrow.vercel.app | Vercel (Production) |
| `EscrowFactory.sol` | `0xC06815e0...7Eee9334` | Monad Testnet |
| cATKN Token (MockAToken) | `0x505B3F7C...4467a91Ce03` | Monad Testnet |
| Cleanverse Attestor | `0x4070E534...96d165dEedaC39f58` | EIP-712 Signer |

This is not a mockup or a slide-deck concept — it is a working, funded, testable system on Monad Testnet today, with every claim above independently checkable on-chain by a judge in under five minutes.

## 9. Why VERA Fits the Cleanverse Brief

Most hackathon "compliance" integrations bolt a KYC widget onto an unrelated app. VERA does the opposite: compliance is the load-bearing wall of the product, not a feature flag. CVI and CVA aren't called once at signup — they gate every one of the five lifecycle transitions, meaning the *only* way funds move is through a path that has already been sanctions-screened and cryptographically attested. That is the difference between "we added Cleanverse" and "we could not function without Cleanverse" — and it is the standard we built to.

## 10. Roadmap

- **Near-term:** dispute-resolution module with arbitrator staking; mainnet deployment path; multi-token settlement beyond cATKN.
- **Mid-term:** SDK/API so third-party marketplaces and DAOs can white-label VERA's escrow + compliance layer instead of building their own.
- **Long-term:** cross-chain vault deployment so the same identity attestation travels with a user across every network VERA supports.
