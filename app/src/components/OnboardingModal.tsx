'use client';

import React, { useEffect } from 'react';
import { useOnboarding, TOUR_STEPS } from '../context/OnboardingContext';
import { Sparkles, ArrowRight, X, ChevronRight, ChevronLeft, Shield } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { isOpen, currentStep, nextStep, prevStep, skipTour } = useOnboarding();

  const step = TOUR_STEPS[currentStep] || TOUR_STEPS[0];

  // Highlight target element on DOM
  useEffect(() => {
    const clearHighlights = () => {
      document.querySelectorAll('.tour-highlight').forEach((el) => {
        el.classList.remove('tour-highlight');
      });
    };

    if (!isOpen) {
      clearHighlights();
      return;
    }

    clearHighlights();

    const timer = setTimeout(() => {
      if (currentStep > 0 && step.targetId) {
        const targetEl = document.getElementById(step.targetId);
        if (targetEl) {
          targetEl.classList.add('tour-highlight');
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [isOpen, currentStep, step]);

  if (!isOpen) return null;

  // Step 0 Welcome Popup
  if (currentStep === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
        <div className="neu-card p-8 max-w-md w-full relative text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-400 via-blue-600 to-purple-600 p-0.5 shadow-lg mx-auto">
            <div className="h-full w-full bg-[#0b0e15] rounded-[14px] flex items-center justify-center">
              <Shield className="h-7 w-7 text-indigo-400" />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">vera</span>
          </h2>
          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Compliant On-Chain Escrow Protocol
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            Create protected deals, sell services, hire verified talent, and get help with escrow keeping every payment safe on-chain with Cleanverse primitives.
          </p>

          <button
            onClick={nextStep}
            className="w-full neu-btn-primary py-3.5 px-6 font-bold flex items-center justify-center gap-2 group"
          >
            <span>Show me around</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  // Steps 1 to 4 Step-by-Step Walkthrough Modal
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 pointer-events-auto" onClick={skipTour} />

      <div className="relative z-50 pointer-events-auto bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl animate-scaleUp transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm border border-cyan-500/30">
              <Sparkles className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-cyan-500 dark:text-cyan-400 tracking-wider">
                STEP {currentStep} OF {TOUR_STEPS.length - 1} • {step.subtitle}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{step.title}</h3>
            </div>
          </div>
          <button onClick={skipTour} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {step.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.slice(1).map((s, idx) => (
              <span
                key={s.id}
                className={`h-2 rounded-full transition-all ${
                  currentStep === idx + 1 ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={skipTour}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-white px-3 py-1.5"
            >
              Skip
            </button>
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={nextStep}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
