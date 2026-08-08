'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, ArrowRight, Wallet, Lock, CheckCircle2, FileText, Sparkles, Building2, User, AlertCircle, Droplets, Zap } from 'lucide-react';
import { usePersona } from '../context/PersonaContext';
import { useCleanverse } from '../hooks/useCleanverse';
import { useToast } from '../context/ToastContext';
import { useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits } from 'viem';
import { CATKN_ADDRESS, CATKN_ABI, ESCROW_ABI, CATKN_DECIMALS } from '../lib/contracts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: any;
  onPaymentComplete: (dealId: string, customDepositTxHash?: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  deal,
  onPaymentComplete,
}) => {
  const { activePersona, hasSufficientBalance, activeBalance, claimFaucet, deductBalance, getPersonaTrustScore, appMode } = usePersona();
  const { checkCompliance, isChecking } = useCleanverse();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const { showInfo, showError } = useToast();
  const [step, setStep] = useState<'review' | 'verifying' | 'funded'>('review');
  const [txHash, setTxHash] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep('review');
      setTxHash(null);
    }
  }, [isOpen, deal?.id]);

  if (!isOpen || !deal) return null;

  const sufficient = hasSufficientBalance(deal.price, deal.currency);

  // Compute seller's good-faith collateral requirement (based on SELLER's Trust Score)
  const sellerTrust = getPersonaTrustScore(deal.initiatorAddress);
  const isMon = deal.currency === 'MON';
  const rawCollateral = (deal.price * sellerTrust.collateralPct) / 100;
  const collateralAmount = isMon ? parseFloat(rawCollateral.toFixed(4)) : Math.round(rawCollateral);
  const sellerHasSufficientCollateral = appMode === 'production' || collateralAmount === 0 || hasSufficientBalance(collateralAmount, deal.currency, deal.initiatorAddress);

  const handleFundEscrow = async () => {
    if (!sufficient) return;

    // Deduct buyer's full deal price in local state (sandbox mode only)
    if (appMode !== 'production') {
      deductBalance(deal.price, deal.currency, activePersona.walletAddress);

      // Deduct seller's good-faith collateral (sandbox mode only)
      if (collateralAmount > 0) {
        deductBalance(collateralAmount, deal.currency, deal.initiatorAddress);
        console.log('[COLLATERAL] Deducted', collateralAmount, deal.currency, 'from seller', deal.initiatorAddress, `(Trust Score ${sellerTrust.score}/100 → ${sellerTrust.collateralPct}% collateral)`);
      }
    }

    setStep('verifying');

    // ── PRODUCTION MODE: Real Monad Testnet On-Chain Transactions ──────────────
    if (appMode === 'production') {
      try {
        const amount = parseUnits(deal.price.toString(), CATKN_DECIMALS);
        
        // Step 1: Approve cATKN spend
        showInfo('Step 1/2: Please approve token spending in your Web3 wallet...');
        const approveTx = await writeContractAsync({
          address: CATKN_ADDRESS,
          abi: CATKN_ABI,
          functionName: 'approve',
          args: [deal.escrowAddress as `0x${string}`, amount],
        });

        showInfo(`Approval submitted (${approveTx.slice(0, 10)}...). Waiting for Monad block confirmation...`);
        if (publicClient) {
          try {
            await publicClient.waitForTransactionReceipt({ hash: approveTx });
          } catch (rcptErr) {
            console.warn('[RECEIPT] Proceeding with fund after approve:', rcptErr);
          }
        }

        // Step 2: Fund Escrow Contract
        showInfo(`Step 2/2: Confirm Escrow Deposit in your Web3 wallet...`);
        const fundTx = await writeContractAsync({
          address: deal.escrowAddress as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: 'fund',
        });

        setTxHash(fundTx);
        setStep('funded');
        onPaymentComplete(deal.id, fundTx);
      } catch (err: any) {
        setStep('review');
        showError(err?.shortMessage || err?.message || 'On-chain deposit failed or cancelled.');
      }
      return;
    }

    // Demo Mode Simulation
    setTimeout(() => {
      const generatedTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setTxHash(generatedTx);
      setStep('funded');
      onPaymentComplete(deal.id, generatedTx);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="neu-card max-w-xl w-full overflow-hidden relative transition-colors">
        {/* Modal Top Header */}
        <div className="bg-[#0b0e15] text-white p-6 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-900 transition-all"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
            <Lock className="h-3.5 w-3.5" /> SECURE ESCROW CHECKOUT
          </div>
          <h2 className="text-xl font-extrabold text-white">{deal.title}</h2>
          <p className="text-xs text-slate-300 mt-1">
            Category: <span className="font-semibold text-white">{deal.category}</span>
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {step === 'review' && (
            <>
              {/* Identity & Escrow Summary Box */}
              <div className="neu-inset p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Escrow Deposit Amount</span>
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white">{deal.price} {deal.currency}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-300/40 dark:border-slate-800/60 pt-2">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Delivery Deadline:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{deal.deliveryDeadlineHrs || 48}h</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-300/40 dark:border-slate-800/60 pt-2">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Required Identity Tier:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30 font-mono">
                    Tier {deal.minTier}+ Required
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-300/40 dark:border-slate-800/60 pt-2">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Your Wallet Balance:</span>
                  <span className={`font-bold font-mono ${sufficient ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                    {deal.currency === 'cATKN' ? `${activeBalance.catkn.toLocaleString()} cATKN` : `${activeBalance.mon} MON`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-300/40 dark:border-slate-800/60 pt-2">
                  <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-purple-500" /> Monad Network Gas Fee:
                  </span>
                  <span className="font-bold font-mono text-purple-600 dark:text-purple-400">
                    ~0.00045 MON
                  </span>
                </div>
              </div>

              {/* Trust-Adjusted Terms Engine Box */}
              <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" /> TRUST-ADJUSTED ESCROW TERMS
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-full border border-indigo-500/30">
                    SCORE {getPersonaTrustScore(activePersona.walletAddress).score}/100
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
                  <div className="neu-card p-2 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Platform Fee</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                      {getPersonaTrustScore(activePersona.walletAddress).feePct}%
                    </span>
                  </div>
                  <div className="neu-card p-2 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Collateral Req.</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                      {getPersonaTrustScore(deal.initiatorAddress).collateralPct}%
                    </span>
                  </div>
                  <div className="neu-card p-2 rounded-xl">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Auto-Release</span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400 text-sm">
                      {getPersonaTrustScore(activePersona.walletAddress).releaseWindowHrs}h
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium pt-1">
                  <span className="font-semibold text-slate-900 dark:text-white">{getPersonaTrustScore(activePersona.walletAddress).reason}</span>
                </p>
              </div>

              {/* Insufficient Funds Warning */}
              {!sufficient && (
                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>Insufficient Funds Error</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200">
                    You currently have <strong className="text-rose-500 dark:text-rose-400 font-mono">{deal.currency === 'cATKN' ? `${activeBalance.catkn} cATKN` : `${activeBalance.mon} MON`}</strong>, but this escrow requires <strong className="text-slate-900 dark:text-white font-mono">{deal.price} {deal.currency}</strong>.
                  </p>
                  {deal.currency === 'cATKN' && (
                    <button
                      onClick={() => claimFaucet()}
                      className="neu-btn-primary px-3.5 py-1.5 text-xs font-extrabold flex items-center gap-1.5 mt-2"
                    >
                      <Droplets className="h-3.5 w-3.5" />
                      <span>Claim Faucet (+10,000 cATKN)</span>
                    </button>
                  )}
                </div>
              )}

              {/* Who Pays vs Who Receives Map */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    BUYER (PAID FROM)
                  </span>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-cyan-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{activePersona.name}</h4>
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {activePersona.walletAddress.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    SELLER (BENEFICIARY)
                  </span>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-400" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{deal.initiatorName || 'Verified Merchant'}</h4>
                      <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {(deal.escrowAddress || '0x4070...').slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identity Protection Notice */}
              {activePersona.isVerified && activePersona.tier >= deal.minTier ? (
                <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                    <span className="font-bold text-cyan-500 dark:text-cyan-400">Cleanverse Protection:</span> Funds lock in <code className="bg-cyan-500/20 px-1 rounded font-mono text-cyan-400">Escrow contract</code>. Payout cannot be released until the seller's Cleanverse A-Pass identity is verified and delivery is confirmed.
                  </p>
                </div>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3">
                  <Lock className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-extrabold text-rose-500 uppercase">INELIGIBLE IDENTITY — TRANSACTIONS RESTRICTED</h4>
                    <p className="text-xs text-rose-300 leading-snug pt-0.5">
                      Your identity ({activePersona.name}) does not meet the required <span className="font-bold">Tier {deal.minTier}+</span> requirement. Complete A-Pass verification to unlock escrow transactions.
                    </p>
                  </div>
                </div>
              )}

              {/* Seller Collateral Notice (shown when collateral > 0) */}
              {collateralAmount > 0 && (
                <div className={`border p-3.5 rounded-2xl flex items-start gap-3 text-xs ${sellerHasSufficientCollateral ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                  <AlertCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${sellerHasSufficientCollateral ? 'text-amber-500' : 'text-rose-500'}`} />
                  <div>
                    <p className={`font-bold uppercase text-[10px] tracking-wider ${sellerHasSufficientCollateral ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'}`}>
                      {sellerHasSufficientCollateral ? 'Seller Good-Faith Collateral Will Be Locked' : 'Seller Cannot Cover Collateral Requirement'}
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                      Seller ({deal.initiatorName}) has Trust Score {sellerTrust.score}/100 and must post{' '}
                      <strong className="text-slate-900 dark:text-white font-mono">{collateralAmount} {deal.currency}</strong>{' '}
                      ({sellerTrust.collateralPct}%) as good-faith collateral alongside your deposit.{' '}
                      {!sellerHasSufficientCollateral && <span className="text-rose-400 font-bold">Insufficient seller balance — deal blocked.</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                onClick={handleFundEscrow}
                disabled={!activePersona.isVerified || activePersona.tier < deal.minTier || !sufficient || !sellerHasSufficientCollateral}
                className={`w-full font-extrabold py-4 px-6 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 ${
                  !activePersona.isVerified || activePersona.tier < deal.minTier || !sufficient || !sellerHasSufficientCollateral
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700 opacity-60'
                    : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20'
                }`}
              >
                <span>
                  {!activePersona.isVerified || activePersona.tier < deal.minTier
                    ? `Identity Ineligible (Tier ${deal.minTier}+ Required)`
                    : !sufficient
                    ? `Insufficient ${deal.currency} Balance`
                    : !sellerHasSufficientCollateral
                    ? `Seller Cannot Cover ${collateralAmount} ${deal.currency} Collateral`
                    : collateralAmount > 0
                    ? `Deposit ${deal.price} ${deal.currency} + Lock ${collateralAmount} ${deal.currency} Seller Collateral`
                    : `Deposit & Lock ${deal.price} ${deal.currency} in Escrow`}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === 'verifying' && (
            <div className="py-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto animate-spin">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Deploying Escrow & Locking Funds</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Executing <code className="font-mono text-cyan-400">EscrowFactory.createEscrow()</code> and verifying Cleanverse compliance pool rules...
              </p>
            </div>
          )}

          {step === 'funded' && (
            <div className="py-6 space-y-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Escrow Funded & Locked!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Payment of <span className="font-bold text-slate-900 dark:text-white">{deal.price} {deal.currency}</span> is safely locked on-chain in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-cyan-400">Escrow contract</code>.
              </p>

              <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs text-left space-y-1 border border-slate-800">
                <p className="text-cyan-400 font-bold">On-Chain Transaction Details:</p>
                <p className="truncate">TxHash: {txHash}</p>
                <p>Contract: Escrow Vault</p>
                <p>Status: Funded (State 1)</p>
              </div>

              <button
                onClick={() => {
                  setStep('review');
                  onClose();
                }}
                className="w-full bg-slate-900 dark:bg-purple-600 hover:bg-slate-950 dark:hover:bg-purple-500 text-white font-bold py-3.5 px-6 rounded-2xl text-xs transition-all"
              >
                Return to Marketplace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
