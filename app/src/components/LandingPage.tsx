'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Zap,
  Lock,
  FileText,
  Briefcase,
  CheckCircle2,
  Globe,
  Award,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Code,
  Layers,
  Sun,
  Moon,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { usePersona } from '../context/PersonaContext';
import { useTheme } from '../context/ThemeContext';
import { useScrollRise } from '../hooks/useScrollRise';
import { Footer } from './Footer';

interface LandingPageProps {
  onLaunchApp: () => void;
  openPlayground: () => void;
  openDisputes: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchApp,
  openPlayground,
  openDisputes,
}) => {
  const { theme, toggleTheme } = useTheme();
  useScrollRise();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: 'What is Vera Protocol?',
      a: 'Vera Protocol is a compliance-native Web3 escrow marketplace built exclusively on Monad Testnet. It interlocks verified identities and zero-knowledge escrow settlement, ensuring clean transactions for freelancers, clients, and digital asset services.',
    },
    {
      q: 'How does Cleanverse identity gating work?',
      a: 'Every escrow contract execution queries the live Cleanverse A-Pass registry. Participants must hold a valid risk tier (e.g., Tier 15, Tier 25) and pass OFAC sanction checks before escrow funds can be locked or released.',
    },
    {
      q: 'What is Vera Vault Zero-Knowledge Encryption?',
      a: 'Deliverables submitted by freelancers (API keys, code repos, files, credentials) are encrypted client-side using Vera Vault ZK encryption before being stored on-chain. Only the verified escrow buyer can decrypt the secret payload.',
    },
    {
      q: 'What is the FATF Travel Rule Compliance Audit Report?',
      a: 'When an escrow deal is settled, Vera Protocol generates an audit-ready Travel Rule PDF report containing cryptographic proof of sender, beneficiary, validator pool ID, and transaction hash for institutional compliance.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#d5dfed] dark:bg-[#0d111a] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden transition-colors duration-300">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6">
        {/* STON Top Navigation Header */}
        <header className="neu-card p-3.5 flex items-center justify-between gap-4 transition-all">
          {/* Brand Logo */}
          <div
            onClick={onLaunchApp}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-95 transition-opacity"
          >
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-400 via-blue-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <img src="/logo.jpg" alt="Vera Logo" className="h-full w-full rounded-[14px] object-cover" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg leading-none tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
                vera
                <span className="text-[9px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded-md border border-indigo-400/30">
                  PROTOCOL
                </span>
              </h1>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium mt-0.5">Cleanverse Escrow Hub</p>
            </div>
          </div>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="neu-btn-secondary p-2.5 rounded-2xl transition-all"
              title={`Switch to ${mounted && theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {mounted
                ? theme === 'dark'
                  ? <Sun className="h-4 w-4 text-indigo-400" />
                  : <Moon className="h-4 w-4 text-purple-600" />
                : <Moon className="h-4 w-4 text-purple-600" />}
            </button>

            <button
              onClick={onLaunchApp}
              className="neu-btn-primary font-extrabold text-xs px-6 py-2.5 flex items-center gap-2"
            >
              <span>Launch App</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* STON Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center py-4 animate-rise">
          {/* Left Column: Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full neu-inset text-slate-800 dark:text-slate-200 text-xs font-bold font-mono">
              <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
              <span>CLEANVERSE COMPLIANCE-NATIVE ESCROW PROTOCOL</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.05]">
              Your All-in-One <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Cleanverse Escrow Hub
              </span>
            </h1>

            <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed max-w-xl font-medium">
              Lock tokens safely in on-chain <code className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-bold">Escrow</code> contracts gated by real-time Cleanverse identity risk tiers, zero-knowledge secret delivery, and Travel Rule audits.
            </p>

            {/* STON Buttons Side-by-Side */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onLaunchApp}
                className="neu-btn-primary font-extrabold text-sm px-7 py-3 flex items-center gap-2"
              >
                <span>Enter Dashboard</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>

              <button
                onClick={openPlayground}
                className="neu-btn-secondary font-bold text-sm px-6 py-3 flex items-center gap-2"
              >
                <Layers className="h-4.5 w-4.5 text-indigo-500" />
                <span>Policy Playground</span>
              </button>
            </div>
          </div>

          {/* Right Column: STON Neumorphic Target Circle Widget with Official Vera Logo */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              className="relative w-64 h-64 sm:w-72 sm:h-72 neu-card flex items-center justify-center p-6 transition-transform hover:scale-105 duration-500"
              style={{ borderRadius: '9999px' }}
            >
              <div
                className="w-48 h-48 sm:w-54 sm:h-54 neu-inset flex items-center justify-center p-5"
                style={{ borderRadius: '9999px' }}
              >
                <div
                  className="w-28 h-28 sm:w-32 sm:h-32 neu-card flex items-center justify-center p-2.5 shadow-lg"
                  style={{ borderRadius: '9999px' }}
                >
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 p-1 flex items-center justify-center shadow-md animate-pulse"
                    style={{ borderRadius: '9999px' }}
                  >
                    <img
                      src="/logo.jpg"
                      alt="Vera Cleanverse Logo"
                      className="h-full w-full object-cover shadow-inner"
                      style={{ borderRadius: '9999px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STON 3-Column Module Cards Grid */}
        <section id="features" className="space-y-4 pt-2 scroll-rise">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Built for Cleanverse Compliance & Web3 Freelance DeFi
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              Three core pillars driving the next generation of identity-gated Web3 smart contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="neu-card p-6 space-y-4 transition-all group">
              <div className="h-12 w-12 rounded-2xl neu-inset text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Cleanverse A-Pass Gating</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Every escrow deposit dynamically checks live risk tiers (Tier 15, Tier 25) and OFAC sanction lists before allowing wallet interactions.
              </p>
              <div className="pt-2">
                <button onClick={onLaunchApp} className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Explore Gated Marketplace</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="neu-card p-6 space-y-4 transition-all group">
              <div className="h-12 w-12 rounded-2xl neu-inset text-purple-600 dark:text-purple-400 font-extrabold flex items-center justify-center">
                <Lock className="h-6 w-6" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Vera Vault ZK Secrets</h3>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  ENCRYPTED
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Deliverables (source code repos, API keys, credentials) are client-encrypted with zero-knowledge secret masking.
              </p>
              <div className="pt-2">
                <button onClick={onLaunchApp} className="text-xs font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>View ZK Vault</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="neu-card p-6 space-y-4 transition-all group">
              <div className="h-12 w-12 rounded-2xl neu-inset text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Travel Rule PDF Audits</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Every settled escrow automatically compiles a cryptographic FATF Travel Rule PDF report containing sender, receiver, and validator pool IDs.
              </p>

            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section id="faq" className="max-w-3xl mx-auto space-y-6 pt-8 scroll-rise">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Everything you need to know about Vera Protocol & Cleanverse</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="neu-card-soft overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  {openFaqIndex === idx ? <ChevronUp className="h-4 w-4 text-indigo-500 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />}
                </button>
                {openFaqIndex === idx && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-slate-700 dark:text-slate-200 leading-relaxed border-t border-slate-300/40 dark:border-slate-800/60 pt-3 font-medium">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};
