'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TourStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  targetId: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 0,
    title: 'Welcome to Vera Protocol',
    subtitle: 'Compliant On-Chain Escrow',
    description:
      'Vera is a compliant escrow protocol built on Monad. Connect your wallet, get identity-verified with a Cleanverse A-Pass, and start creating or paying into escrow deals — safely on-chain.',
    targetId: 'welcome-dialog',
  },
  {
    id: 1,
    title: 'Start a Deal or List a Service',
    subtitle: 'Escrow Action Center',
    description:
      'Hit the + button to create a Private Escrow Deal with a specific counterparty, or list a public Service on the Marketplace. Funds lock on-chain and only release when both sides agree.',
    targetId: 'hero-action-section',
  },
  {
    id: 2,
    title: 'How Escrow Works',
    subtitle: 'Three-Step Lifecycle',
    description:
      '1. Initiator creates and funds the escrow. 2. Counterparty verifies their identity (A-Pass) and enters the deal. 3. Once work is delivered and confirmed, funds release to the provider automatically.',
    targetId: 'how-it-works-section',
  },
  {
    id: 3,
    title: 'Browse the Marketplace',
    subtitle: 'Identity-Gated Services',
    description:
      'Explore verified service listings from compliant providers. Every service on Vera requires passing Cleanverse identity checks — no anonymous or sanctioned wallets allowed.',
    targetId: 'popular-services-section',
  },
  {
    id: 4,
    title: 'Your Deals & Profile',
    subtitle: 'My Deals + Wallet Profile',
    description:
      'Track all your active deals from the My Deals tab. Visit your Profile to check your A-Pass status, claim testnet tokens from the faucet, and view your on-chain transaction history.',
    targetId: 'persona-bar-header',
  },
];

interface OnboardingContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  restartTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Only show onboarding if the user has never completed/skipped it before
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Check localStorage after mount (client-only)
  useEffect(() => {
    const hasOnboarded = localStorage.getItem('vera_onboarded');
    if (!hasOnboarded) {
      setIsOpen(true);
    }
  }, []);

  const markOnboarded = () => {
    localStorage.setItem('vera_onboarded', '1');
    setIsOpen(false);
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      markOnboarded();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    markOnboarded();
  };

  const restartTour = () => {
    localStorage.removeItem('vera_onboarded');
    setCurrentStep(0);
    setIsOpen(true);
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOpen,
        setIsOpen,
        currentStep,
        setCurrentStep,
        nextStep,
        prevStep,
        skipTour,
        restartTour,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
