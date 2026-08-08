'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, RefreshCw, Send } from 'lucide-react';
import { Deal } from '../types/deal';

interface RejectDeliverableModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  onRejectSubmit: (dealId: string, reason: string) => void;
}

export const RejectDeliverableModal: React.FC<RejectDeliverableModalProps> = ({
  isOpen,
  onClose,
  deal,
  onRejectSubmit,
}) => {
  const [reason, setReason] = useState(
    'The deliverable asset resolution is insufficient and does not meet the specified job requirements. Please revise and resubmit.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !deal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onRejectSubmit(deal.id, reason.trim());
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative transition-colors">
        {/* Header */}
        <div className="bg-rose-950/40 text-white p-5 border-b border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">REJECT DELIVERABLE & REQUEST REVISION</h3>
              <p className="text-xs text-rose-300">State your reason so the seller can make changes and resend</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Target Escrow Deal</span>
            <p className="text-xs font-bold text-white">{deal.title}</p>
            <p className="text-[10px] text-cyan-400 font-mono">Seller: {deal.initiatorName}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              REASON FOR REJECTION / REQUIRED REVISIONS *
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State clearly what needs to be changed (e.g. file resolution, missing assets, broken endpoint)..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium focus:outline-none focus:border-rose-500 dark:text-white leading-relaxed"
            />
          </div>

          <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl flex items-start gap-2.5">
            <RefreshCw className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-rose-300 leading-snug">
              Submitting this rejection will mark the escrow state as <strong className="text-white uppercase">REJECTED</strong>. Funds remain securely locked in Escrow contract while the seller revises the work.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Submitting Rejection...' : 'Submit Rejection & Request Revision'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
