'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  XCircle,
  Building,
  Briefcase,
  ShoppingBag,
  Layers,
} from 'lucide-react';
import { MOCK_PERSONAS, Persona } from '../context/PersonaContext';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlaygroundModal: React.FC<PlaygroundModalProps> = ({ isOpen, onClose }) => {
  const [minTier, setMinTier] = useState<number>(15);
  const [blockedCountries, setBlockedCountries] = useState<string[]>(['RU']);

  if (!isOpen) return null;

  const toggleCountry = (code: string) => {
    setBlockedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const evaluatePersona = (persona: Persona) => {
    if (!persona.isVerified) {
      return { valid: false, reason: 'Identity unverified (No Cleanverse A-Pass)' };
    }
    if (persona.tier < minTier) {
      return { valid: false, reason: `Insufficient Tier (${persona.tier} < Min Tier ${minTier})` };
    }
    if (blockedCountries.includes(persona.country)) {
      return { valid: false, reason: `Sanctioned Country (${persona.country} Blacklisted)` };
    }
    return { valid: true, reason: `Fully Compliant (Tier ${persona.tier} · ${persona.country})` };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="neu-card p-6 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-300/40 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl neu-inset text-indigo-500 flex items-center justify-center font-bold">
              <Layers className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cleanverse Policy Engine Playground</h2>
                <span className="text-[10px] neu-btn-primary font-mono font-extrabold px-2 py-0.5 rounded-full">
                  SIMULATOR
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Configure Cleanverse Validator Pool Rules for Vera Protocol and simulate compliance evaluation.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-xl transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Use-case presets */}
        <div className="mb-6">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-2">
            PRE-CONFIGURED ESCROW USE CASES
          </span>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                setMinTier(10);
                setBlockedCountries(['RU']);
              }}
              className="p-3.5 neu-inset hover:scale-[1.02] text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                <Building className="h-3.5 w-3.5" /> Real Estate Deposit
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-medium">Min Tier 10 · Standard Blacklist</span>
            </button>

            <button
              onClick={() => {
                setMinTier(25);
                setBlockedCountries(['RU', 'CN', 'IR']);
              }}
              className="p-3.5 neu-inset hover:scale-[1.02] text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 mb-1">
                <Briefcase className="h-3.5 w-3.5" /> M&A Holdback
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-medium">Min Tier 25 · Strict Sanctions</span>
            </button>

            <button
              onClick={() => {
                setMinTier(5);
                setBlockedCountries([]);
              }}
              className="p-3.5 neu-inset hover:scale-[1.02] text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                <ShoppingBag className="h-3.5 w-3.5" /> Marketplace Guarantee
              </div>
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-medium">Min Tier 5 · Open Global</span>
            </button>
          </div>
        </div>

        {/* Policy Config Controls */}
        <div className="neu-card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">Minimum A-Pass Tier Requirement:</span>
            </div>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 neu-inset px-3.5 py-1">
              Tier {minTier}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="40"
            value={minTier}
            onChange={(e) => setMinTier(parseInt(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />

          {/* Country Blacklist Toggles */}
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">Sanctioned Country Blacklist:</span>
            <div className="flex flex-wrap gap-2">
              {[
                { code: 'RU', name: 'Russia (RU)' },
                { code: 'CN', name: 'China (CN)' },
                { code: 'IR', name: 'Iran (IR)' },
                { code: 'US', name: 'United States (US)' },
                { code: 'SG', name: 'Singapore (SG)' },
              ].map((c) => (
                <button
                  key={c.code}
                  onClick={() => toggleCountry(c.code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    blockedCountries.includes(c.code)
                      ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40'
                      : 'neu-btn-secondary'
                  }`}
                >
                  {blockedCountries.includes(c.code) ? 'BLOCKED ' : 'PERMITTED '} {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Evaluation Matrix */}
        <div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-3">
            LIVE PERSONA EVALUATION MATRIX (CLEANVERSE REST API SIMULATOR)
          </span>

          <div className="space-y-3">
            {Object.values(MOCK_PERSONAS).map((persona) => {
              const res = evaluatePersona(persona);
              return (
                <div
                  key={persona.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    res.valid
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30'
                      : 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-xl font-bold flex items-center justify-center text-white bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md"
                    >
                      {persona.tier || '0'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{persona.name}</span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded neu-inset text-slate-800 dark:text-slate-200">{persona.country}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">{res.reason}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {res.valid ? (
                      <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/40">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Eligible
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-extrabold text-rose-700 dark:text-rose-300 bg-rose-500/20 px-3 py-1 rounded-xl border border-rose-500/40">
                        <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" /> Blocked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
