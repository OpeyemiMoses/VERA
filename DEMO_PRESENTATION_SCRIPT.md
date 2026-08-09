# Vera Protocol — Live Product Demo & Presentation Guide

> **Cleanverse Verified Finance Hackathon — DeFi & Infrastructure Track**  
> **Network:** Monad Testnet (`Chain ID 10143`)  
> **Core Compliance Primitives:** Cleanverse CVI (Verification Infrastructure) & CVA (Verification Attestation)  
> **Format Timing:** **15-Minute Full Presentation** (12 Mins Live Spoken Demo + 3 Mins Judge Q&A) | Option for **3-5 Min Condensed Video**  
> **Tone & Style:** Conversational, Natural, Founder-Led, and High-Impact (No Mock Personas / Web3 Wallet Connected)

---

## Presenter Guidelines: How to Give a Winning Demo

1. **Founder-Led Product Pitch:** Focus on *why* VERA solves a massive Web3 friction point, *how* CVI and CVA guarantee compliance on-chain, and *how smooth* real wallet interactions feel on Monad Testnet.
2. **Real Web3 Wallet Interactions (No Personas / No Sandbox):** Connect your real Web3 wallet (MetaMask) on Monad Testnet. All actions — vault deployment, token approval, CVA attestation, and payout release — trigger real Web3 wallet transactions!
3. **Highlight the Self-Assigned CVI Demo Feature:** Demonstrate how easy it is for hackathon judges and testers to self-issue a CVI A-Pass credential in 1 click via **"Issue CVI A-Pass"**.

---

## 1. The Story & Core Concept (0:00 - 1:30)

### On-Screen Action:
- Start on the **Vera Protocol Landing Page** (`https://vera-escrow.vercel.app`).
- Scroll past the hero section down to the core protocol architecture cards.

### What to Say (Human Voiceover):
> *"Hey everyone! Welcome to **Vera Protocol** — the Compliant On-Chain Escrow Protocol built natively on **Monad Testnet** for the Cleanverse Hackathon.*
>
> *"If you’ve ever hired an auditor, developer, or designer in Web3, you know the painful dilemma: deals happen in Telegram or WhatsApp DMs, and then comes the million-dollar question: **Who pays first?***
>
> *"Sending funds upfront to an anonymous wallet is a recipe for counterparty fraud. But legacy Web2 escrows charge 20% middleman fees, freeze funds arbitrarily, and force users through centralized databases.*
>
> *"Conversely, anonymous Web3 escrows expose buyers and sellers to OFAC sanctions liabilities and AML violations.*
>
> *"That’s why we built **Vera Protocol**. It introduces a trustless, shareable escrow layer where every transaction is gated by **Cleanverse CVI** and **CVA**, ensuring 100% compliant settlements on Monad Testnet with zero compromise on Web3 privacy!"*

---

## 2. Deep-Dive: CVI, CVA & Self-Assigned Demo CVI (1:30 - 3:00)

### On-Screen Action:
- Hover over the **CVI Tier** and **CVA Score** badges in the header bar.
- Point out the **Issue CVI A-Pass** button.

### What to Say:
> *"Let’s break down how Vera Protocol achieves compliant Web3 settlement using two core primitives:*
>
> 1. **Cleanverse Verification Infrastructure (CVI):**  
>    CVI provides zero-knowledge identity screening, regional sanctions geofencing, and assigns an **A-Pass Compliance Tier (0–100)** to user wallets.
>
> 2. **Cleanverse Verification Attestation (CVA):**  
>    CVA is the cryptographic bridge to Monad Testnet smart contracts. When a user passes CVI verification, an ECDSA attestation signature is issued. Monad Testnet smart contracts (`Escrow.sol`) execute `acceptWithAttestation(bytes signature, uint256 deadline)` and verify `ethSignedHash.recover(signature) == complianceAttestor` on-chain before allowing state transitions!
>
> **The Self-Assigned CVI Demo Feature:**  
> *"To make testing effortless for judges, we integrated a **Self-Assigned CVI Credential Generator**! Anyone testing the dApp can click **'Issue CVI A-Pass'** in the header. This calls `/api/cleanverse/apass/generate_apass` to self-issue a verified CVI credential (e.g. Tier 30, US Region) directly to their connected wallet!"*

---

## 3. Web3 Wallet Connection & Test Tokens (3:00 - 4:00)

### On-Screen Action:
1. Click **Launch App** to enter the main dashboard.
2. Click **Connect Wallet** in the top right → Select Web3 wallet (MetaMask) on **Monad Testnet**.
3. Highlight the header balance pill showing **cATKN** (Cleanverse Token) and **MON** balances.
4. Click **Claim Faucet (+10,000 cATKN)** → Show instant confirmation notification.

### What to Say:
> *"Connecting your Web3 wallet takes 1 click on Monad Testnet.*
>
> *"Here in the header, you can see your live balances — native MON for gas and **cATKN** tokens for escrow settlements.*
>
> *"If you need test tokens, hit **Claim Faucet**, and 10,000 cATKN tokens drop directly into your connected wallet!"*

---

## 4. Public Marketplace & Private 1-on-1 Deals (4:00 - 6:00)

### On-Screen Action:
1. Browse the **Public Service Marketplace** and click through category chips (*Smart Contract Audits*, *Full-Stack Web3*, *DeFi*, *ZKP*, *Tokenomics*, *Design*).
2. Click **Deploy Escrow Vault** → Select **1-on-1 Custom Escrow Deal**.
3. Enter title `Private Audit & Escrow Agreement`, set price `1,500 cATKN`, and set minimum CVI Tier requirement (e.g. `Tier 10`).
4. Click **Deploy Escrow Vault** → Web3 wallet popup triggers contract creation on Monad Testnet!
5. Demonstrate the **Payment Link Share Card** (Copy Link, QR Code, WhatsApp, Telegram buttons).

### What to Say:
> *"Vera Protocol supports both public services and private deals.*
>
> *"If you're a Web3 agency offering fixed-price services — like a Smart Contract Audit — you can list on our Public Marketplace with fixed slot capacity.*
>
> *"For custom deals negotiated over Telegram DMs, you deploy a **Private 1-on-1 Escrow Deal**. It is unlisted from the marketplace for privacy.*
>
> *"Sharing it with your client is effortless via our 2x2 Payment Link Share Suite: copy the link in 1 tap, generate a QR Code, or hit Telegram/WhatsApp to send the escrow link directly into your DM!"*

---

## 5. Live On-Chain Flow & 5 CVI Verification Gates (6:00 - 9:30)

### On-Screen Action:
1. Open the escrow deal detail page.
2. Show the **5 Mandatory CVI Verification Gates** active on the deal:
   - Gate 1: **Deal Creation / Vault Deployment**
   - Gate 2: **Buyer Funding & Token Deposit** (populates Slot 1: Deployment Tx & Slot 2: Deposit Tx)
   - Gate 3: **Seller Job Acceptance** via CVA Attestation (`acceptWithAttestation`)
   - Gate 4: **Deliverable Submission** via on-chain `setFreelancer` (populates Slot 3: **Attestation Tx**)
   - Gate 5: **On-Chain Payout Release** (`releaseTo`) (populates Slot 4: **Payout Release Tx**)
3. Perform **Pay & Deposit Escrow**:
   - Approve `cATKN` token spending in MetaMask.
   - Deposit into Monad Testnet Escrow Vault.
4. Perform **Submit Deliverable**:
   - Attach deliverable files and instructions.
   - Confirm Web3 wallet transaction executing `setFreelancer` on Monad Testnet.
   - Show Slot 3 (**Attestation Tx**) updating with live Monad block explorer link!
5. Inspect deliverable in **Sandbox Inspection Modal** → Click **Confirm Deliverable & Release Payout**:
   - CVI verifies caller.
   - `releaseTo(sellerAddress)` executes on Monad Testnet.
   - Slot 4 (**Payout Release Tx**) displays the final payout receipt, and `cATKN` tokens transfer directly to the provider's wallet!

### What to Say:
> *"Notice what happens during the escrow execution:*
>
> *"Every step is guarded by Cleanverse CVI gates. If an unverified or sanctioned wallet attempts any step, Vera Protocol immediately **BLOCKS** the action.*
>
> *"When the buyer deposits funds, the tokens lock securely inside the Monad Testnet smart contract vault. Slots #1 and #2 log the deployment and deposit hashes.*
>
> *"When the seller accepts and submits deliverables, a Web3 transaction executes `setFreelancer` and `acceptWithAttestation` on-chain. Look at Slot #3 (**Attestation Tx**) — it logs the live Monad Testnet attestation receipt!*
>
> *"Finally, after inspecting the deliverable, the buyer clicks **Release Payout**. The contract executes `releaseTo`, transferring net funds directly to the seller's wallet and routing the trust-adjusted fee to treasury. Slot #4 (**Payout Release Tx**) completes the on-chain audit trail!"*

---

## 6. FATF Travel Rule PDF & Compliance Audit Log (9:30 - 11:00)

### On-Screen Action:
1. Open **User Profile Modal** → Click **Transaction History & Audit Ledger**.
2. Show the immutable ledger cards with live Monad Explorer links.
3. Click **Download FATF Travel Rule PDF Report** → Show downloaded PDF report preview.

### What to Say:
> *"For institutional clients, funds, and corporate teams that require formal compliance documentation, Vera Protocol automatically generates an immutable audit ledger.*
>
> *"With 1 click, users can download an official **FATF Travel Rule Compliance PDF Report** containing cryptographic transaction hashes, sender/receiver wallet addresses, CVI verification scores, and Monad block timestamps."*

---

## 7. Closing Statement & Why Vera Wins (11:00 - 12:00)

### On-Screen Action:
- Return to main dashboard view.
- Show responsive layout and final verified balance.

### What to Say:
> *"To summarize:*
>
> 1. **Monad Performance:** Lightning-fast escrow state transitions with minimal gas fees.
> 2. **Cleanverse CVI & CVA:** Zero-knowledge identity, sanctions geofencing, and on-chain ECDSA attestation signatures.
> 3. **Seamless UX:** Shareable payment links for Telegram/WhatsApp DMs, self-assigned demo credentials, and 1-click FATF PDF reports.
>
> *"Vera Protocol makes global Web3 commerce safe, fast, and 100% compliant.*
>
> *"Thank you so much, and we'd love to answer any questions!"*

---

> [!TIP]
> **Live App**: [vera-escrow.vercel.app](https://vera-escrow.vercel.app)  
> **Repository**: [github.com/OpeyemiMoses/VERA](https://github.com/OpeyemiMoses/VERA)
