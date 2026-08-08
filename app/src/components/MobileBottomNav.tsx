'use client';

import React from 'react';
import { Home, Briefcase, PlusCircle, ShoppingBag, User, Layers } from 'lucide-react';
import { usePersona } from '../context/PersonaContext';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openPostModal: () => void;
  openPlayground: () => void;
  openProfile: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  openPostModal,
  openPlayground,
  openProfile,
}) => {
  const { activePersona } = usePersona();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-100/95 dark:bg-[#0d111a]/95 backdrop-blur-xl border-t border-slate-300/50 dark:border-slate-800/80 px-2 py-2 flex items-center justify-around shadow-2xl transition-colors">
      {/* Home Tab */}
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all ${
          activeTab === 'home'
            ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Home className={`h-5 w-5 ${activeTab === 'home' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
        <span className="text-[10px] font-bold">Home</span>
      </button>

      {/* Jobs / Escrows Tab */}
      <button
        onClick={() => setActiveTab('browse-jobs')}
        className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all ${
          activeTab === 'browse-jobs'
            ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Briefcase className={`h-5 w-5 ${activeTab === 'browse-jobs' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
        <span className="text-[10px] font-bold">Escrows</span>
      </button>

      {/* Deploy Escrow Button (Center Prominent CTA) */}
      <button
        onClick={() => setActiveTab('deals')}
        className="flex flex-col items-center justify-center h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 -mt-5 hover:scale-105 active:scale-95 transition-all"
        title="Deploy New Escrow Instance"
      >
        <PlusCircle className="h-6 w-6 text-white" />
      </button>

      {/* Services Tab */}
      <button
        onClick={() => setActiveTab('browse-services')}
        className={`flex flex-col items-center gap-1 px-3 py-1 rounded-2xl transition-all ${
          activeTab === 'browse-services'
            ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <ShoppingBag className={`h-5 w-5 ${activeTab === 'browse-services' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
        <span className="text-[10px] font-bold">Market</span>
      </button>

      {/* Profile Tab */}
      <button
        onClick={openProfile}
        className="flex flex-col items-center gap-1 px-3 py-1 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all relative"
      >
        <div className="relative">
          <User className="h-5 w-5" />
          <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${activePersona.isVerified ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        </div>
        <span className="text-[10px] font-bold">Profile</span>
      </button>
    </nav>
  );
};
