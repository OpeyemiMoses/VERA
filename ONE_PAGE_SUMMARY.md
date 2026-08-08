# 📄 Vera Protocol — One-Page Hackathon Summary

> **Submission for Cleanverse Verified Finance Hackathon**  
> **Track:** DeFi & Infrastructure | **Network:** Monad Testnet (`Chain ID 10143`)  
> **Submission Email Target:** `isaac@cleanverse.com`  

---

## 🚀 1. Executive Problem & Solution

### **The Problem:**
In Web3, escrow is a foundational primitive for freelance work, OTC token trading, audit retainers, and cross-border commercial settlement. However, current smart contract escrows suffer from two fatal vulnerabilities:
1. **Zero Identity Verification:** Anyone with a disposable wallet can accept high-value contracts or drain escrow pools.
2. **Zero Regulatory Compliance:** Legacy escrows lack FATF Travel Rule audit reports, sanctions screening, and verifiable compliance records.

### **The Solution:**
**Vera Protocol** is a compliant, identity-gated on-chain settlement protocol deployed on **Monad Testnet**. Acting as *"Stripe Connect for Web3 Settlement"*, Vera Protocol ensures that funds locked in `EscrowFactory.sol` can only be claimed when cryptographically validated by Cleanverse A-Pass identity tiers, Validator Pool rules, and EIP-712 ECDSA attestations.

---

## 🔗 2. Deployed Chains & Live Smart Contracts

| Contract Component | Monad Testnet Address (Chain ID: 10143) | Verified Role |
|---|---|---|
| **EscrowFactory.sol** | `0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334` | Factory contract deploying isolated compliance escrows |
| **cATKN Token (MockAToken.sol)** | `0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03` | Cleanverse cATKN compliance settlement token + live faucet |
| **Attestor / Relayer** | `0x4070E534B84cC01e62a685c96d165dEedaC39f58` | Verified EIP-712 ECDSA backend compliance signer |

---

## 🛡️ 3. Cleanverse CVI & CVA Integration Points (30% Judging Weight)

Vera Protocol deeply integrates four Cleanverse Verified Finance primitives into every transaction:

1. **A-Pass Identity Tier Gating (`Escrow.sol`)**:
   - Escrows enforce minimum Cleanverse A-Pass tier levels (e.g. Tier 25+).
   - Unverified wallets (no A-Pass) or wallets flagged in prohibited regions (e.g. Russia - OFAC sanctions) are automatically blocked on-chain during `acceptWithAttestation()`.

2. **EIP-712 ECDSA Backend Attestations (`/sdk` & REST API)**:
   - When a participant attempts to accept an escrow deal, the Cleanverse backend verifies their identity, signs a cryptographic EIP-712 ECDSA attestation with a deadline, and submits it on-chain to `Escrow.sol`.

3. **cATKN Token Asset Settlement (`MockAToken.sol`)**:
   - All escrow pools lock and settle in Cleanverse `cATKN` compliance tokens on Monad Testnet, backed by a live on-chain faucet enforcing a 24-hour per-wallet cooldown.

4. **FATF Travel Rule PDF Audit Reports & On-Chain Audit Ledger**:
   - Every completed escrow payout automatically compiles a cryptographic FATF Travel Rule PDF report containing originator, beneficiary, transaction hash, and validator pool IDs.
   - The user profile modal features an immutable **Transaction History & Audit Ledger** displaying EVM transaction hashes (`0x...`), copy hash buttons, and direct Monad Explorer links.

---

## 🏗️ 4. System Architecture & Developer SDK

```
                       +------------------------------------------+
                       |         Vera Protocol dApp UI            |
                       |  (Production Web3 + 7-Persona Sandbox)   |
                       +--------------------+---------------------+
                                            |
                                            v
                       +--------------------+---------------------+
                       |     Cleanverse SDK (@vera/escrow-sdk)    |
                       |  (AES-128 Payload + EIP-712 Attestor)    |
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

- **Developer SDK (`/sdk`)**: Reusable NPM package allowing any Web3 dApp, DAO treasury, or OTC desk to embed identity-gated escrow settlement into their platform with 3 lines of code.

---

## 📊 5. Key Metrics & Hackathon Alignment

- **Build Quality (25%)**: 0 compilation errors (`npx tsc --noEmit`), 7/7 Hardhat tests passing, dual-mode Web3 dApp (MetaMask/RainbowKit) + interactive 7-persona sandbox matrix.
- **Concept (20%)**: Re-imagines escrows as institutional settlement infrastructure.
- **UX & Demo (15%)**: Mobile-responsive glassmorphism interface, policy playground simulator, and real-time wallet connection/disconnection state engine.
- **Scalability (10%)**: Factory pattern scales to thousands of concurrent escrows on Monad's high-throughput architecture.
