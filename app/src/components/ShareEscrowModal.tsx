'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2, ShieldCheck, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ShareEscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  title: string;
  price: number;
  currency: string;
  minTier: number;
}

export const ShareEscrowModal: React.FC<ShareEscrowModalProps> = ({
  isOpen,
  onClose,
  dealId,
  title,
  price,
  currency,
  minTier,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?deal=${dealId}` : '';
  const shareText = `🔒 Secure Escrow Deal: ${title}\nPrice: ${price} ${currency}\nVerify Tier ${minTier}+ & Lock Escrow via VERA Protocol:`;

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="neu-card w-full max-w-md p-6 rounded-3xl space-y-6 relative border-2 border-indigo-500/30 shadow-2xl bg-[#e4ebf5] dark:bg-[#0d111a]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl neu-inset text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="h-12 w-12 rounded-2xl neu-inset text-indigo-500 flex items-center justify-center mx-auto shadow-inner">
            <QrCode className="h-6 w-6 text-indigo-500" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Share Private 1-on-1 Escrow Deal
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            This private escrow link is strictly intended for your counterparty. Scan QR code or share via social links below.
          </p>
        </div>

        {/* QR Code Canvas Card */}
        <div className="neu-inset p-5 rounded-2xl flex flex-col items-center justify-center bg-white dark:bg-slate-900/80 border border-indigo-500/20 space-y-3">
          <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
            <QRCodeSVG
              value={shareUrl || 'https://vera-escrow.com'}
              size={160}
              level="H"
              includeMargin={false}
            />
          </div>
          <div className="text-center">
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 block">
              DEAL ID: {dealId.slice(0, 16)}...
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              {price} {currency} · Min Tier {minTier}
            </span>
          </div>
        </div>

        {/* Copy Direct Link */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Shareable Escrow URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3.5 py-2.5 neu-inset text-xs font-mono text-slate-900 dark:text-white rounded-xl focus:outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Social Share Buttons (WhatsApp & Telegram) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* WhatsApp Share Button */}
          <button
            onClick={handleWhatsAppShare}
            className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.205 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l.399.638-1.005 3.673 3.754-.997.595.359z" />
            </svg>
            <span>WhatsApp</span>
          </button>

          {/* Telegram Share Button */}
          <button
            onClick={handleTelegramShare}
            className="w-full bg-[#229ED9] hover:bg-[#1d8bb0] text-white font-extrabold py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#229ED9]/20"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.411-.168.56-.379.747-.579.765-.434.039-.763-.286-1.183-.561-.657-.431-1.028-.697-1.666-1.117-.737-.486-.259-.753.161-1.189.11-.114 2.022-1.854 2.06-2.016.005-.02.01-.095-.035-.135-.044-.04-.11-.026-.157-.015-.067.015-1.135.721-3.204 2.12-.303.208-.578.31-.825.304-.271-.006-.793-.153-1.181-.279-.475-.154-.852-.236-.819-.498.017-.137.197-.278.539-.423 2.113-.919 3.524-1.525 4.232-1.819 2.015-.838 2.434-.984 2.707-.989.06 0 .195.014.282.085.073.059.094.139.103.196.009.057.02.196.002.302z" />
            </svg>
            <span>Telegram</span>
          </button>
        </div>
      </div>
    </div>
  );
};
