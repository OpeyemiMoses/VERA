import React from 'react';
import {
  Home,
  Briefcase,
  ShoppingBag,
  PlusCircle,
  FolderCheck,
  Shield,
  Layers,
  FileText,
  Zap,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { usePersona } from '../context/PersonaContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openPostModal: () => void;
  openPlayground: () => void;
  openDisputes: () => void;
  openProfile: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openPostModal,
  openPlayground,
  openDisputes,
  openProfile,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { activePersona } = usePersona();

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home, badge: null },
    { id: 'browse-jobs', label: 'Open Work Escrows', icon: Briefcase, badge: 'BOUNTIES' },
    { id: 'browse-services', label: 'OTC & Fixed Escrows', icon: ShoppingBag, badge: 'SETTLEMENT' },
    { id: 'my-created', label: 'My Vault Instances', icon: FolderCheck, badge: null },
    { id: 'my-purchased', label: 'Active Settlements', icon: FileText, badge: null },
    { id: 'deals', label: 'Deploy Escrow Vault', icon: PlusCircle, badge: 'NEW' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
        />
      )}

      <aside
        className={`w-64 bg-[#e4ebf5] dark:bg-[#0d111a] border-r border-slate-300/40 dark:border-slate-800/60 flex flex-col justify-between p-4 flex-shrink-0 h-screen sticky top-0 transition-colors z-50 fixed lg:static inset-y-0 left-0 transform ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-300 ease-in-out`}
      >
        {/* Top Branding & Main Nav */}
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => {
                setActiveTab('landing');
                onCloseMobile?.();
              }}
              className="flex items-center gap-3 px-2 py-1 cursor-pointer group hover:opacity-95 transition-opacity"
              title="Return to Landing Page"
            >
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-400 via-blue-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                <img
                  src="/logo.jpg"
                  alt="Vera Protocol"
                  className="h-full w-full rounded-[14px] object-cover"
                />
              </div>
              <div>
                <h1 className="font-extrabold text-lg leading-none tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
                  vera
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded-md border border-indigo-400/30 uppercase tracking-wide">
                    PROTOCOL
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Cleanverse Escrow Hub</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-xl"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1">
              NAVIGATION
            </p>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                    isActive
                      ? 'neu-pill-active shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500 transition-colors'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase font-mono ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                        : 'bg-slate-300/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tools Section */}
        <div className="space-y-1.5 pt-4 border-t border-slate-300/40 dark:border-slate-800/60">
          <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1">
            PROTOCOL TOOLS
          </p>

          <button
            onClick={openProfile}
            className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300/40 dark:hover:bg-slate-900/60 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              <span>User Profile & Wallet</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={openPlayground}
            className="w-full px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-300/40 dark:hover:bg-slate-900/60 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="h-4 w-4 text-purple-500 dark:text-purple-400" />
              <span>Policy Playground</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

        </div>
      </div>

      {/* Sidebar Footer Metadata */}
      <div className="pt-4 border-t border-slate-300/40 dark:border-slate-800/60 space-y-3">
        {/* Identity Status Inset Card */}
        <div className="neu-inset p-3 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">ACTIVE PERSONA</span>
            <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {activePersona.isVerified ? `Tier ${activePersona.tier}` : 'Tier 0'}
            </span>
          </div>
          <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{activePersona.name}</p>
        </div>

        {/* Network & Protocol Status */}
        <div className="px-2 space-y-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Monad Testnet (10143)</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">v1.0.0 · Built with Cleanverse</p>
        </div>
      </div>
    </aside>
    </>
  );
};
