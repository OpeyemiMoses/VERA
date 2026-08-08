import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
    public: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: 'Vera Protocol — Compliant Escrow Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '108b97a59c125333783efa42faa846d0',
  chains: [monadTestnet],
  ssr: true,
});

export const CHAIN_CONFIG = {
  'monad': {
    id: monadTestnet.id,
    name: 'Monad Testnet',
    rpc: 'https://testnet-rpc.monad.xyz',
    factoryAddress: process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334',
    atokenAddress: process.env.NEXT_PUBLIC_ATOKEN_ADDRESS || '0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03',
    cleanverseChain: 'monad-testnet',
  },
} as const;
