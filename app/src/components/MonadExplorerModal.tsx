'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Copy, ExternalLink, ShieldCheck, Cpu, Layers, ArrowUpRight, Lock, Clock, Zap } from 'lucide-react';
import { usePersona } from '../context/PersonaContext';

interface MonadExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash: string | null;
  txType?: 'deployment' | 'deposit' | 'attestation' | 'release';
  contractAddress?: string;
  amount?: string;
  initiatorName?: string;
  counterpartyName?: string;
}

export const MonadExplorerModal: React.FC<MonadExplorerModalProps> = ({
  isOpen,
  onClose,
  txHash,
  txType = 'deposit',
  contractAddress = '0x2E4Bab934774B71445d848CA3094345503ADd13E',
  amount = '500 cATKN',
  initiatorName = 'Bob (Verified Freelancer)',
  counterpartyName = 'Alice (Client)',
}) => {
  const { appMode } = usePersona();
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isOpen && txHash && appMode === 'production') {
      window.open(`https://testnet.monadexplorer.com/tx/${txHash}`, '_blank');
      onClose();
    }
  }, [isOpen, txHash, appMode, onClose]);

  if (!isOpen || !txHash || appMode === 'production') return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTxTitle = () => {
    switch (txType) {
      case 'deployment':
        return 'Escrow Smart Contract Deployment';
      case 'deposit':
        return 'Buyer Escrow Deposit & Liquidity Lock';
      case 'attestation':
        return 'Cleanverse ZK Deliverable Attestation';
      case 'release':
        return 'On-Chain Payout Release & Seller Settlement';
      default:
        return 'Monad EVM Transaction Details';
    }
  };

  const getMethodName = () => {
    switch (txType) {
      case 'deployment':
        return 'createEscrowVault(address,uint256)';
      case 'deposit':
        return 'depositEscrow(uint256,bytes32)';
      case 'attestation':
        return 'submitAttestationPayload(bytes32,string)';
      case 'release':
        return 'releasePayoutToProvider(address)';
      default:
        return 'executeTransaction()';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="neu-card max-w-2xl w-full overflow-hidden relative transition-colors border-2 border-indigo-500/40">
        {/* Modal Top Explorer Header */}
        <div className="bg-[#0b0e15] text-white p-6 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-900 transition-all"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 font-mono">
            <Cpu className="h-4 w-4 text-purple-400" /> MONADVISION EXPLORER · CHAIN ID 10143 (MONAD TESTNET)
          </div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            {getTxTitle()}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> CONFIRMED (SUCCESS)
            </span>
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono">
              6 Block Confirmations
            </span>
          </div>
        </div>

        {/* Explorer Content Body */}
        <div className="p-6 space-y-5 text-xs font-mono">
          {/* Tx Hash Row */}
          <div className="neu-inset p-4 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">TRANSACTION HASH</span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold text-xs break-all">
                {txHash}
              </span>
              <button
                onClick={handleCopy}
                className="neu-btn-secondary px-2.5 py-1 text-[10px] font-bold flex items-center gap-1 flex-shrink-0"
              >
                <Copy className="h-3 w-3 text-slate-400" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="neu-inset p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">BLOCK NUMBER</span>
              <p className="font-extrabold text-slate-900 dark:text-white">#14,892,301</p>
              <span className="text-[9px] text-slate-500">Monad Testnet Block Height</span>
            </div>

            <div className="neu-inset p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">METHOD CALL</span>
              <p className="font-extrabold text-purple-600 dark:text-purple-400 truncate">{getMethodName()}</p>
              <span className="text-[9px] text-slate-500">Escrow Function Selector</span>
            </div>

            <div className="neu-inset p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">FROM (SIGNER)</span>
              <p className="font-extrabold text-indigo-600 dark:text-indigo-400 truncate">{counterpartyName}</p>
              <span className="text-[9px] text-slate-500">Authorized Persona Wallet</span>
            </div>

            <div className="neu-inset p-3.5 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">TO (CONTRACT)</span>
              <p className="font-extrabold text-cyan-600 dark:text-cyan-400 truncate">{contractAddress.slice(0, 10)}...{contractAddress.slice(-6)}</p>
              <span className="text-[9px] text-slate-500">Escrow Vault Contract</span>
            </div>
          </div>

          {/* Transaction Value & Gas Breakdown */}
          <div className="neu-inset p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">TRANSACTION VALUE:</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-sm">{amount}</span>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-slate-300/40 dark:border-slate-800/60 pt-2">
              <span className="text-slate-400 font-bold">TRAVEL RULE ATTESTATION:</span>
              <span className="font-extrabold text-emerald-500 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> VERIFIED A-PASS SIGNATURE
              </span>
            </div>
          </div>

          {/* Event Log Decoding */}
          <div className="neu-inset p-4 space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">ON-CHAIN EVENT LOG DECODING</span>
            <pre className="bg-slate-950 text-cyan-400 p-3 rounded-lg text-[10px] overflow-x-auto whitespace-pre-wrap font-mono border border-slate-800">
{`[Topic 0] 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
Event: EscrowStateChanged(
  vault: ${contractAddress},
  status: "${txType.toUpperCase()}",
  participant: "${counterpartyName}",
  amount: "${amount}"
)`}
            </pre>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <a
              href={`https://testnet.monadexplorer.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="neu-btn-secondary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5 text-indigo-500" />
              <span>Try Live Monad Explorer ↗</span>
            </a>

            <button
              onClick={onClose}
              className="neu-btn-primary px-6 py-2.5 text-xs font-bold"
            >
              Close Explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
