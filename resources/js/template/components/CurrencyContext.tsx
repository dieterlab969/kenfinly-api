import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Currency {
  code:      string;
  symbol:    string;
  name:      string;
  iconAsset: string;  // maps to SVG key; derived on the frontend from CODE_TO_ICON
}

interface CurrencyContextType {
  /** The user's currently selected currency. */
  currency:          Currency;
  /** The list of app-active currencies fetched from the API. */
  currencies:        Currency[];
  /** True while the initial /api/currencies call is in-flight. */
  currenciesLoading: boolean;
  setCurrency:       (c: Currency) => void;
  format:            (amount: number) => string;
}

// ─── Icon mapping ─────────────────────────────────────────────────────────────
// Maps ISO currency codes to the SVG asset keys available in
// resources/js/template/assets/images/currency/.
// Unmapped codes fall back to 'currency1' (generic flag icon).

const CODE_TO_ICON: Record<string, string> = {
  USD: 'currency1',
  VND: 'currency1',
  CAD: 'currency1',
  AUD: 'currency1',
  NZD: 'currency1',
  BTC: 'currency1',
  ETH: 'currency3',
  EUR: 'currency4',
  GBP: 'currency5',
  RUB: 'currency6',
  INR: 'currency7',
  JPY: 'currency8',
};

// ─── Static fallback list ─────────────────────────────────────────────────────
// Used when the /api/currencies call fails (e.g. offline). Exported so other
// modules that previously imported SUPPORTED_CURRENCIES remain compatible.

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',   name: 'US Dollar',          iconAsset: 'currency1' },
  { code: 'VND', symbol: '₫',   name: 'Vietnamese Dong',    iconAsset: 'currency1' },
  { code: 'EUR', symbol: '€',   name: 'Euro',               iconAsset: 'currency4' },
  { code: 'GBP', symbol: '£',   name: 'British Pound',      iconAsset: 'currency5' },
  { code: 'JPY', symbol: '¥',   name: 'Japanese Yen',       iconAsset: 'currency8' },
  { code: 'CAD', symbol: 'C$',  name: 'Canadian Dollar',    iconAsset: 'currency1' },
  { code: 'AUD', symbol: 'A$',  name: 'Australian Dollar',  iconAsset: 'currency1' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', iconAsset: 'currency1' },
  { code: 'INR', symbol: '₹',   name: 'Indian Rupee',       iconAsset: 'currency7' },
  { code: 'RUB', symbol: '₽',   name: 'Russian Ruble',      iconAsset: 'currency6' },
  { code: 'BTC', symbol: '₿',   name: 'Bitcoin',            iconAsset: 'currency1' },
  { code: 'ETH', symbol: 'Ξ',   name: 'Ethereum',           iconAsset: 'currency3' },
];

// Active-only fallback shown in the Currency picker when the API is unavailable
const ACTIVE_FALLBACK: Currency[] = SUPPORTED_CURRENCIES.filter(
  (c) => c.code === 'USD' || c.code === 'VND'
);

const DEFAULT_CURRENCY = SUPPORTED_CURRENCIES[0]; // USD
const STORAGE_KEY      = 'app_currency';

// ─── Context ──────────────────────────────────────────────────────────────────

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Selected currency (restored from localStorage)
  const [currency, setCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Currency;
        // Restore from full fallback list so iconAsset is always present
        return SUPPORTED_CURRENCIES.find((c) => c.code === parsed.code) ?? DEFAULT_CURRENCY;
      }
    } catch {
      // ignore parse errors
    }
    return DEFAULT_CURRENCY;
  });

  // Dynamic list fetched from /api/currencies
  const [currencies,        setCurrencies]        = useState<Currency[]>(ACTIVE_FALLBACK);
  const [currenciesLoading, setCurrenciesLoading] = useState<boolean>(true);

  // Fetch active currencies from the backend on mount.
  // The API returns { success, currencies: [{ code, name, symbol, display_order }] }
  // and we enrich each entry with the iconAsset derived from CODE_TO_ICON.
  useEffect(() => {
    axios
      .get<{ success: boolean; currencies: { code: string; name: string; symbol: string }[] }>(
        '/api/currencies'
      )
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.currencies)) {
          const mapped: Currency[] = res.data.currencies.map((c) => ({
            code:      c.code,
            name:      c.name,
            symbol:    c.symbol,
            iconAsset: CODE_TO_ICON[c.code] ?? 'currency1',
          }));
          setCurrencies(mapped.length > 0 ? mapped : ACTIVE_FALLBACK);
        }
      })
      .catch(() => {
        // Network/server error — keep the static active fallback already set
      })
      .finally(() => {
        setCurrenciesLoading(false);
      });
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  };

  const format = (amount: number): string => {
    try {
      return new Intl.NumberFormat(undefined, {
        style:                'currency',
        currency:             currency.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency.symbol}${amount.toLocaleString()}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, currencies, currenciesLoading, setCurrency, format }}
    >
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
