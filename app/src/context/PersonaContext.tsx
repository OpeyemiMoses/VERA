'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ethers } from 'ethers';
import { CATKN_ADDRESS, CATKN_ABI, CATKN_DECIMALS } from '../lib/contracts';
import { useToast } from './ToastContext';

import { calculateTrustScore, TrustScoreDetails } from '../utils/trustEngine';

export interface Persona {
  id: string;
  name: string;
  role: string;
  country: string;
  tier: number;
  walletAddress: string;
  isVerified: boolean;
  statusText: string;
  avatarBg: string;
}

export type AppMode = 'demo' | 'production';

export const MOCK_PERSONAS: Record<string, Persona> = {
  alice: {
    id: 'alice',
    name: 'Alice (Client)',
    role: 'Escrow Buyer / Client',
    country: 'SG',
    tier: 25,
    walletAddress: '0x0b7E601E0c41B7Ac3Ce5177cb5c37A37B84a4d16',
    isVerified: true,
    statusText: 'Connected · Verified Tier 25 (Singapore)',
    avatarBg: 'bg-cyan-500',
  },
  bob: {
    id: 'bob',
    name: 'Bob (Verified Freelancer)',
    role: 'Web3 Senior Dev',
    country: 'US',
    tier: 30,
    walletAddress: '0x76A470f543373b596af06a52240EC779da5AEDb6',
    isVerified: true,
    statusText: 'Connected · Verified Tier 30 (United States)',
    avatarBg: 'bg-purple-600',
  },
  charlie: {
    id: 'charlie',
    name: 'Charlie (Unverified)',
    role: 'New Freelancer',
    country: 'UNVERIFIED',
    tier: 0,
    walletAddress: '0xb04e127DCAbD209230DB3b02eC74e8c46dAE9C6d',
    isVerified: false,
    statusText: 'Connected · Identity Unverified (No A-Pass)',
    avatarBg: 'bg-slate-600',
  },
  vlad: {
    id: 'vlad',
    name: 'Vlad (Sanctioned Region)',
    role: 'Freelancer',
    country: 'RU',
    tier: 15,
    walletAddress: '0x322eDcd1674056A82E14c9b829a532e25f101C08',
    isVerified: false,
    statusText: 'Connected · Sanction Flag (Russia - OFAC Blocked)',
    avatarBg: 'bg-rose-600',
  },
  diana: {
    id: 'diana',
    name: 'Diana (Enterprise Buyer)',
    role: 'DAO Treasury Manager',
    country: 'CH',
    tier: 40,
    walletAddress: '0xA1B2c3D4e5F6a7B8C9D0e1F2a3B4C5D6E7F8A9B0',
    isVerified: true,
    statusText: 'Connected · Verified Tier 40 (Switzerland)',
    avatarBg: 'bg-emerald-500',
  },
  marcus: {
    id: 'marcus',
    name: 'Marcus (Senior Designer)',
    role: 'UI/UX & Brand Strategist',
    country: 'DE',
    tier: 35,
    walletAddress: '0xB2C3d4E5f6A7b8C9D0E1f2A3b4C5d6E7F8a9B0C1',
    isVerified: true,
    statusText: 'Connected · Verified Tier 35 (Germany)',
    avatarBg: 'bg-amber-500',
  },
  zara: {
    id: 'zara',
    name: 'Zara (Smart Contract Auditor)',
    role: 'Security Researcher · Top Auditor',
    country: 'AE',
    tier: 45,
    walletAddress: '0xC3D4e5F6A7B8c9D0e1F2a3B4c5D6e7F8A9b0C1D2',
    isVerified: true,
    statusText: 'Connected · Verified Tier 45 (UAE) — Elite Auditor',
    avatarBg: 'bg-rose-500',
  },
};

export const getPersonaKeyByWallet = (walletAddress?: string): string => {
  if (!walletAddress) return 'alice';
  const lower = walletAddress.toLowerCase();
  for (const [key, p] of Object.entries(MOCK_PERSONAS)) {
    if (p.walletAddress.toLowerCase() === lower) return key;
  }
  return 'prod-wallet';
};

interface PersonaContextType {
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;
  toggleAppMode: () => void;
  activePersonaKey: string;
  activePersona: Persona;
  setActivePersonaKey: (key: string) => void;
  selectedChain: string;
  setSelectedChain: (chain: 'monad') => void;
  isConnected: boolean;
  setIsConnected: (connected: boolean) => void;
  prodWalletAddress: string | null;
  setProdWalletAddress: (addr: string | null) => void;
  connectBrowserWallet: () => Promise<void>;
  isVerifyingProdWallet: boolean;
  recheckProdWallet: (addr?: string) => Promise<void>;
  activeBalance: { catkn: number; mon: string };
  claimFaucet: (personaKey?: string) => void;
  selfIssueAPass: (country?: string, tier?: number) => Promise<void>;
  deductBalance: (amount: number, currency: 'cATKN' | 'MON', personaWalletOrKey?: string) => void;
  addBalance: (amount: number, currency: 'cATKN' | 'MON', personaWalletOrKey?: string) => void;
  hasSufficientBalance: (amount: number, currency: 'cATKN' | 'MON', personaWalletOrKey?: string) => boolean;
  getPersonaBalance: (personaWalletOrKey?: string) => { catkn: number; mon: string };
  getPersonaTrustScore: (personaWalletOrKey?: string) => TrustScoreDetails;
  resetPersonaBalances: () => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { showSuccess, showError, showInfo } = useToast();

  const [appMode, setAppMode] = useState<AppMode>('demo');
  const [activePersonaKey, setActivePersonaKey] = useState<string>('alice');
  const [selectedChain, setSelectedChain] = useState<string>('monad');
  const [isConnected, setIsConnected] = useState<boolean>(true);

  const [prodWalletAddress, setProdWalletAddress] = useState<string | null>(null);
  const [prodApass, setProdApass] = useState<{ isVerified: boolean; tier: number; country: string } | null>(null);
  const [isVerifyingProdWallet, setIsVerifyingProdWallet] = useState<boolean>(false);
  const [balanceNonce, setBalanceNonce] = useState<number>(0);

  // Wallet addresses for known personas (lowercase)
  const ALICE_WALLET   = '0x0b7e601e0c41b7ac3ce5177cb5c37a37b84a4d16';
  const BOB_WALLET     = '0x76a470f543373b596af06a52240ec779da5aedb6';
  const CHARLIE_WALLET = '0xb04e127dcabd209230db3b02ec74e8c46dae9c6d';
  const VLAD_WALLET    = '0x322edcd1674056a82e14c9b829a532e25f101c08';
  const DIANA_WALLET   = '0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';
  const MARCUS_WALLET  = '0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1';
  const ZARA_WALLET    = '0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2';

  const DEFAULT_CATKN: Record<string, number> = {
    alice:            12500,
    bob:              18200,
    charlie:          1000,
    vlad:             0,
    diana:            45000,
    marcus:           22000,
    zara:             55000,
    [ALICE_WALLET]:   12500,
    [BOB_WALLET]:     18200,
    [CHARLIE_WALLET]: 1000,
    [VLAD_WALLET]:    0,
    [DIANA_WALLET]:   45000,
    [MARCUS_WALLET]:  22000,
    [ZARA_WALLET]:    55000,
    'prod-wallet':    5000,
  };

  const DEFAULT_MON: Record<string, string> = {
    alice:            '12.4500',
    bob:              '85.2000',
    charlie:          '1.5000',
    vlad:             '0.0000',
    diana:            '200.0000',
    marcus:           '50.0000',
    zara:             '320.0000',
    [ALICE_WALLET]:   '12.4500',
    [BOB_WALLET]:     '85.2000',
    [CHARLIE_WALLET]: '1.5000',
    [VLAD_WALLET]:    '0.0000',
    [DIANA_WALLET]:   '200.0000',
    [MARCUS_WALLET]:  '50.0000',
    [ZARA_WALLET]:    '320.0000',
    'prod-wallet':    '0.0000',
  };

  const [catknBalances, setCatknBalances] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vera_catkn_v5');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return { ...DEFAULT_CATKN };
  });

  const [realMonBalances, setRealMonBalances] = useState<Record<string, string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vera_mon_v5');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return { ...DEFAULT_MON };
  });

  // ── Live on-chain cATKN balance for Production Mode wallet ─────────────
  const { data: onChainCatknRaw, refetch: refetchOnChainBalance } = useReadContract({
    address: CATKN_ADDRESS,
    abi: CATKN_ABI,
    functionName: 'balanceOf',
    args: [wagmiAddress as `0x${string}`],
    query: { enabled: appMode === 'production' && !!wagmiAddress, refetchInterval: 8000 },
  });
  const onChainCatknBalance = onChainCatknRaw
    ? Math.floor(Number(onChainCatknRaw as bigint) / 10 ** CATKN_DECIMALS)
    : 0;

  // ── On-chain faucet write (Production Mode) ────────────────────────────
  const { writeContractAsync: writeFaucetAsync, data: faucetTxHash } = useWriteContract();
  const { isSuccess: faucetConfirmed, isError: faucetFailed, error: faucetError } = useWaitForTransactionReceipt({
    hash: faucetTxHash,
  });

  // Toast & balance refresh after faucet tx confirms on-chain
  useEffect(() => {
    if (faucetConfirmed) {
      refetchOnChainBalance();
      showSuccess('Faucet Drop Confirmed! +10,000 cATKN credited on-chain to your wallet balance.');
    }
  }, [faucetConfirmed]);

  useEffect(() => {
    if (faucetFailed && faucetError) {
      showError('Faucet Transaction Failed: ' + (faucetError?.message || 'Transaction reverted on-chain.'));
    }
  }, [faucetFailed, faucetError]);

  // Normalize any input (persona key, wallet address, name) → lowercase wallet address key
  const toWalletKey = (personaWalletOrKey?: string): string => {
    if (!personaWalletOrKey) {
      if (appMode === 'production') return 'prod-wallet';
      return MOCK_PERSONAS[activePersonaKey]?.walletAddress.toLowerCase() || ALICE_WALLET;
    }
    if (MOCK_PERSONAS[personaWalletOrKey]) {
      return MOCK_PERSONAS[personaWalletOrKey].walletAddress.toLowerCase();
    }
    const lower = personaWalletOrKey.toLowerCase();
    for (const p of Object.values(MOCK_PERSONAS)) {
      if (p.walletAddress.toLowerCase() === lower) {
        return lower;
      }
    }
    for (const p of Object.values(MOCK_PERSONAS)) {
      if (lower.includes(p.name.split(' ')[0].toLowerCase())) {
        return p.walletAddress.toLowerCase();
      }
    }
    return lower;
  };

  // Helper function to resolve both wallet key and persona ID key
  const resolveKeys = (personaWalletOrKey?: string) => {
    const wKey = toWalletKey(personaWalletOrKey);
    let pKey = (personaWalletOrKey || activePersonaKey).toLowerCase();
    for (const [id, p] of Object.entries(MOCK_PERSONAS)) {
      if (p.walletAddress.toLowerCase() === wKey || id === pKey) {
        pKey = id;
        break;
      }
    }
    return { wKey, pKey };
  };

  // Fetch real on-chain native MON balance from Monad Testnet RPC (Production Mode only)
  useEffect(() => {
    if (appMode !== 'production' || !prodWalletAddress) return;
    const fetchMonBalances = async () => {
      try {
        const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
        const rawBal = await provider.getBalance(prodWalletAddress);
        const formatted = Number(ethers.formatEther(rawBal)).toFixed(4);
        setRealMonBalances((prev) => ({ ...prev, ['prod-wallet']: formatted }));
      } catch (e) {
        // Fallback gracefully if RPC is rate-limited
      }
    };

    fetchMonBalances();
    const interval = setInterval(fetchMonBalances, 15000);
    return () => clearInterval(interval);
  }, [appMode, prodWalletAddress]);

  const resolveKey = (personaWalletOrKey?: string): string => {
    if (!personaWalletOrKey) {
      return appMode === 'production' ? 'prod-wallet' : activePersonaKey;
    }
    if (MOCK_PERSONAS[personaWalletOrKey]) {
      return personaWalletOrKey;
    }
    const lower = personaWalletOrKey.toLowerCase();
    for (const [key, p] of Object.entries(MOCK_PERSONAS)) {
      const pWallet = p.walletAddress.toLowerCase();
      const pName = p.name.toLowerCase();
      const firstWord = pName.split(' ')[0]; // 'alice', 'bob', 'charlie', 'vlad'

      if (
        key.toLowerCase() === lower ||
        pWallet === lower ||
        lower.includes(pWallet) ||
        pWallet.includes(lower) ||
        lower.includes(key.toLowerCase()) ||
        lower.includes(firstWord) ||
        pName.includes(lower)
      ) {
        return key;
      }
    }
    return lower;
  };

  const claimFaucet = async (personaKey?: string) => {
    // ── PRODUCTION MODE: real on-chain faucet call ─────────────────────
    if (appMode === 'production') {
      if (!wagmiAddress) throw new Error('Connect a Web3 wallet before claiming the faucet.');
      try {
        const tx = await writeFaucetAsync({
          address: CATKN_ADDRESS,
          abi: CATKN_ABI,
          functionName: 'faucet',
        });
        showInfo(`Faucet Transaction Submitted (${tx.slice(0, 10)}...). Confirming on Monad Testnet...`);
      } catch (err: any) {
        if (err?.message?.includes('User rejected') || err?.message?.includes('user rejected')) {
          showError('Faucet transaction rejected in wallet.');
        } else {
          showError('Faucet request failed: ' + (err?.message || 'Transaction error'));
        }
      }
      return;
    }

    // ── DEMO MODE: localStorage simulation ────────────────────────────
    const wKey = toWalletKey(personaKey);
    setCatknBalances((prev) => {
      const current = prev[wKey] ?? DEFAULT_CATKN[wKey] ?? 0;
      const updated = { ...prev, [wKey]: current + 10000 };
      if (typeof window !== 'undefined') localStorage.setItem('vera_catkn_v5', JSON.stringify(updated));
      return updated;
    });
    setBalanceNonce((v) => v + 1);
    showSuccess('Faucet Drop Confirmed! +10,000 cATKN credited to your balance.');
  };

  const deductBalance = (amount: number, currency?: string, personaWalletOrKey?: string) => {
    const { wKey, pKey } = resolveKeys(personaWalletOrKey);
    const isCatkn = !currency || currency.toLowerCase().includes('catkn');

    if (isCatkn) {
      setCatknBalances((prev) => {
        const current = prev[wKey] ?? prev[pKey] ?? DEFAULT_CATKN[wKey] ?? 0;
        const newBal = Math.max(0, current - amount);
        const updated = { ...prev, [wKey]: newBal, [pKey]: newBal };
        if (typeof window !== 'undefined') localStorage.setItem('vera_catkn_v5', JSON.stringify(updated));
        return updated;
      });
    } else {
      setRealMonBalances((prev) => {
        const current = parseFloat(prev[wKey] || prev[pKey] || '0');
        const newBal = Math.max(0, current - amount).toFixed(4);
        const updated = { ...prev, [wKey]: newBal, [pKey]: newBal };
        if (typeof window !== 'undefined') localStorage.setItem('vera_mon_v5', JSON.stringify(updated));
        return updated;
      });
    }
    setBalanceNonce((v) => v + 1);
  };

  const addBalance = (amount: number, currency?: string, personaWalletOrKey?: string) => {
    const { wKey, pKey } = resolveKeys(personaWalletOrKey);
    const isCatkn = !currency || currency.toLowerCase().includes('catkn');

    if (isCatkn) {
      setCatknBalances((prev) => {
        const current = prev[wKey] ?? prev[pKey] ?? DEFAULT_CATKN[wKey] ?? 0;
        const newBal = current + amount;
        const updated = { ...prev, [wKey]: newBal, [pKey]: newBal };
        if (typeof window !== 'undefined') localStorage.setItem('vera_catkn_v5', JSON.stringify(updated));
        return updated;
      });
    } else {
      setRealMonBalances((prev) => {
        const current = parseFloat(prev[wKey] || prev[pKey] || '0');
        const newBal = (current + amount).toFixed(4);
        const updated = { ...prev, [wKey]: newBal, [pKey]: newBal };
        if (typeof window !== 'undefined') localStorage.setItem('vera_mon_v5', JSON.stringify(updated));
        return updated;
      });
    }
    setBalanceNonce((v) => v + 1);
  };

  const resetPersonaBalances = () => {
    const freshCatkn = { ...DEFAULT_CATKN };
    const freshMon = { ...DEFAULT_MON };
    setCatknBalances(freshCatkn);
    setRealMonBalances(freshMon);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vera_catkn_v3');
      localStorage.removeItem('vera_catkn_v4');
      localStorage.removeItem('vera_mon_v3');
      localStorage.removeItem('vera_mon_v4');
      localStorage.removeItem('vera_catkn_v4');
      localStorage.removeItem('vera_mon_v4');
      localStorage.setItem('vera_catkn_v5', JSON.stringify(freshCatkn));
      localStorage.setItem('vera_mon_v5', JSON.stringify(freshMon));
    }
    setBalanceNonce((v) => v + 1);
  };

  const toggleAppMode = () => {
    setAppMode((prev) => (prev === 'demo' ? 'production' : 'demo'));
  };

  // Auto-sync dashboard selectedChain with connected Web3 wallet chain in Production Mode
  useEffect(() => {
    if (appMode === 'production' && chainId) {
      if (chainId !== 10143 && switchChain) {
        try {
          switchChain({ chainId: 10143 });
        } catch (e) {
          console.error('Failed to switch to Monad Testnet:', e);
        }
      }
    }
  }, [chainId, appMode]);

  // Handle chain selection with wallet network switch trigger
  const handleSelectChain = (chain: 'monad') => {
    setSelectedChain('monad');
    if (appMode === 'production' && switchChain) {
      try {
        switchChain({ chainId: 10143 });
      } catch (e) {
        console.error('Failed to switch wallet chain:', e);
      }
    }
  };

  // Sync Wagmi connected wallet address automatically + reset UI on disconnect
  useEffect(() => {
    if (wagmiAddress) {
      // Wallet connected / changed
      setProdWalletAddress(wagmiAddress);
      verifyProdWallet(wagmiAddress);
    } else {
      // Wallet disconnected — clear all production state and zero balances immediately
      setProdWalletAddress(null);
      setProdApass(null);
      // Zero out the prod-wallet MON balance in state so the UI updates instantly
      setRealMonBalances((prev) => ({ ...prev, 'prod-wallet': '0.0000' }));
      // cATKN auto-zeros via onChainCatknBalance (useReadContract disabled when wagmiAddress is null)
      setBalanceNonce((v) => v + 1);
    }
  }, [wagmiAddress]);

  // Attempt to connect browser Web3 wallet fallback
  const connectBrowserWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        setIsVerifyingProdWallet(true);
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts[0]) {
          setProdWalletAddress(accounts[0]);
          await verifyProdWallet(accounts[0]);
        }
      } catch (err) {
        console.error('Wallet connection error:', err);
      } finally {
        setIsVerifyingProdWallet(false);
      }
    }
  };

  // Verify wallet against live Cleanverse API
  const verifyProdWallet = async (address: string) => {
    setIsVerifyingProdWallet(true);
    try {
      const res = await fetch('/api/cleanverse/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: address, chain: selectedChain }),
      });
      const data = await res.json();
      if (data.allowed) {
        setProdApass({
          isVerified: true,
          tier: data.tier || 25,
          country: data.country || 'US',
        });
      } else {
        setProdApass({
          isVerified: false,
          tier: data.tier || 0,
          country: data.country || 'UNVERIFIED',
        });
      }
    } catch (err) {
      setProdApass({ isVerified: false, tier: 0, country: 'UNVERIFIED' });
    } finally {
      setIsVerifyingProdWallet(false);
    }
  };

  // Self-issue Cleanverse CVI A-Pass Credential for connected Web3 wallet (or active persona)
  const selfIssueAPass = async (country: string = 'US', tier: number = 30) => {
    const targetAddress = appMode === 'production' ? prodWalletAddress || wagmiAddress : activePersona.walletAddress;
    if (!targetAddress) {
      showError('Please connect a Web3 wallet or select an active persona first.');
      return;
    }

    setIsVerifyingProdWallet(true);
    try {
      const res = await fetch('/api/cleanverse/apass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: targetAddress, country, tier }),
      });
      const data = await res.json();
      if (data.success) {
        setProdApass({
          isVerified: true,
          tier: tier,
          country: country,
        });
        showSuccess(`Cleanverse CVI A-Pass Issued! Wallet ${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)} registered at Tier ${tier} (${country}).`);
        await verifyProdWallet(targetAddress);
      } else {
        showError(data.error || 'Failed to issue Cleanverse A-Pass.');
      }
    } catch (err: any) {
      showError(`A-Pass issuance error: ${err.message}`);
    } finally {
      setIsVerifyingProdWallet(false);
    }
  };

  // Compute Active Persona based on Mode
  let activePersona: Persona;
  if (appMode === 'production') {
    if (prodWalletAddress) {
      const isVerified = prodApass?.isVerified ?? false;
      const tier = prodApass?.tier ?? 0;
      const country = prodApass?.country || 'UNVERIFIED';

      activePersona = {
        id: 'prod-wallet',
        name: `Live Wallet (${prodWalletAddress.slice(0, 6)}...${prodWalletAddress.slice(-4)})`,
        role: isVerified ? 'Cleanverse Verified Participant' : 'Unverified Web3 Wallet',
        country: country,
        tier: tier,
        walletAddress: prodWalletAddress,
        isVerified: isVerified,
        statusText: isVerified
          ? `Production Mode · Cleanverse Live Verified (Tier ${tier})`
          : `Production Mode · Unverified Identity (No Cleanverse A-Pass)`,
        avatarBg: isVerified ? 'bg-cyan-500' : 'bg-slate-600',
      };
    } else {
      activePersona = {
        id: 'prod-disconnected',
        name: 'Web3 Wallet Disconnected',
        role: 'Connect Wallet to Transact',
        country: 'N/A',
        tier: 0,
        walletAddress: '0x0000000000000000000000000000000000000000',
        isVerified: false,
        statusText: 'Production Mode · Please Connect Web3 Wallet',
        avatarBg: 'bg-slate-600',
      };
    }
  } else {
    activePersona = MOCK_PERSONAS[activePersonaKey] || MOCK_PERSONAS.alice;
  }

  const recheckProdWallet = async (addr?: string) => {
    const target = addr || prodWalletAddress || wagmiAddress;
    if (target) {
      await verifyProdWallet(target);
    }
  };

  const hasSufficientBalance = (amount: number, currency: 'cATKN' | 'MON', personaWalletOrKey?: string): boolean => {
    const { wKey, pKey } = resolveKeys(personaWalletOrKey);
    if (currency === 'cATKN') {
      const current = catknBalances[wKey] ?? catknBalances[pKey] ?? DEFAULT_CATKN[wKey] ?? 0;
      return current >= amount;
    } else {
      const current = parseFloat(realMonBalances[wKey] ?? realMonBalances[pKey] ?? '0');
      return current >= amount;
    }
  };

  const getPersonaBalance = (personaWalletOrKey?: string): { catkn: number; mon: string } => {
    const { wKey, pKey } = resolveKeys(personaWalletOrKey);
    return {
      catkn: catknBalances[wKey] ?? catknBalances[pKey] ?? DEFAULT_CATKN[wKey] ?? 0,
      mon: realMonBalances[wKey] ?? realMonBalances[pKey] ?? DEFAULT_MON[wKey] ?? '0.0000',
    };
  };

  const getPersonaTrustScore = (personaWalletOrKey?: string): TrustScoreDetails => {
    const wKey = toWalletKey(personaWalletOrKey);
    let targetPersona: Persona | null = null;

    if (appMode === 'production' && (!personaWalletOrKey || personaWalletOrKey === 'prod-wallet')) {
      targetPersona = activePersona;
    } else {
      for (const p of Object.values(MOCK_PERSONAS)) {
        if (p.walletAddress.toLowerCase() === wKey || p.id.toLowerCase() === personaWalletOrKey?.toLowerCase()) {
          targetPersona = p;
          break;
        }
      }
      if (!targetPersona) targetPersona = activePersona;
    }

    const demoDealsMap: Record<string, number> = {
      alice: 3,    // 3 completed deals → +15 pts
      bob: 5,      // 5 completed deals → +25 pts
      charlie: 0,  // Unverified, no history → +0 pts
      vlad: 0,     // Sanctioned, no active history → +0 pts
      diana: 6,    // 6 completed enterprise deals → +30 pts (MAX)
      marcus: 4,   // 4 completed design jobs → +20 pts
      zara: 8,     // 8 completed audits → +30 pts (MAX)
    };
    const demoDealsCount = demoDealsMap[targetPersona.id] ?? 0;
    return calculateTrustScore(targetPersona, demoDealsCount, 0);
  };

  // Active persona's wallet key
  const activePersonaId = activePersonaKey.toLowerCase();
  const activeWalletKey = appMode === 'production' ? 'prod-wallet' : (activePersona?.walletAddress?.toLowerCase() || ALICE_WALLET);

  // In Production Mode: immediately show 0 balances if wallet is disconnected
  const isWalletDisconnected = appMode === 'production' && !wagmiAddress;
  const activeBalance = {
    // Production Mode: live on-chain cATKN balance (0 when disconnected) | Demo Mode: localStorage
    catkn: isWalletDisconnected
      ? 0
      : appMode === 'production'
        ? onChainCatknBalance
        : (catknBalances[activeWalletKey] ?? catknBalances[activePersonaId] ?? DEFAULT_CATKN[activeWalletKey] ?? 0),
    mon: isWalletDisconnected
      ? '0.0000'
      : (realMonBalances[activeWalletKey] ?? realMonBalances[activePersonaId] ?? DEFAULT_MON[activeWalletKey] ?? '0.0000'),
    _version: balanceNonce,
  };

  return (
    <PersonaContext.Provider
      value={{
        appMode,
        setAppMode,
        toggleAppMode,
        activePersonaKey,
        activePersona,
        setActivePersonaKey,
        selectedChain,
        setSelectedChain: handleSelectChain,
        isConnected,
        setIsConnected,
        prodWalletAddress,
        setProdWalletAddress,
        connectBrowserWallet,
        isVerifyingProdWallet,
        recheckProdWallet,
        activeBalance,
        claimFaucet,
        selfIssueAPass,
        deductBalance,
        addBalance,
        hasSufficientBalance,
        getPersonaBalance,
        getPersonaTrustScore,
        resetPersonaBalances,
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
};
