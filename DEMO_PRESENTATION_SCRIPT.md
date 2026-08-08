# Vera Protocol — Complete 15-Minute Live Presentation & Demo Script

> **Cleanverse Verified Finance Hackathon — DeFi & Infrastructure Track**  
> **Project:** Vera Protocol (Shareable Compliant On-Chain Escrow Protocol & Identity-Gated Settlement Infrastructure)  
> **Network:** Monad Testnet (`Chain ID 10143`)  
> **Target Duration:** ~15 Minutes (Comprehensive E2E Technical & Protocol Walkthrough)

---

## Presentation Overview & Outline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SECTION 1: Executive Hook & Settlement Protocol Thesis      (0:00 - 1:30)   │
│ SECTION 2: Monad On-Chain Contracts & SDK Architecture      (1:30 - 3:00)   │
│ SECTION 3: 7-Persona Identity Matrix & Compliance Profile   (3:00 - 4:30)   │
│ SECTION 4: Public Service Marketplace & 6 Web3 Categories   (4:30 - 6:30)   │
│ SECTION 5: Private 1-on-1 Escrows & 2x2 Social Share Suite  (6:30 - 8:30)   │
│ SECTION 6: Identity Gating, OFAC Rules & EIP-712 Signing    (8:30 - 10:30)  │
│ SECTION 7: Trust-Adjusted Fee Engine & Net Payout Release   (10:30 - 12:30) │
│ SECTION 8: Policy Playground, Audit Ledger & Production     (12:30 - 14:30) │
│ SECTION 9: Closing Summary & Hackathon Metrics              (14:30 - 15:00) │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SECTION 1: Executive Hook & Settlement Protocol Thesis (0:00 - 1:30)

### Speaker Voiceover:
> *"Hello judges, mentor team, and Cleanverse community! Today, I’m thrilled to present **Vera Protocol** — the first identity-gated, shareable on-chain escrow protocol built natively for **Monad Testnet** and powered by Cleanverse CVI and CVA asset primitives.*
>
> *"To understand Vera Protocol, it is essential to clarify our core architecture: **Vera Protocol is a programmable, identity-gated escrow settlement layer for Web3.**"*
>
> *"In Web3 freelancing and OTC commercial transactions, business happens over DMs — Telegram, WhatsApp, Discord, or X. Clients hire auditors, DAOs hire contributors, and teams purchase specialized Web3 services. Yet legacy escrows suffer from major friction points:*
> 1. **Friction-Heavy Setup:** Forcing users to manually copy-paste raw 0x contract addresses or manage multi-participant bidding pools.
> 2. **Zero Regulatory Compliance:** Lacking FATF Travel Rule reporting, sanctions screening, and verifiable compliance records.
>
> *"Vera Protocol solves this by introducing two complementary settlement modes:*
> - **Public Service Marketplace:** Verified creators list fixed-price Web3 services with set service capacity.
> - **Private 1-on-1 Escrow Agreements:** Custom bilateral deals hidden from the public marketplace, shareable in 1 click via an interactive 2x2 social share suite with QR codes, copy links, WhatsApp, and Telegram."*

---

## SECTION 2: Monad On-Chain Contracts & SDK Architecture (1:30 - 3:00)

### On-Screen Action:
- Open **Monad Explorer** in the browser or display the architecture diagram from `ONE_PAGE_SUMMARY.md`.
- Highlight live deployed contracts on **Monad Testnet (Chain 10143)**:
  - `EscrowFactory.sol`: `0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334`
  - `cATKN (MockAToken.sol)`: `0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03`

### Speaker Voiceover:
> *"Let's examine Vera Protocol's 3-layer modular architecture starting directly from the on-chain smart contract layer:*
>
> *"**Layer 1 — Monad Smart Contracts (`/contracts`):**"*
> - `EscrowFactory.sol`: Deployed live on Monad Testnet at `0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334`. It acts as an indexed factory contract deploying individual, isolated `Escrow.sol` instances for every deal and routes protocol fees to the treasury wallet.
> - `Escrow.sol`: Core identity-gated escrow contract equipped with `acceptWithAttestation(bytes signature, uint256 deadline)` and automated protocol fee distribution on `release()`.
> - `MockAToken.sol`: Deployed at `0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03`. Represents Cleanverse `cATKN` compliance tokens with a public `faucet()` function enforcing a 24-hour per-wallet cooldown.
>
> *"**Layer 2 — Cleanverse SDK (`/sdk`):**"*
> - Encapsulates Cleanverse REST API endpoints (`/validator/verify`, `/generate_apass`, `/download_travel_rule`) with EIP-712 compliance attestations.
>
> *"**Layer 3 — Next.js 14 Web Application (`/app`):**"*
> - Supports dual operating modes: **Production Mode** for real Web3 wallets on Monad Testnet and **Sandbox Demo Matrix** for instant evaluation."*

---

## SECTION 3: 7-Persona Identity Matrix & Compliance Profile (3:00 - 4:30)

### On-Screen Action:
- Open the application at `http://localhost:3005`.
- Select **SANDBOX DEMO MATRIX** mode from the header bar.
- Click through the persona toolbar to highlight `Alice`, `Bob`, `Charlie`, `Vlad`, `Diana`, `Marcus`, `Zara`.
- Click on **Alice's User Profile** modal to show her compliance card and `cATKN` / `MON` live wallet balances.

### Speaker Voiceover:
> *"To allow hackathon judges and auditors to test complex compliance pass/fail scenarios without setting up seven distinct Web3 wallets, Vera Protocol includes an interactive **Sandbox Demo Matrix** featuring 7 pre-configured personas:*
>
> 1. **Alice (Client · SG · Tier 25):** Verified enterprise client looking to fund escrow deals.
> 2. **Bob (Freelancer · US · Tier 30):** Verified Web3 engineer with clean OFAC compliance history.
> 3. **Charlie (Unverified · No A-Pass):** New user without Cleanverse identity verification.
> 4. **Vlad (Sanctioned · RU · Tier 0):** Wallet flagged in a prohibited region (Russia - OFAC Blocked).
> 5. **Diana (Enterprise Buyer · CH · Tier 40):** Institutional treasury manager.
> 6. **Marcus (UI/UX Designer · DE · Tier 35):** Verified designer accepting service listings.
> 7. **Zara (Security Auditor · AE · Tier 45):** Elite smart contract auditor with maximum trust score.
>
> *"Opening **Alice's Profile** displays her **Tier 25 Level**, **OFAC CLEAR (SG)** badge, **98/100 Compliance Score**, and her live **cATKN** and **MON** balances."*

---

## SECTION 4: Public Service Marketplace & 6 Web3 Categories (4:30 - 6:30)

### On-Screen Action:
- Click on the **Marketplace Category Chips** at the top of the dashboard.
- Filter through all 6 Web3 Marketplace Categories:
  - `Smart Contract Audits`
  - `Full-Stack Web3 & Frontend`
  - `DeFi & Yield Protocols`
  - `ZKP & Identity Security`
  - `Tokenomics & Governance`
  - `Web3 Design & Branding`
- Click **Create Service Listing** → Select **Public Service Listing**.
- Point out the **Service Capacity / Slots** input (e.g., `5 Slots`).
- Show how purchasing a service slot decrements capacity (`1 / 5 Slots Claimed`) and creates an isolated escrow order instance.

### Speaker Voiceover:
> *"Now let's explore our **Public Service Marketplace**.*
>
> *"Verified Web3 freelancers and agencies can list fixed-price services categorized under 6 specialized Web3 domains: Smart Contract Audits, Full-Stack Web3, DeFi & Yield Protocols, ZKP & Identity, Tokenomics, and Web3 Design.*
>
> *"Each public service listing defines a **Service Capacity** — for instance, an auditor offering up to 5 audit slots. When a client purchases a slot, Vera Protocol spawns an isolated escrow order contract while reserving the remaining capacity for other clients!"*

---

## SECTION 5: Private 1-on-1 Escrows & 2x2 Social Share Suite (6:30 - 8:30)

### On-Screen Action:
1. Click **Deploy Escrow Vault** → Select **1-on-1 Custom Escrow Deal**.
2. Fill in:
   - **Title:** `Private OTC Smart Contract Audit & Review`
   - **Price:** `1,500 cATKN`
   - **Category:** `Smart Contract Audits`
3. Click **Submit & Deploy Escrow**.
4. Open the newly created 1-on-1 Deal Detail Page.
   - Point out that this deal **does NOT appear in the Public Marketplace** (strictly private to participating wallets).
   - Point out that the **Multi-Slot Subscribers Panel is hidden** for 1-on-1 deals.
5. Highlight the **Payment Link Share Card** in its 2x2 grid layout:
   - Full-width `Payment link` read-only URL input bar.
   - **Row 1:** Click `[ Copy link ]` (toast confirms link copied) | Click `[ Show QR ]` (opens QR code modal with download SVG button).
   - **Row 2:** Highlight `[ WhatsApp ]` (`#25D366`) and `[ Telegram ]` (`#229ED9`) direct share links.

### Speaker Voiceover:
> *"Next is one of our most requested features: **Private 1-on-1 Escrow Agreements**.*
>
> *"When a freelancer and client agree on a custom contract in DMs, they create a 1-on-1 Private Escrow. Notice that this deal is strictly hidden from the public marketplace to preserve commercial privacy.*
>
> *"To share the escrow link with the buyer, Vera Protocol includes a 2x2 Social Share Suite right on the deal page:*
> - Full-width read-only link bar.
> - **Copy Link** for instant clipboard sharing.
> - **Show QR Code** for mobile scanning or in-person verification.
> - **WhatsApp Direct** and **Telegram Direct** buttons with official brand styling to share straight to DM!"*

---

## SECTION 6: Identity Gating, OFAC Rules & EIP-712 Signing (8:30 - 10:30)

### On-Screen Action:
1. Copy the shareable deal link for Alice's newly created Private Escrow.
2. **Switch to Charlie (Unverified):** Paste/open the deal link or click **Accept Job**.
   - Show the compliance modal blocking Charlie: `Identity Blocked: No Cleanverse A-Pass record`.
3. **Switch to Vlad (Sanctioned RU):** Click **Accept Job**.
   - Show the compliance modal blocking Vlad: `Sanctions Blocked: Country RU is on the prohibited region list`.
4. **Switch to Bob (Verified US · Tier 30):** Click **Accept Job**.
   - Show compliance verification passing (`Cleanverse A-Pass Verified`).
   - Click **Confirm & Accept Job**. Point out the real-time EIP-712 ECDSA attestation toast notification!

### Speaker Voiceover:
> *"Here is live identity-gated settlement in action:*
>
> *"Alice creates a **1,500 cATKN** Smart Contract Audit escrow, enforcing a minimum Cleanverse **Tier 20 A-Pass** and prohibiting sanctioned regions (`RU`).*
>
> *"First, **Charlie** (unverified) attempts to accept. Vera Protocol intercepts the transaction and blocks him: `Identity Blocked: No A-Pass record`.*
>
> *"Next, **Vlad** (Tier 0, Russia) attempts to accept. The Validator Pool rules evaluate his region and block him: `Sanctions Blocked: Country RU is prohibited`.*
>
> *"Finally, **Bob** (Tier 30 US A-Pass) accepts the deal. The Cleanverse SDK validates his identity, generates an EIP-712 ECDSA backend attestation, and submits `acceptWithAttestation()` directly to Monad!"*

---

## SECTION 7: Trust-Adjusted Fee Engine & Net Payout Release (10:30 - 12:30)

### On-Screen Action:
1. As **Bob (Freelancer)** → Click **Submit Deliverable**.
   - Upload code audit report deliverable payload → Click **Submit Deliverable**.
2. **Switch to Alice (Client):** Open the deal detail view.
   - Show the deliverable inspector previewing the code submission.
3. Scroll down to the **Trust-Adjusted Escrow Terms Engine** box:
   - Point out Bob's Trust Score (e.g. `60/100`), fee rate (`1.5%`), and net payout calculation.
4. Click **Release Payout**.
   - Confirm payment release transaction. Show status updating to **RELEASED / COMPLETED**.
   - Highlight the notice toast and breakdown: `1,477.5 cATKN` net credited to Bob's wallet balance, while `22.5 cATKN` (1.5% protocol fee) is routed to the `EscrowFactory` treasury.

### Speaker Voiceover:
> *"Vera Protocol features a **Trust-Adjusted Platform Fee Engine** powered by Cleanverse identity metrics:*
>
> - **Trust Tiers:** Low (3.0% fee), Mid (1.5% fee), High (0.5% fee), and Elite (0.25% fee).
> - **Net Disbursement:** Platform fees are enforced on every release. Out of the 1,500 cATKN price, Bob receives his net payout of 1,477.5 cATKN directly into his wallet balance, while the 22.5 cATKN protocol fee is routed on-chain to the platform treasury."*

---

## SECTION 8: Policy Playground, Audit Ledger & Production (12:30 - 14:30)

### On-Screen Action:
1. Open **Alice's Profile Modal** → Switch to **Transaction History & Audit Ledger**.
   - Highlight the recorded transaction card with EVM Transaction Hash (`0x...`), copy button, and Monad Explorer link.
2. Click **Policy Playground** in the sidebar.
   - Adjust tier slider from `10` up to `35` → Watch persona status badges flip from PASS to BLOCKED in real time.
3. Switch top toggle from **SANDBOX DEMO MATRIX** to **PRODUCTION MODE (LIVE)**.
   - Show **Connect Wallet** RainbowKit button connecting to **Monad Testnet (`Chain 10143`)**.
   - Click **Claim Faucet (+10,000 cATKN)** → Show on-chain execution with 24h per-wallet cooldown.

### Speaker Voiceover:
> *"Every completed escrow automatically logs an immutable audit trail with EVM transaction hashes and direct Monad Explorer links.*
>
> *"In the **Policy Playground**, compliance officers can simulate custom risk rules in real time before deploying to production.*
>
> *"And in **Production Mode**, Vera Protocol connects via Viem/Wagmi directly to **Monad Testnet (`Chain ID 10143`)**, reading live on-chain token balances from `MockAToken.sol` and claiming test tokens via our 24h cooldown faucet!"*

---

## SECTION 9: Closing Summary & Hackathon Metrics (14:30 - 15:00)

### Speaker Voiceover:
> *"In summary, Vera Protocol delivers an institutional-grade, identity-gated settlement primitive for Monad Testnet:*
>
> 1. **Cleanverse Integration Depth:** Full A-Pass identity gating, cATKN asset settlement, EIP-712 ECDSA attestations, and FATF Travel Rule PDF reporting.
> 2. **Complete Feature Suite:** Public Service Marketplace across 6 Web3 categories, Private 1-on-1 Deals with 2x2 social sharing (QR, Copy Link, WhatsApp, Telegram), and Trust-Adjusted dynamic fee enforcement.
> 3. **Production Quality:** 0 compilation errors (`npx tsc --noEmit`), 7/7 Hardhat smart contract unit tests passing, and fully mobile-responsive UI.
>
> *"Thank you for your time and evaluation! You can test Vera Protocol live in our repository and on Monad Testnet."*

---

## Technical Checklist for Presenter

- [ ] Ensure Next.js dev server is running (`cd app && npm run dev` → `http://localhost:3005`).
- [ ] Ensure Web3 wallet has Monad Testnet MON for gas testing in Production Mode.
- [ ] Have Monad Explorer tabs pre-opened:
  - `EscrowFactory`: `https://testnet.monadexplorer.com/address/0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334`
  - `cATKN Token`: `https://testnet.monadexplorer.com/address/0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03`
- [ ] Test switching between `Alice` (Client), `Charlie` (Blocked), `Vlad` (Sanctioned), and `Bob` (Verified) beforehand to ensure smooth live demo flow.

