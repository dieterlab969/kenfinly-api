import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  iconAsset: string;
}

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (amount: number) => string;
}

// ─── Supported currencies ─────────────────────────────────────────────────────
// iconAsset maps to the key used in the Currency page image imports.

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',         iconAsset: 'currency1' },
  { code: 'VND', symbol: '₫',   name: 'Vietnamese Dong',   iconAsset: 'currency1' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar',   iconAsset: 'currency1' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar', iconAsset: 'currency1' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar',iconAsset: 'currency1' },
  { code: 'EUR', symbol: '€',   name: 'Euro',              iconAsset: 'currency4' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',     iconAsset: 'currency5' },
  { code: 'RUB', symbol: '₽',   name: 'Russian Ruble',     iconAsset: 'currency6' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',      iconAsset: 'currency7' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',      iconAsset: 'currency8' },
  { code: 'BTC', symbol: '₿',   name: 'Bitcoin',           iconAsset: 'currency1' },
  { code: 'ETH', symbol: 'Ξ',   name: 'Ethereum',          iconAsset: 'currency3' },
];

const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[0];
const STORAGE_KEY = 'app_currency';

// ─── Context ──────────────────────────────────────────────────────────────────

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Currency;
        return SUPPORTED_CURRENCIES.find((c) => c.code === parsed.code) ?? DEFAULT_CURRENCY;
      }
    } catch {
      // ignore parse errors
    }
    return DEFAULT_CURRENCY;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currency));
  }, [currency]);

  const setCurrency = (c: Currency) => setCurrencyState(c);

  const format = (amount: number): string => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency.symbol}${amount.toLocaleString()}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCurrency = (): CurrencyContextType => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
};
