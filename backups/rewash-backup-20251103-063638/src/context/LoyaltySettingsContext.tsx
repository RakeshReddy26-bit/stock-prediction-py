import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LoyaltyTier, LoyaltySettings as LoyaltySettingsType } from '../types/task';

interface LoyaltySettings {
  tiers: {
    name: LoyaltyTier;
    pointsMultiplier: number;
    minimumSpend: number;
  }[];
  pointsPerDollar: number;
  minimumPointsForRedemption: number;
  pointsToDollarRate: number;
  tierEarningMultipliers: {
    [key: string]: number;
  };
  promoEarningMultiplier: number;
}

interface LoyaltySettingsContextType {
  settings: LoyaltySettings;
  updateSettings: (newSettings: Partial<LoyaltySettings>) => void;
}

const defaultSettings: LoyaltySettings = {
  tiers: [
    { name: 'silver', pointsMultiplier: 1.2, minimumSpend: 1000 },
    { name: 'gold', pointsMultiplier: 1.5, minimumSpend: 5000 },
    { name: 'platinum', pointsMultiplier: 2, minimumSpend: 10000 },
  ],
  pointsPerDollar: 10,
  minimumPointsForRedemption: 1000,
  pointsToDollarRate: 100,
  tierEarningMultipliers: {
    silver: 1.0,
    gold: 1.2,
    platinum: 1.5,
  },
  promoEarningMultiplier: 1.0,
};

const LoyaltySettingsContext = createContext<LoyaltySettingsContextType | undefined>(undefined);

export const LoyaltySettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<LoyaltySettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<LoyaltySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <LoyaltySettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </LoyaltySettingsContext.Provider>
  );
};

export const useLoyaltySettings = () => {
  const context = useContext(LoyaltySettingsContext);
  if (context === undefined) {
    throw new Error('useLoyaltySettings must be used within a LoyaltySettingsProvider');
  }
  return context;
}; 