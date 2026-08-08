# Contributing to Vera Protocol

First off, thank you for considering contributing to **Vera Protocol**! It's people like you that make Vera Protocol a powerful, compliant escrow primitive for Web3.

---

## 🚀 How Can I Contribute?

### 1. Reporting Bugs
Before creating bug reports, please check existing issues to ensure the bug hasn't already been reported. When creating a bug report, please include:
- A clear, descriptive title.
- Steps to reproduce the problem.
- Expected vs. actual behavior.
- Relevant code snippets, transaction hashes, or console logs.

### 2. Suggesting Enhancements
Feature requests and suggestions are always welcome! Please open a Feature Request issue detailing:
- Use case or rationale for the feature.
- Proposed implementation details if available.

### 3. Pull Requests
1. **Fork the Repository**: Create your own feature branch (`git checkout -b feature/amazing-feature`).
2. **Commit Your Changes**: Follow Conventional Commits format (`feat: add new escrow compliance rule`, `fix: resolve balance polling delay`).
3. **Run Tests**: Ensure all smart contract tests pass before submitting (`cd contracts && npx hardhat test`).
4. **Run TypeScript Verification**: Ensure 0 build errors (`cd app && npx tsc --noEmit`).
5. **Open a Pull Request**: Fill out the PR template completely.

---

## 🛠️ Code Conventions

### Smart Contracts (`/contracts`)
- Written in **Solidity 0.8.24** using EVM Cancun target rules.
- Follow OpenZeppelin 5.x inheritance and NatSpec documentation standards.
- Ensure custom errors (`error InvalidAddress()`) are preferred over verbose revert strings where applicable.

### TypeScript SDK & Frontend (`/sdk` & `/app`)
- Use strict TypeScript types. Avoid using `any` unless interacting with legacy window objects.
- Components in `/app` should use standard Tailwind CSS classes.
- Handle Web3 wallet connection states gracefully.

---

## 📜 Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).
