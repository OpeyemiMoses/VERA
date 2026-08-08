'use client';

import { useState, useCallback } from 'react';
import { ethers, BrowserProvider, Contract, JsonRpcProvider } from 'ethers';

// ── ABIs (minimal) ──────────────────────────────────────────────────────────
const FACTORY_ABI = [
  'function createEscrow(address token, address client, address freelancer, uint256 amount, uint256 deliveryDeadline, uint256 confirmWindow, bytes32 jobId) external returns (address escrow)',
  'event EscrowCreated(address indexed escrow, address indexed client, address indexed freelancer, uint256 amount)',
];

const ESCROW_ABI = [
  'function fund(uint256 amount) external',
  'function acceptWithAttestation(bytes calldata attestation) external',
  'function confirmDelivery() external',
  'function cancelAndRefund() external',
  'function getState() external view returns (uint8)',
  'function amount() external view returns (uint256)',
  'function client() external view returns (address)',
  'function freelancer() external view returns (address)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function mint(address to, uint256 amount) external', // MockAToken only
];

// ── Config ──────────────────────────────────────────────────────────────────
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334';
const ATOKEN_ADDRESS = process.env.NEXT_PUBLIC_ATOKEN_ADDRESS || '0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://testnet-rpc.monad.xyz';

// ── Read-only provider (no wallet needed) ───────────────────────────────────
function getReadProvider(): JsonRpcProvider {
  return new JsonRpcProvider(RPC_URL);
}

// ── Wallet provider using injected private key (demo persona mode) ──────────
function getSignerFromKey(privateKey: string): ethers.Wallet {
  const provider = new JsonRpcProvider(RPC_URL);
  return new ethers.Wallet(privateKey, provider);
}

// ── Hook ────────────────────────────────────────────────────────────────────
export interface EscrowCallResult {
  success: boolean;
  txHash?: string;
  escrowAddress?: string;
  error?: string;
}

export function useEscrow() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Mint cATKN to persona wallet (testnet only — MockAToken)
  const mintTokens = useCallback(async (recipientPrivKey: string, amountTokens: number): Promise<EscrowCallResult> => {
    setIsLoading(true);
    try {
      const signer = getSignerFromKey(recipientPrivKey);
      const token = new Contract(ATOKEN_ADDRESS, ERC20_ABI, signer);
      const amount = ethers.parseUnits(amountTokens.toString(), 18);
      const tx = await token.mint(await signer.getAddress(), amount);
      await tx.wait();
      setLastTxHash(tx.hash);
      return { success: true, txHash: tx.hash };
    } catch (e: any) {
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Deploy a new Escrow via EscrowFactory
  const createEscrow = useCallback(async (
    clientPrivKey: string,
    freelancerAddress: string,
    amountTokens: number,
    deliveryHours: number
  ): Promise<EscrowCallResult> => {
    setIsLoading(true);
    try {
      const signer = getSignerFromKey(clientPrivKey);
      const clientAddress = await signer.getAddress();
      const factory = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
      const token = new Contract(ATOKEN_ADDRESS, ERC20_ABI, signer);
      const amount = ethers.parseUnits(amountTokens.toString(), 18);
      const deliverySecs = BigInt(deliveryHours * 3600);
      const confirmSecs = BigInt(24 * 3600);
      const jobId = ethers.keccak256(ethers.toUtf8Bytes(`job-${Date.now()}`));

      // Approve factory to spend tokens
      const approveTx = await token.approve(FACTORY_ADDRESS, amount);
      await approveTx.wait();

      // Create escrow
      const tx = await factory.createEscrow(
        ATOKEN_ADDRESS,
        clientAddress,
        freelancerAddress,
        amount,
        deliverySecs,
        confirmSecs,
        jobId
      );
      const receipt = await tx.wait();

      // Extract escrow address from EscrowCreated event
      const iface = new ethers.Interface(FACTORY_ABI);
      let escrowAddress = '';
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === 'EscrowCreated') {
            escrowAddress = parsed.args.escrow;
            break;
          }
        } catch {}
      }

      setLastTxHash(tx.hash);
      return { success: true, txHash: tx.hash, escrowAddress };
    } catch (e: any) {
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fund an existing escrow
  const fundEscrow = useCallback(async (
    clientPrivKey: string,
    escrowAddress: string,
    amountTokens: number
  ): Promise<EscrowCallResult> => {
    setIsLoading(true);
    try {
      const signer = getSignerFromKey(clientPrivKey);
      const token = new Contract(ATOKEN_ADDRESS, ERC20_ABI, signer);
      const escrow = new Contract(escrowAddress, ESCROW_ABI, signer);
      const amount = ethers.parseUnits(amountTokens.toString(), 18);

      const approveTx = await token.approve(escrowAddress, amount);
      await approveTx.wait();

      const tx = await escrow.fund(amount);
      await tx.wait();
      setLastTxHash(tx.hash);
      return { success: true, txHash: tx.hash };
    } catch (e: any) {
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Accept with Cleanverse ECDSA attestation
  const acceptWithAttestation = useCallback(async (
    freelancerPrivKey: string,
    escrowAddress: string,
    attestation: string
  ): Promise<EscrowCallResult> => {
    setIsLoading(true);
    try {
      const signer = getSignerFromKey(freelancerPrivKey);
      const escrow = new Contract(escrowAddress, ESCROW_ABI, signer);
      const tx = await escrow.acceptWithAttestation(attestation);
      await tx.wait();
      setLastTxHash(tx.hash);
      return { success: true, txHash: tx.hash };
    } catch (e: any) {
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Confirm delivery and release funds
  const confirmDelivery = useCallback(async (
    clientPrivKey: string,
    escrowAddress: string
  ): Promise<EscrowCallResult> => {
    setIsLoading(true);
    try {
      const signer = getSignerFromKey(clientPrivKey);
      const escrow = new Contract(escrowAddress, ESCROW_ABI, signer);
      const tx = await escrow.confirmDelivery();
      await tx.wait();
      setLastTxHash(tx.hash);
      return { success: true, txHash: tx.hash };
    } catch (e: any) {
      return { success: false, error: e.message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Read escrow state (0=Created, 1=Funded, 2=Accepted, 3=Completed, 4=Disputed, 5=Cancelled)
  const getEscrowState = useCallback(async (escrowAddress: string): Promise<number> => {
    try {
      const provider = getReadProvider();
      const escrow = new Contract(escrowAddress, ESCROW_ABI, provider);
      const state = await escrow.getState();
      return Number(state);
    } catch {
      return -1;
    }
  }, []);

  // Read cATKN balance
  const getTokenBalance = useCallback(async (walletAddress: string): Promise<string> => {
    try {
      const provider = getReadProvider();
      const token = new Contract(ATOKEN_ADDRESS, ERC20_ABI, provider);
      const balance = await token.balanceOf(walletAddress);
      return ethers.formatUnits(balance, 18);
    } catch {
      return '0';
    }
  }, []);

  return {
    isLoading,
    lastTxHash,
    mintTokens,
    createEscrow,
    fundEscrow,
    acceptWithAttestation,
    confirmDelivery,
    getEscrowState,
    getTokenBalance,
    FACTORY_ADDRESS,
    ATOKEN_ADDRESS,
  };
}
