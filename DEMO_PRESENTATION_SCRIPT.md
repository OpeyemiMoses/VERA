# Vera Protocol — Complete Production Web3 Live Presentation & Demo Script

> **Cleanverse Verified Finance Hackathon — DeFi & Infrastructure Track**  
> **Project:** Vera Protocol (Shareable Compliant On-Chain Escrow Protocol & Identity-Gated Settlement Infrastructure)  
> **Network:** Monad Testnet (`Chain ID 10143`)  
> **Operating Mode:** 100% Production Web3 Execution (Real Monad Contracts & Wallets)  
> **Target Duration:** ~15 Minutes (Comprehensive End-to-End Build Walkthrough)

---

## Presentation Overview & Outline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SECTION 1: Executive Vision & Production Monad Architecture  (0:00 - 1:30)   │
│ SECTION 2: On-Chain Web3 Wallet Connect & cATKN Faucet      (1:30 - 3:00)   │
│ SECTION 3: Public Service Marketplace & 6 Web3 Categories   (3:00 - 5:00)   │
│ SECTION 4: Private 1-on-1 Escrows & 2x2 Social Share Suite  (5:00 - 7:00)   │
│ SECTION 5: Cleanverse A-Pass Gating, OFAC & EIP-712 Signing (7:00 - 9:00)   │
│ SECTION 6: Vera Vault ZK Deliverable Inspection & Secrets   (9:00 - 10:30)  │
│ SECTION 7: Dynamic Trust-Adjusted Platform Fee Release      (10:30 - 12:30) │
│ SECTION 8: FATF Travel Rule PDF Reports & EVM Audit Ledger  (12:30 - 14:30) │
│ SECTION 9: Closing Summary & Production Hackathon Alignment (14:30 - 15:00) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 1: Executive Vision & Production Monad Architecture (0:00 - 1:30)

### On-Screen Action:
- Open `http://localhost:3005` in the browser showing the production application.
- Display the architecture overview from `ONE_PAGE_SUMMARY.md` or Monad Explorer tabs:
  - `EscrowFactory.sol`: `0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334`
  - `cATKN (MockAToken.sol)`: `0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03`

### Speaker Voiceover:
> *"Hello judges, mentor team, and Cleanverse community! Today, I’m thrilled to present **Vera Protocol** — an identity-gated, shareable on-chain escrow settlement protocol built natively for **Monad Testnet (`Chain ID 10143`)** and powered by Cleanverse CVI and CVA asset primitives.*
>
> *"Vera Protocol operates as an institutional settlement primitive for Web3 commerce. In Web3 freelancing and commercial OTC transactions, deals are arranged in DMs — Telegram, WhatsApp, Discord, or X. Clients hire auditors, DAOs pay contributors, and teams purchase Web3 services.*
>
> *"Vera Protocol bridges commercial communication with compliant on-chain settlement through two core modes:*
> 1. **Public Service Marketplace:** Verified creators list fixed-price services with set service capacity.
> 2. **Private 1-on-1 Escrow Agreements:** Bilateral unlisted deals with an interactive 2x2 social share suite (QR Code, Copy Link, WhatsApp, Telegram).
>
> *"Everything you see today runs directly against live smart contracts deployed on Monad Testnet!"*

---

## SECTION 2: On-Chain Web3 Wallet Connect & cATKN Faucet (1:30 - 3:00)

### On-Screen Action:
1. Click **Connect Wallet** via RainbowKit in the top header.
2. Select Web3 Wallet (MetaMask / Rabby) connected to **Monad Testnet (`Chain ID 10143`)**.
3. Point out live token balances reading directly from `MockAToken.sol` (`balanceOf()`):
   - `cATKN Balance` (Cleanverse A-Token compliance token)
   - `MON Balance` (Monad Native token for gas)
4. Click **Claim Faucet (+10,000 cATKN)** in the header:
   - Wallet prompts on-chain transaction calling `faucet()` on `0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03`.
   - Show status toast: `"Faucet Transaction Submitted... Confirming on Monad Testnet..."`
   - Show live on-chain balance incrementing upon transaction receipt confirmation!

### Speaker Voiceover:
> *"Let's connect our Web3 wallet to **Monad Testnet (`Chain ID 10143`)**.*
>
> *"Our header balance pill reads live balances straight from the blockchain. Clicking **Claim Faucet** triggers a real EVM transaction calling `faucet()` on our deployed `cATKN` contract (`0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03`), enforced by a 24-hour on-chain per-wallet cooldown.*
>
> *"Once confirmed on Monad, our `cATKN` balance updates instantly!"*

---

## SECTION 3: Public Service Marketplace & 6 Web3 Categories (3:00 - 5:00)

### On-Screen Action:
1. Click on the **Marketplace Category Chips** at the top of the dashboard.
2. Filter through all 6 Web3 Marketplace Categories:
   - 🛡️ `Smart Contract Audits`
   - 💻 `Full-Stack Web3 & Frontend`
   - 🪙 `DeFi & Yield Protocols`
   - 🔐 `ZKP & Identity Security`
   - 📊 `Tokenomics & Governance`
   - ✨ `Web3 Design & Branding`
3. Click **Create Service Listing** → Select **Public Service Listing**.
4. Fill in:
   - **Title:** `Institutional Smart Contract Audit & Formal Verification`
   - **Category:** `Smart Contract Audits`
   - **Price:** `800 cATKN`
   - **Service Capacity / Slots:** `5 Slots`
5. Click **Deploy Service Listing**.
6. Show the service listing card on the marketplace. Point out capacity tracking (`0 / 5 Claimed`).

### Speaker Voiceover:
> *"Here is our **Public Service Marketplace**.*
>
> *"Verified creators can list fixed-price services across 6 specialized Web3 categories: Smart Contract Audits, Full-Stack Web3, DeFi & Yield Protocols, ZKP & Identity, Tokenomics, and Web3 Design.*
>
> *"Each service listing defines a **Service Capacity** — for instance, an auditor offering up to 5 audit slots. When a client purchases a slot, Vera Protocol deploys an isolated escrow contract while reserving the remaining capacity for other clients!"*

---

## SECTION 4: Private 1-on-1 Escrows & 2x2 Social Share Suite (5:00 - 7:00)

### On-Screen Action:
1. Click **Deploy Escrow Vault** → Select **1-on-1 Custom Escrow Deal**.
2. Fill in:
   - **Title:** `Private Bilateral OTC Token Audit & Escrow`
   - **Price:** `1,500 cATKN`
   - **Category:** `Smart Contract Audits`
3. Click **Submit & Deploy Escrow**.
4. Open the newly created 1-on-1 Deal Detail Page.
   - Point out that this deal **does NOT appear in the Public Marketplace** (strictly private to participating wallets).
   - Point out that the **Multi-Slot Subscribers Panel is hidden** for 1-on-1 deals.
5. Highlight the **Payment Link Share Card** in its 2x2 grid layout:
   - Full-width `Payment link` read-only URL input bar (`?deal=deal-xxx`).
   - **Row 1:** Click `[ Copy link ]` (toast confirms link copied) | Click `[ Show QR ]` (opens QR code modal with download SVG button).
   - **Row 2:** Highlight `[ WhatsApp Direct ]` (`#25D366`) and `[ Telegram Direct ]` (`#229ED9`) direct share links.

### Speaker Voiceover:
> *"Next is one of our core architectural highlights: **Private 1-on-1 Escrow Agreements**.*
>
> *"When a client and seller arrange a custom contract in DMs, they deploy a 1-on-1 Private Escrow. This deal is strictly unlisted from the public marketplace to preserve commercial privacy.*
>
> *"To send the deal link to the buyer, Vera Protocol features an interactive 2x2 Social Share Suite:*
> - Full-width read-only link input bar.
> - **Copy Link** for clipboard sharing.
> - **Show QR Code** for mobile scanning or in-person verification.
> - **WhatsApp Direct** and **Telegram Direct** buttons styled with official brand guidelines to share straight into chat!"*

---

## SECTION 5: Cleanverse A-Pass Gating, OFAC & EIP-712 Signing (7:00 - 9:00)

### On-Screen Action:
1. Open the shareable deal link as buyer.
2. Click **Fund / Accept Escrow Deal**.
3. Point out the Cleanverse compliance verification modal:
   - Live **A-Pass Identity Tier check** (enforcing Tier 20+ requirement).
   - Live **OFAC Sanctions check** (excluding prohibited regional flags like `RU`).
   - Backend **EIP-712 ECDSA signature generation** with deadline expiration.
4. Click **Confirm & Deposit Escrow Funds**:
   - Triggers Web3 wallet approval for `cATKN` token spending (`approve()`) and `acceptWithAttestation()` on `Escrow.sol`.
   - Show status toast: `"Attestation Submitted... Funds Locked in Escrow Vault on Monad Testnet."*

### Speaker Voiceover:
> *"Here is how Cleanverse identity gating is enforced during contract execution:*
>
> *"When the buyer clicks **Accept & Fund Escrow**, the Cleanverse SDK queries the live A-Pass registry. It verifies that the participant holds the required risk tier (Tier 20+) and checks OFAC regional sanction rules.*
>
> *"Once validated, the relayer signs a cryptographic EIP-712 ECDSA attestation. The user confirms the transaction in their Web3 wallet, executing `acceptWithAttestation()` on `Escrow.sol` and locking the 1,500 cATKN in the escrow vault!"*

---

## SECTION 6: Vera Vault ZK Deliverable Inspection & Secrets (9:00 - 10:30)

### On-Screen Action:
1. Switch to Seller Wallet → Open Deal Detail Page → Click **Submit Deliverable**.
2. Upload source code payload or credential secret:
   - Enter repo URL, file attachment, or text credentials.
   - Click **Encrypt & Submit Deliverable Payload**.
3. Switch back to Buyer Wallet → Open Deal Detail Page.
   - Show the **Vera Vault Deliverable Inspector**.
   - Show watermarked code inspection preview / sandbox demo link.
   - Point out SHA-256 cryptographic payload hash attestation recorded on-chain.

### Speaker Voiceover:
> *"Once the work is completed, the seller submits their deliverable payload.*
>
> *"Using **Vera Vault ZK Secret Masking**, sensitive deliverables (source code, API keys, credentials) are encrypted client-side. The buyer can inspect watermarked code previews and verify SHA-256 payload hashes before releasing funds."*

---

## SECTION 7: Dynamic Trust-Adjusted Platform Fee Release (10:30 - 12:30)

### On-Screen Action:
1. As Buyer → Inspect deliverable on the Deal Detail Page.
2. Scroll to the **Trust-Adjusted Escrow Terms Engine** box:
   - Point out the seller's Trust Score (0–100 score).
   - Point out the dynamic platform fee tier: **Low (3.0%)**, **Mid (1.5%)**, **High (0.5%)**, **Elite (0.25%)**.
3. Click **Release Escrow Funds**:
   - Web3 wallet executes `release()` on `Escrow.sol`.
   - Show notice toast: `"Payout Released: 1,477.5 cATKN net to provider · 22.5 cATKN (1.5% protocol fee) routed to EscrowFactory treasury."*
4. Check recipient wallet balance → Show `1,477.5 cATKN` net credited instantly.

### Speaker Voiceover:
> *"Vera Protocol features an active **Trust-Adjusted Platform Fee Engine**:*
>
> - **Dynamic Rate Calculation:** Sellers with higher Trust Scores receive reduced platform fee rates (down to 0.25% for Elite Tiers).
> - **On-Chain Enforcement:** Fees are calculated directly inside `Escrow.sol`. Upon release, `Escrow.sol` splits the funds: the net payout (1,477.5 cATKN) is credited to the seller's wallet balance, while the 1.5% protocol fee (22.5 cATKN) is transferred directly on-chain to the `EscrowFactory` owner's treasury wallet address!"*

---

## SECTION 8: FATF Travel Rule PDF Reports & EVM Audit Ledger (12:30 - 14:30)

### On-Screen Action:
1. Click **User Profile Modal** in the header.
2. Navigate to **Transaction History & Audit Ledger**:
   - Highlight the newly recorded transaction card.
   - Point out EVM Transaction Hash (`0x...`), copy hash button, and direct **Monad Explorer** link.
3. Click **Download FATF Travel Rule PDF Report**:
   - Download generated Travel Rule PDF report.
   - Open PDF to show originator, beneficiary, validator pool ID, and state proof signature.
4. Open **Policy Playground** from the sidebar:
   - Drag Tier Slider from `10` up to `35` → Show live compliance rules simulator.

### Speaker Voiceover:
> *"For institutional auditability, every settled escrow logs an immutable audit trail.*
>
> *"In the User Profile modal under **Transaction History & Audit Ledger**, users can inspect exact EVM transaction hashes with direct Monad Explorer links.*
>
> *"Clicking **Download Travel Rule Report** generates an official FATF Travel Rule PDF compliance document containing sender, beneficiary, validator pool IDs, and cryptographic state proofs!"*

---

## SECTION 9: Closing Summary & Production Hackathon Alignment (14:30 - 15:00)

### Speaker Voiceover:
> *"In summary, Vera Protocol delivers a complete, institutional-grade settlement protocol built natively for Monad Testnet:*
>
> 1. **Cleanverse CVI & CVA Integration Depth:** Full A-Pass identity gating, cATKN asset settlement, EIP-712 ECDSA attestations, and FATF Travel Rule PDF reporting.
> 2. **Complete Feature Suite:** Public Service Marketplace across 6 Web3 categories, Private 1-on-1 Deals with 2x2 social sharing (QR Code, Copy Link, WhatsApp, Telegram), and Trust-Adjusted dynamic fee enforcement.
> 3. **Production Quality:** 0 compilation errors (`npx tsc --noEmit`), 7/7 Hardhat smart contract unit tests passing, live contracts on Monad Testnet (`Chain ID 10143`), and fully mobile-responsive UI.
>
> *"Thank you for your time and evaluation! You can test Vera Protocol live in our repository and on Monad Testnet."*

---

## Technical Checklist for Presenter

- [ ] Ensure Next.js dev server is running (`cd app && npm run dev` → `http://localhost:3005`).
- [ ] Ensure Web3 wallet has Monad Testnet MON for gas testing in Production Mode.
- [ ] Have Monad Explorer tabs pre-opened:
  - `EscrowFactory`: `https://testnet.monadexplorer.com/address/0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334`
  - `cATKN Token`: `https://testnet.monadexplorer.com/address/0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03`
Monad Explorer tabs pre-opened:
  - `EscrowFactory`: `https://testnet.monadexplorer.com/address/0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334`
  - `cATKN Token`: `https://testnet.monadexplorer.com/address/0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03`
- [ ] Test switching between `Alice` (Client), `Charlie` (Blocked), `Vlad` (Sanctioned), and `Bob` (Verified) beforehand to ensure smooth live demo flow.

