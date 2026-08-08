# Vera Protocol — Compliant Escrow Engine

> **"Stripe Connect meets compliant on-chain escrow for Web3."**
> A reusable, identity-gated escrow primitive (Smart Contracts + SDK + Frontend) deployed on **Monad Testnet** — the first escrow protocol where every payout and settlement is compliance-enforced by Cleanverse A-Pass identity, Validator Pool rules, and FATF Travel Rule audit exports.

---

## Repository About & Description

**Short Description:** Vera Protocol is a compliant, identity-gated on-chain escrow engine built on Monad Testnet and powered by Cleanverse CVI/CVA. It enables trust-adjusted freelancing, OTC token trades, and institutional settlements with automated FATF Travel Rule PDF reporting and ECDSA compliance attestations.

---

## Live Monad Testnet Contracts (Chain ID: 10143)

| Contract | Address | Explorer Link |
|---|---|---|
| **EscrowFactory** | `0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334) |
| **cATKN (MockAToken ERC-20)** | `0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03` | [View on Monad Explorer](https://testnet.monadexplorer.com/address/0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03) |
| **Attestor / Relayer** | `0x4070E534B84cC01e62a685c96d165dEedaC39f58` | Verified EIP-712 Signer |

> **Local Dev Server:** `http://localhost:3005` (Next.js 14 App Router)

---

## Architecture & Core Components

```
                       +------------------------------------------+
                       |         Vera Protocol dApp UI            |
                       |  (Production Web3 + Persona Sandbox)     |
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

### 1. Smart Contracts (`/contracts`)
- **`Escrow.sol`**: Core escrow logic featuring `acceptWithAttestation(bytes signature, uint256 deadline)`. Only counterparty wallets presenting a valid Cleanverse ECDSA compliance attestation can accept job deals or claim payouts.
- **`EscrowFactory.sol`**: Factory contract deploying individual `Escrow` instances on Monad Testnet, maintaining an indexed on-chain registry of all deployed escrows.
- **`MockAToken.sol`**: ERC-20 `cATKN` token equipped with an on-chain public `faucet()` enforcing a 24-hour per-wallet cooldown (10,000 cATKN per claim).

### 2. Cleanverse SDK (`/sdk`)
- **`cleanverseClient.ts`**: REST API client connecting to Cleanverse services (`/validator/verify`, `/generate_apass`, `/download_travel_rule`).
- **`attestor.ts`**: EIP-712 ECDSA digest signer for producing cryptographically verifiable compliance attestations.
- **`cleanverseEncrypt.ts`**: AES-128-CBC payload encryption module for confidential API request parameters.
- **`CompliantEscrowSDK.ts`**: Developer SDK offering a single-line integration interface for dApps requiring compliant escrow logic.

### 3. Frontend dApp (`/app`)
- **Dual Operating Modes**:
  - **Production Mode**: Connects directly via Wagmi/Viem to Monad Testnet for live contract reads, `balanceOf()` calls, real `faucet()` transactions, and on-chain deal indexing.
  - **Sandbox Demo Matrix**: 1-click persona switcher (`Alice`, `Bob`, `Charlie`, `Vlad`, `Diana`, `Marcus`, `Zara`) enabling judges to evaluate identity pass/fail scenarios instantly.
- **Policy Playground**: Interactive simulator for setting Validator Pool `min_tier` rules and country blacklists in real time.
- **Travel Rule Export**: Server-signed FATF Travel Rule PDF audit log generation.

---

## Depth of Cleanverse CVI & CVA Integration

| Cleanverse Feature | Integration Details in Vera Protocol |
|---|---|
| **CVI (Cleanverse Identity / A-Pass)** | Every participant wallet is checked against Cleanverse A-Pass identity tiers before accepting escrows or claiming payouts. |
| **CVA (Cleanverse Assets)** | Escrow deposits and collateral are denominated in `cATKN` (Cleanverse A-Tokens) and native `MON`. |
| **Validator Pool Compliance** | Escrow deals enforce dynamic `min_tier` identity thresholds and country sanction blacklists. |
| **ECDSA Attestations** | Compliance checks produce EIP-712 cryptographic signatures verified on-chain inside `Escrow.sol`. |
| **FATF Travel Rule Exports** | Automated server-side PDF generation producing compliance audit records post-settlement. |

---

## Quick Start & Development Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Metamask / Rabby Wallet**: Configured for Monad Testnet (`Chain ID 10143`, RPC `https://testnet-rpc.monad.xyz`)

### 2. Clone & Install Dependencies

```bash
git clone https://github.com/OpeyemiMoses/VERA.git
cd compliant-escrow-protocol

# Install Smart Contracts dependencies
cd contracts && npm install

# Install SDK dependencies
cd ../sdk && npm install

# Install Frontend dApp dependencies
cd ../app && npm install
```

### 3. Running Environment Setup

The repository comes pre-configured with active Monad Testnet environment parameters in `app/.env.local`:

```env
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_CHAIN_NAME=Monad Testnet
NEXT_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_FACTORY_ADDRESS=0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334
NEXT_PUBLIC_ATOKEN_ADDRESS=0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03
NEXT_PUBLIC_CATKN_ADDRESS=0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03
NEXT_PUBLIC_ATTESTOR_ADDRESS=0x4070E534B84cC01e62a685c96d165dEedaC39f58
CLEANVERSE_API_URL=https://api.cleanverse.com
```

### 4. Running Smart Contract Tests

```bash
cd contracts
npx hardhat test
# All 7 unit tests passing
```

### 5. Running the Frontend dApp

```bash
cd app
npm run dev
# Open http://localhost:3005 in your browser
```

---

## Alignment with Hackathon Judging Criteria (100 Pts Total)

| Criteria | Weight | How Vera Protocol Achieves It |
|---|:---:|---|
| **Depth of CVI & CVA Integration** | **30 Pts** | Integrates A-Pass identity, Validator Pool rules, ECDSA signatures, and FATF Travel Rule PDF exports directly inside smart contract state transitions. |
| **Build Quality & Feasibility** | **25 Pts** | Deployed on Monad Testnet (`10143`) with 0 TypeScript build errors, comprehensive unit test suite, and clean architecture. |
| **Originality & Innovation** | **20 Pts** | Introduces identity-gated escrow primitives with trust-adjusted collateral and automated regulatory compliance. |
| **User Experience & Design** | **15 Pts** | Responsive design across mobile and desktop, featuring both live Web3 Production Mode and interactive persona testing. |
| **Monad Ecosystem Fit** | **10 Pts** | Configured specifically for Monad Testnet with low transaction overhead and fast settlement flow. |

---

## Repository Directory Structure

```
compliant-escrow-protocol/
├── .github/                      # GitHub issue templates, PR template, & workflows
├── contracts/                    # Hardhat Solidity smart contracts
│   ├── contracts/
│   │   ├── Escrow.sol            # Core compliance-gated escrow contract
│   │   ├── EscrowFactory.sol     # Escrow deployment factory & registry
│   │   └── MockAToken.sol        # cATKN ERC-20 token with on-chain public faucet
│   ├── scripts/                  # Hardhat deployment scripts
│   └── test/                     # Hardhat unit test suite
├── sdk/                          # TypeScript Cleanverse SDK
│   └── src/
│       ├── services/             # Cleanverse REST API, attestor, & AES encryption
│       ├── sdk/                  # CompliantEscrowSDK entry point
│       └── demo-runner.ts        # Headless E2E runner
└── app/                          # Next.js 14 App Router frontend dApp
    └── src/
        ├── app/                  # Next.js routes & API handlers
        ├── components/           # UI components (Header, Sidebar, Modals, etc.)
        ├── context/              # State management (PersonaContext, DealsContext)
        ├── hooks/                # Wagmi contract write & read hooks
        ├── lib/                  # On-chain contract ABIs, Viem client, & deal indexer
        └── types/                # TypeScript interfaces
```

---

## Community & Open Source Governance

To ensure high standards of collaboration, security, and contribution, this repository includes:
- [**Code of Conduct**](CODE_OF_CONDUCT.md): Contributor Covenant v2.1 standards.
- [**Contributing Guidelines**](CONTRIBUTING.md): Code style, commit conventions, and PR process.
- [**Security Policy**](SECURITY.md): Responsible disclosure policy for reporting vulnerabilities.
- [**License**](LICENSE): Released under the permissive **MIT License**.

---

## Contact & Support

For inquiries regarding Vera Protocol or Cleanverse integration details, please open an issue in this repository.
