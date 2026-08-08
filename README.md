# Vera Protocol — Compliant Escrow Engine

> **"Stripe Connect meets compliant on-chain escrow for Web3."**  
> A reusable, identity-gated escrow settlement primitive (Smart Contracts + SDK + Frontend) deployed natively on **Monad Testnet (`Chain ID 10143`)** — where every payout and settlement is compliance-enforced by Cleanverse A-Pass identity, Validator Pool rules, and FATF Travel Rule audit exports.

---

## Live Production Deployments & Monad Testnet Contracts

| Resource / Contract | Live Endpoint / Address | Description / Explorer Link |
|---|---|---|
| **Live Production dApp** | [`https://vera-escrow.vercel.app`](https://vera-escrow.vercel.app) | **Live Vercel Production Web3 dApp** |
| **EscrowFactory.sol** | `0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334) |
| **cATKN Token (MockAToken)** | `0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03) |
| **Attestor / Relayer** | `0x4070E534B84cC01e62a685c96d165dEedaC39f58` | EIP-712 ECDSA Backend Signer |

> **Local Dev Server:** `http://localhost:3005` (Next.js 14 App Router)

---

## Key Platform Capabilities

### 1. Public Service Marketplace across 6 Web3 Categories
- Verified creators list fixed-price Web3 services across 6 domain categories:
  * `Smart Contract Audits`
  * `Full-Stack Web3 & Frontend`
  * `DeFi & Yield Protocols`
  * `ZKP & Identity Security`
  * `Tokenomics & Governance`
  * `Web3 Design & Branding`
- **Service Capacity Limits**: Creators set total service capacity (e.g. 5 audit slots max). Claiming a slot deploys an isolated escrow contract while tracking remaining slot availability.

### 2. Private 1-on-1 Escrow Deals & 2x2 Social Share Suite
- **Unlisted Bilateral Agreements**: Custom 1-on-1 deals are strictly hidden from the public marketplace to protect commercial confidentiality.
- **2x2 Social Share Suite**:
  - Full-width read-only link input bar (`?deal=deal-xxx`).
  - **Copy Link**: Copies shareable URL to clipboard in 1 tap.
  - **Show QR Code**: Renders scannable QR code modal with SVG download button.
  - **WhatsApp Direct**: Direct share button (`#25D366`) opening pre-filled WhatsApp chat.
  - **Telegram Direct**: Direct share button (`#229ED9`) opening pre-filled Telegram chat.

### 3. Cleanverse A-Pass Identity Gating & Sanctions Screening
- **Automated A-Pass Verification**: Enforces minimum identity risk tiers (e.g. Tier 20+) before accepting or funding deals.
- **OFAC Regional Sanctions**: Automatically blocks wallets flagged in restricted countries (e.g. `RU - Russia`).
- **EIP-712 ECDSA Attestations**: Backend relayer issues cryptographically signed attestations submitted directly to `Escrow.sol`.

### 4. Dynamic Trust-Adjusted Platform Fee Engine
- **Dynamic Fee Rates**: Evaluates recipient's Trust Score (0–100) to apply dynamic platform fees:
  - **Low Tier (0-29)**: `3.0% fee`
  - **Mid Tier (30-69)**: `1.5% fee`
  - **High Tier (70-89)**: `0.5% fee`
  - **Elite Tier (90-100)**: `0.25% fee`
- **On-Chain Payout Split**: Executed on-chain inside `Escrow.sol`. Upon release, net payout is credited to seller's wallet balance while protocol fee is transferred directly to the `EscrowFactory.sol` treasury address.

### 5. FATF Travel Rule PDF Reports & EVM Audit Ledger
- **Wallet-Scoped Audit Ledger**: Live record of EVM transaction hashes (`0x...`) with direct Monad Explorer links.
- **FATF Travel Rule PDF Generation**: Auto-generates cryptographic Travel Rule compliance PDF reports containing sender, beneficiary, validator pool IDs, and state proofs.

---

## Architecture & Core Components

```
                       +------------------------------------------+
                       |         Vera Protocol dApp UI            |
                       |   (Live Vercel: vera-escrow.vercel.app)  |
                       +--------------------+---------------------+
                                            |
                                            v
                       +--------------------+---------------------+
                       |      Cleanverse SDK & Attestor API       |
                       |  (AES-128-CBC + EIP-712 ECDSA Attestor) |
                       +--------------------+---------------------+
                                            |
                    +-----------------------+-----------------------+
                    |                                               |
                    v                                               v
 +------------------+-------------------+       +-------------------+-------------------+
 |      EscrowFactory.sol (Monad)       |       |       Cleanverse REST API Engine      |
 | Deploy & index compliant escrows     |       | A-Pass Verification & Travel Rule  |
 +------------------+-------------------+       +---------------------------------------+
                    |
                    v
 +------------------+-------------------+
 |          Escrow.sol (Monad)          |
 |  Identity-Gated On-Chain Escrow Pool |
 +--------------------------------------+
```

---

## Environment Variables Setup

Configure the environment variables in your deployment platform (Vercel / Railway / Local `.env.local`):

```env
# Monad Testnet Chain Config
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_CHAIN_NAME=Monad Testnet
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz

# WalletConnect / RainbowKit Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=108b97a59c125333783efa42faa846d0

# Live Monad Smart Contracts
NEXT_PUBLIC_FACTORY_ADDRESS=0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334
NEXT_PUBLIC_ATOKEN_ADDRESS=0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03
NEXT_PUBLIC_ATTESTOR_ADDRESS=0x4070E534B84cC01e62a685c96d165dEedaC39f58

# Cleanverse API & Attestation Credentials
CLEANVERSE_API_URL=https://api.cleanverse.com
CLEANVERSE_API_KEY=YOUR_CLEANVERSE_API_KEY
CLEANVERSE_SECRET_KEY=YOUR_CLEANVERSE_SECRET_KEY
ATTESTOR_PRIVATE_KEY=YOUR_ATTESTOR_PRIVATE_KEY
```

---

## Quick Start & Local Development

```bash
git clone https://github.com/OpeyemiMoses/VERA.git
cd compliant-escrow-protocol

# Install & Run Next.js Frontend dApp
cd app
npm install
npm run dev
# Open http://localhost:3005 in your browser
```

---

## Alignment with Hackathon Judging Criteria (100 Pts Total)

| Criteria | Weight | How Vera Protocol Achieves It |
|---|:---:|---|
| **Depth of CVI & CVA Integration** | **30 Pts** | Integrates A-Pass identity, Validator Pool rules, ECDSA signatures, and FATF Travel Rule PDF exports directly inside smart contract state transitions. |
| **Build Quality & Feasibility** | **25 Pts** | Live on Vercel & Monad Testnet (`10143`) with 0 TypeScript build errors, 7/7 passing Hardhat unit tests, and clean architecture. |
| **Originality & Innovation** | **20 Pts** | Introduces identity-gated escrow primitives with 2x2 social share suite and trust-adjusted dynamic platform fee enforcement. |
| **User Experience & Design** | **15 Pts** | Responsive glassmorphism UI across mobile and desktop, featuring live Web3 Production Mode and policy simulator. |
| **Monad Ecosystem Fit** | **10 Pts** | Configured specifically for Monad Testnet with low transaction overhead and fast settlement flow. |

---

## Community & Open Source Governance

- [**Code of Conduct**](CODE_OF_CONDUCT.md): Contributor Covenant v2.1 standards.
- [**Contributing Guidelines**](CONTRIBUTING.md): Code style, commit conventions, and PR process.
- [**Security Policy**](SECURITY.md): Responsible disclosure policy for vulnerabilities.
- [**License**](LICENSE): Released under the **MIT License**.
