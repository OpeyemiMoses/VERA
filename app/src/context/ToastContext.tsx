'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, ShieldCheck } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 4000) => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const newToast: ToastItem = { id, message, type, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback((message: string, duration?: number) => showToast(message, 'success', duration), [showToast]);
  const showError = useCallback((message: string, duration?: number) => showToast(message, 'error', duration), [showToast]);
  const showInfo = useCallback((message: string, duration?: number) => showToast(message, 'info', duration), [showToast]);
  const showWarning = useCallback((message: string, duration?: number) => showToast(message, 'warning', duration), [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeToast,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const getToastStyles = () => {
            switch (toast.type) {
              case 'success':
                return {
                  bg: 'bg-slate-950/95 border-2 border-emerald-500/70 shadow-2xl shadow-emerald-500/25',
                  icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />,
                  textColor: 'text-emerald-400',
                  badge: 'SUCCESS',
                };
              case 'error':
                return {
                  bg: 'bg-slate-950/95 border-2 border-rose-500/70 shadow-2xl shadow-rose-500/25',
                  icon: <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />,
                  textColor: 'text-rose-400',
                  badge: 'ERROR',
                };
              case 'warning':
                return {
                  bg: 'bg-slate-950/95 border-2 border-amber-500/70 shadow-2xl shadow-amber-500/25',
                  icon: <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />,
                  textColor: 'text-amber-400',
                  badge: 'WARNING',
                };
              default:
                return {
                  bg: 'bg-slate-950/95 border-2 border-cyan-500/70 shadow-2xl shadow-cyan-500/25',
                  icon: <ShieldCheck className="h-5 w-5 text-cyan-400 flex-shrink-0" />,
                  textColor: 'text-cyan-400',
                  badge: 'PROTOCOL NOTICE',
                };
            }
          };

          const style = getToastStyles();

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl backdrop-blur-2xl transition-all duration-300 transform translate-y-0 animate-fadeIn ${style.bg}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {style.icon}
                  <div className="space-y-0.5">
                    <span className={`text-[9px] font-mono font-extrabold uppercase tracking-wider block ${style.textColor}`}>
                      {style.badge}
                    </span>
                    <p className="text-xs font-extrabold text-slate-100 leading-snug break-words">{toast.message}</p>
                  </div>
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors flex-shrink-0 hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
