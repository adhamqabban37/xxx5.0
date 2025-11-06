'use client';

import React from 'react';
import { create } from 'zustand';
import { FreeScan, PremiumScan, ScanContextType } from '@/types/scan';

// LocalStorage keys
const STORAGE_KEYS = {
  FREE_SCAN: 'xai.freeScan',
  PREMIUM_SCAN: 'xai.premiumScan',
} as const;

interface ScanStore extends ScanContextType {
  setFreeScan: (scan: FreeScan) => void;
  setPremiumScan: (scan: PremiumScan) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  clear: () => void;
  hydrate: () => void;
}

// Safe localStorage access (SSR compatible)
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silent fail
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Silent fail
    }
  },
};

export const useScanStore = create<ScanStore>((set, get) => ({
  freeScan: undefined,
  premiumScan: undefined,
  isLoading: false,
  error: undefined,

  setFreeScan: (scan: FreeScan) => {
    set({ freeScan: scan, error: undefined });
    safeLocalStorage.setItem(STORAGE_KEYS.FREE_SCAN, JSON.stringify(scan));
  },

  setPremiumScan: (scan: PremiumScan) => {
    const { freeScan } = get();

    // Critical validation: Premium scan URL MUST match free scan URL
    if (freeScan && scan.url !== freeScan.url) {
      throw new Error(`Premium scan URL (${scan.url}) must match free scan URL (${freeScan.url})`);
    }

    set({ premiumScan: scan, error: undefined });
    safeLocalStorage.setItem(STORAGE_KEYS.PREMIUM_SCAN, JSON.stringify(scan));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | undefined) => {
    set({ error, isLoading: false });
  },

  clear: () => {
    set({ freeScan: undefined, premiumScan: undefined, isLoading: false, error: undefined });
    safeLocalStorage.removeItem(STORAGE_KEYS.FREE_SCAN);
    safeLocalStorage.removeItem(STORAGE_KEYS.PREMIUM_SCAN);
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;

    try {
      const freeScanData = safeLocalStorage.getItem(STORAGE_KEYS.FREE_SCAN);
      const premiumScanData = safeLocalStorage.getItem(STORAGE_KEYS.PREMIUM_SCAN);

      const updates: Partial<ScanStore> = {};

      if (freeScanData) {
        const freeScan = JSON.parse(freeScanData) as FreeScan;
        updates.freeScan = freeScan;
      }

      if (premiumScanData) {
        const premiumScan = JSON.parse(premiumScanData) as PremiumScan;
        updates.premiumScan = premiumScan;
      }

      if (Object.keys(updates).length > 0) {
        set(updates);
      }
    } catch (error) {
      console.warn('Failed to hydrate scan data from localStorage:', error);
      // Clear corrupted data
      safeLocalStorage.removeItem(STORAGE_KEYS.FREE_SCAN);
      safeLocalStorage.removeItem(STORAGE_KEYS.PREMIUM_SCAN);
    }
  },
}));

// Custom hook for scan context
export const useScanContext = () => {
  const {
    freeScan,
    premiumScan,
    isLoading,
    error,
    setFreeScan,
    setPremiumScan,
    setLoading,
    setError,
    clear,
    hydrate,
  } = useScanStore();

  // Auto-hydrate on first use
  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  return {
    freeScan,
    premiumScan,
    isLoading,
    error,
    setFreeScan,
    setPremiumScan,
    setLoading,
    setError,
    clear,
  };
}; // Validation helpers
export const validateScanUrls = (freeScan?: FreeScan, premiumScan?: PremiumScan): boolean => {
  if (!freeScan) return false;
  if (premiumScan && premiumScan.url !== freeScan.url) {
    console.error('URL mismatch between free and premium scans');
    return false;
  }
  return true;
};
