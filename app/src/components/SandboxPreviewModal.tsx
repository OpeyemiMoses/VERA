'use client';

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Eye,
  Sparkles,
  RefreshCw,
  Maximize2,
  Minimize2,
  Terminal,
  Play,
  FileText,
  Image as ImageIcon,
  Code,
  Key,
  Paperclip,
  Check,
  Folder,
  File,
  Laptop,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Layers,
} from 'lucide-react';
import { Deal, DeliverableFormat } from '../types/deal';
import { getDeliverableImage } from '../utils/imageUtils';
import { useToast } from '../context/ToastContext';

interface SandboxPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
  onReleasePayout: () => void;
  onRejectDeliverable?: () => void;
  isReleasing: boolean;
}

export const SandboxPreviewModal: React.FC<SandboxPreviewModalProps> = ({
  isOpen,
  onClose,
  deal,
  onReleasePayout,
  onRejectDeliverable,
  isReleasing,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'tests'>('preview');
  const [viewportMode, setViewportMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeFile, setActiveFile] = useState<string>('src/bot.ts');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const { showSuccess } = useToast();

  if (!isOpen || !deal) return null;

  const deliverableFormat = deal.deliverable?.format || 'FILE';
  const fileName = deal.deliverable?.fileName || deal.title || 'Deliverable_Bundle.zip';
  const isImageOrDesign =
    deal.category.toLowerCase().includes('design') ||
    fileName.toLowerCase().endsWith('.png') ||
    fileName.toLowerCase().endsWith('.jpg') ||
    fileName.toLowerCase().endsWith('.jpeg') ||
    fileName.toLowerCase().endsWith('.svg') ||
    fileName.toLowerCase().includes('figma') ||
    fileName.toLowerCase().includes('ui');

  const isPdfDocument =
    (deal.deliverable?.fileKind === 'PDF' ||
      fileName.toLowerCase().endsWith('.pdf') ||
      fileName.toLowerCase().includes('pdf') ||
      fileName.toLowerCase().includes('travelrule')) &&
    !isImageOrDesign;

  const previewUrl = deal.deliverable?.previewUrl || 'https://demo.veraprotocol.io/sandbox-preview';

  const runDiagnostics = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      setIsRunningTests(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="neu-card max-w-5xl w-full overflow-hidden relative transition-colors flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="neu-inset p-4 sm:p-5 flex items-center justify-between gap-4 flex-shrink-0 rounded-none border-b border-slate-300/40 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center">
              <div className="h-full w-full neu-card rounded-[10px] flex items-center justify-center">
                {isImageOrDesign ? (
                  <ImageIcon className="h-4.5 w-4.5 text-indigo-500" />
                ) : isPdfDocument ? (
                  <FileText className="h-4.5 w-4.5 text-purple-500" />
                ) : deliverableFormat === 'CREDENTIALS' ? (
                  <Key className="h-4.5 w-4.5 text-indigo-500" />
                ) : (
                  <Code className="h-4.5 w-4.5 text-indigo-500" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">IN-APP DELIVERABLE INSPECTOR</h3>
                <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full uppercase">
                  {isImageOrDesign ? 'VISUAL DESIGN PREVIEW' : isPdfDocument ? 'PDF DOCUMENT INSPECTOR' : deliverableFormat === 'CREDENTIALS' ? 'VAULT KEY INSPECTOR' : 'CODE & BOT INSPECTOR'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono flex items-center gap-2 pt-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">{fileName}</span>
                <span className="text-slate-400">·</span>
                <span>Submitted by <strong className="text-indigo-600 dark:text-indigo-400">{deal.initiatorName}</strong></span>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar Bar */}
        <div className="neu-inset px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0 rounded-none border-b border-slate-300/40 dark:border-slate-800/60 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> VERA VAULT IN-APP INSPECTOR
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'preview' ? 'neu-btn-primary' : 'neu-btn-secondary'
              }`}
            >
              Inspection View
            </button>
            <button
              onClick={() => setActiveTab('tests')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tests' ? 'neu-btn-primary' : 'neu-btn-secondary'
              }`}
            >
              Diagnostics
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-900 dark:text-slate-100 min-h-[350px]">
          {/* OPTION 1: WATERMARKED VISUAL ASSET PREVIEW CARD (Images / Design / Figma) */}
          {activeTab === 'preview' && (isImageOrDesign || deal.deliverable?.fileKind === 'IMAGE') && (
            <div className="space-y-4 mb-4">
              <div className="neu-card p-4 relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300/40 dark:border-slate-800/60 pb-3">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{fileName}</h4>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono font-medium">Watermarked Pre-Release Visual Asset</span>
                  </div>
                  <span className="text-[10px] font-bold neu-inset text-indigo-600 dark:text-indigo-400 px-2.5 py-1">
                    VISUAL ASSET
                  </span>
                </div>

                {/* Render Uploaded Image */}
                <div className="neu-inset p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[250px] group">
                  <div className="relative z-10 transition-transform duration-300 flex items-center justify-center" style={{ transform: `scale(${zoomLevel / 100})` }}>
                    <img
                      src={getDeliverableImage(deal.deliverable?.imageUrl, deal.title, deal.category, fileName)}
                      alt={fileName}
                      className="max-h-[300px] max-w-full rounded-xl object-contain shadow-2xl"
                    />
                  </div>

                  <div className="absolute inset-0 flex flex-col justify-around pointer-events-none opacity-30 z-20 select-none overflow-hidden rotate-[-15deg] scale-125">
                    <div className="flex justify-around text-xs sm:text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tracking-widest whitespace-nowrap">
                      <span>VERA PRE-RELEASE WATERMARK</span>
                      <span>VERA PRE-RELEASE WATERMARK</span>
                    </div>
                    <div className="flex justify-around text-xs sm:text-sm font-extrabold text-purple-600 dark:text-purple-400 font-mono tracking-widest whitespace-nowrap">
                      <span>UNLOCKED UPON PAYOUT RELEASE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OPTION 2: PDF DOCUMENT READER INSPECTOR (NO IMAGE CARD) */}
          {activeTab === 'preview' && isPdfDocument && (
            <div className="space-y-4">
              <div className="neu-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300/40 dark:border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">{fileName}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">Page 1 of 4 · Watermarked Pre-Release PDF Document</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 px-2.5 py-1 rounded">
                    PDF DOCUMENT
                  </span>
                </div>

                {/* PDF Page Document Canvas */}
                <div className="neu-inset p-6 relative overflow-hidden min-h-[300px] space-y-4 rounded-xl border border-purple-500/30">
                  <div className="flex justify-between items-center border-b border-slate-300/40 dark:border-slate-800/60 pb-3 font-mono text-xs">
                    <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-purple-500" /> {fileName}
                    </span>
                    <span className="text-purple-500 font-bold">VERA ZK AUDIT REPORT</span>
                  </div>

                  <div className="space-y-2 text-xs font-mono leading-relaxed text-slate-700 dark:text-slate-300">
                    <p className="font-bold text-slate-900 dark:text-white">&gt; DOCUMENT SUMMARY & TRAVEL RULE COMPLIANCE ATTESTATION</p>
                    <p>Originator Wallet: <code className="text-indigo-500 font-bold">{deal.initiatorAddress}</code></p>
                    <p>Beneficiary Target: <code className="text-purple-500 font-bold">{deal.counterpartyAddress || '0x0b7E601E0c41B7Ac3Ce5177cb5c37A37B84a4d16'}</code></p>
                    <p>Contract Price: <code className="text-emerald-500 font-extrabold">{deal.price} {deal.currency}</code></p>
                    <div className="neu-card p-3 rounded-lg text-[11px] space-y-1 my-2">
                      <span className="text-indigo-400 font-bold block">TRAVEL RULE PAYLOAD HASH:</span>
                      <code className="text-slate-400 break-all">{deal.deliverable?.payloadHash || '0x9941a82f3c7b1d9e2f4a8b7c6d5e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e'}</code>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 rotate-[-12deg] select-none">
                    <span className="text-2xl font-mono font-extrabold text-purple-500 tracking-widest">VERA PRE-RELEASE WATERMARK</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TYPE 2: CODE REPO / BOT PREVIEW */}
          {activeTab === 'preview' && !isImageOrDesign && !isPdfDocument && deliverableFormat !== 'CREDENTIALS' && (
            <div className="space-y-4">
              <div
                className={`mx-auto neu-card p-5 space-y-4 transition-all ${
                  viewportMode === 'mobile' ? 'max-w-xs' : 'w-full'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-300/40 dark:border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Bot Sandbox Instance: ACTIVE</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold neu-inset text-indigo-600 dark:text-indigo-400 px-2 py-0.5">
                    Monad Testnet Node
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                    FUNCTIONAL REQUIREMENTS AUDIT
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {deal.deliveryTerms}
                  </p>
                </div>

                {/* Interactive Simulated Bot Commands Terminal */}
                <div className="neu-inset p-4 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-300/40 dark:border-slate-800/60 pb-2">
                    <span>TERMINAL / BOT COMMAND RESPONSES</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">PASS 100%</span>
                  </div>
                  <div className="space-y-1 text-indigo-600 dark:text-indigo-400 font-bold">
                    <p>&gt; /start — Welcome to Cleanverse Compliance Bot!</p>
                    <p>&gt; /verify 0x4070... — A-Pass Verified (Tier 25)</p>
                    <p className="text-emerald-600 dark:text-emerald-400">&gt; Escrow Contract Executed: 0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TYPE 3: CREDENTIALS VAULT PREVIEW */}
          {activeTab === 'preview' && deliverableFormat === 'CREDENTIALS' && (
            <div className="space-y-4">
              <div className="neu-card p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-300/40 dark:border-slate-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Vera ZK Vault Key Inspector</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded">
                    LOCKED UNTIL PAYOUT
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="neu-inset p-3.5 space-y-1">
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">ENDPOINT SCOPE</span>
                    <p className="text-indigo-600 dark:text-indigo-400 font-extrabold">https://api.veraprotocol.io/v1/client</p>
                  </div>
                  <div className="neu-inset p-3.5 space-y-1">
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold">PERMITTED ACTIONS</span>
                    <p className="text-emerald-600 dark:text-emerald-400 font-extrabold">read:apass, execute:escrow</p>
                  </div>
                </div>

                <div className="neu-inset p-4 font-mono text-xs space-y-2">
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase block">Masked Production Payload</span>
                  <pre className="text-indigo-600 dark:text-indigo-400 neu-card p-3 font-bold">
                    LICENSE_KEY: VERA-9824-ESCROW-CONFIRMED&#10;API_ENDPOINT: https://api.veraprotocol.io/v1/client&#10;SECRET: sk_live_9941a82f••••••••••••••••
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* DIAGNOSTICS TAB */}
          {activeTab === 'tests' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-indigo-500" /> AUTOMATED DIAGNOSTIC SUITE
                </h4>
                <button
                  onClick={runDiagnostics}
                  className="neu-btn-secondary text-xs font-bold px-3 py-1 flex items-center gap-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRunningTests ? 'animate-spin' : ''}`} /> Run Diagnostics
                </button>
              </div>

              {[
                { name: 'Cleanverse A-Pass Identity Verification', latency: '38ms' },
                { name: 'Deliverable Payload Integrity Hash Match', latency: '14ms' },
                { name: 'API & File Specification Audit', latency: '45ms' },
                { name: 'Monad Testnet Escrow State Check', latency: '22ms' },
              ].map((item, idx) => (
                <div key={idx} className="neu-card p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-slate-900 dark:text-white font-bold">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 dark:text-slate-300 text-[10px] font-bold">{item.latency}</span>
                    <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                      PASSED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Bar with Confirm & Release Payout CTA */}
        <div className="neu-inset p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 rounded-none border-t border-slate-300/40 dark:border-slate-800/60">
          <div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 font-bold uppercase block">Escrow Contract Amount</span>
            <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
              {deal.price} {deal.currency}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="neu-btn-secondary px-4 py-2.5 text-xs font-bold"
            >
              Close Inspector
            </button>

            {deal.status === 'RELEASED' && (
              <button
                onClick={() => showSuccess(`Downloading Unlocked Deliverable: ${deal.deliverable?.fileName || 'Deliverable_Archive.zip'}`)}
                className="neu-btn-primary text-xs font-extrabold px-5 py-2.5 flex items-center gap-2"
              >
                <FileText className="h-4 w-4 text-white" />
                <span>Download Unlocked Deliverable File</span>
              </button>
            )}

            {deal.status === 'DELIVERED' && (
              <>
                {onRejectDeliverable && (
                  <button
                    onClick={() => {
                      onClose();
                      onRejectDeliverable();
                    }}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/40 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <span>Reject & Request Revision</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onReleasePayout();
                    onClose();
                  }}
                  disabled={isReleasing}
                  className="neu-btn-primary text-xs sm:text-sm font-extrabold px-6 py-2.5 flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  <span>{isReleasing ? 'Releasing Payout...' : `Confirm Requirements & Release ${deal.price} ${deal.currency} Payout`}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
