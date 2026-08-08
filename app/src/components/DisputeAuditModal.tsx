'use client';

import React, { useState } from 'react';
import { X, FileText, Download, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useCleanverse } from '../hooks/useCleanverse';

interface DisputeAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillTxHash?: string;
}

export const DisputeAuditModal: React.FC<DisputeAuditModalProps> = ({ isOpen, onClose, prefillTxHash }) => {
  const [txHash, setTxHash] = useState(prefillTxHash || '0x6f5310e52124cadd821e87d065882150c6a80bebdb5d96f4c7f2d0d5027a3');
  const [chain, setChain] = useState('monad-testnet');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const { downloadTravelRuleReport } = useCleanverse();

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloaded(false);
    try {
      // Calls real Cleanverse /download_travel_rule via API route
      await downloadTravelRuleReport(txHash, chain);
      setDownloaded(true);
    } catch (err: any) {
      console.error('Travel Rule download failed:', err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="neu-card p-6 max-w-lg w-full relative transition-colors space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-300/40 dark:border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl neu-inset text-indigo-500 flex items-center justify-center">
              <FileText className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Travel Rule Audit Center</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">Cleanverse Protocol Audit Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-xl transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Dedicated Monad Network Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-bold font-mono">
            <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span>Monad Testnet (Chain ID 10143)</span>
          </div>

          {/* Tx Hash Input */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">On-Chain Transaction Hash</label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full px-4 py-3 neu-inset text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
              placeholder="0x..."
            />
          </div>

          {/* Cleanverse Compliance Info */}
          <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              <span>Cleanverse FATF Travel Rule Compliance Engine</span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              Generates a cryptographically verified FATF Travel Rule compliance audit payload for settled Monad testnet transactions. Output is signed server-side by Cleanverse Protocol.
            </p>
          </div>

          {downloaded && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Travel Rule PDF downloaded successfully!
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={isDownloading || !txHash}
            className={`w-full font-bold py-3.5 px-6 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all ${
              isDownloading
                ? 'neu-btn-disabled'
                : 'neu-btn-primary'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>
              {isDownloading
                ? 'Calling Cleanverse /download_travel_rule...'
                : 'Download Travel Rule Audit Report (.PDF)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
