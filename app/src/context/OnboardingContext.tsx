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
    subtitle: 'Compliant On-Chain Escrow Protocol',
    description:
      'Create protected deals, hire verified talent, and lock payments safely on-chain using Cleanverse A-Pass identity and Validator Compliance rules.',
    targetId: 'welcome-dialog',
  },
  {
    id: 1,
    title: 'Create or Pay Safely',
    subtitle: 'Escrow Action Center',
    description:
      'Post new freelance deals or fund escrow instances with A-Tokens. Funds remain locked securely on-chain until work delivery is confirmed.',
    targetId: 'hero-action-section',
  },
  {
    id: 2,
    title: 'Escrow in 3 Clear Steps',
    subtitle: 'Automated Lifecycle',
    description:
      '1. Client creates deal terms -> 2. Buyer locks payment -> 3. Freelancer verifies identity & delivers work for payout.',
    targetId: 'how-it-works-section',
  },
  {
    id: 3,
    title: 'Identity-Gated Marketplace',
    subtitle: 'A-Pass & Validator Pool Gating',
    description:
      'Every deal requires freelancers to pass Cleanverse Validator Pool checks before accepting. Unverified or sanctioned wallets are automatically blocked.',
    targetId: 'popular-services-section',
  },
  {
    id: 4,
    title: 'Live Persona & Compliance Toolbar',
    subtitle: 'Hackathon Demo Mode',
    description:
      'Use the top header bar to switch between Alice (Client), Bob (Verified Freelancer), Charlie (Unverified), and Vlad (Sanctioned) in real time!',
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
