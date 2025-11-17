import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LoyaltySettings } from '../types/task';

const defaultSettings: LoyaltySettings = {
  pointsPerDollar: 1,
  pointsToDollarRate: 100,
  tierEarningMultipliers: {
    silver: 1,
    gold: 1.2,
    platinum: 1.5,
  },
  promoEarningMultiplier: 2,
};

interface LoyaltySettingsContextType {
  settings: LoyaltySettings;
  updateSettings: (newSettings: Partial<LoyaltySettings>) => void;
}

const LoyaltySettingsContext = createContext<LoyaltySettingsContextType | undefined>(undefined);

export const LoyaltySettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<LoyaltySettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<LoyaltySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <LoyaltySettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </LoyaltySettingsContext.Provider>
  );
};

export const useLoyaltySettings = () => {
  const ctx = useContext(LoyaltySettingsContext);
  if (!ctx) throw new Error('useLoyaltySettings must be used within LoyaltySettingsProvider');
  return ctx;
}; 