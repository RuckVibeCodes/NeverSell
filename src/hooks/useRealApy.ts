"use client";

import { useState, useEffect } from 'react';

interface AssetApy {
  aaveApy: number;
  gmxApy: number;
  grossApy: number;
  netApy: number;
}

interface ApyData {
  assets: Record<string, AssetApy>;
  updatedAt: number;
}

interface ApyResponse {
  success: boolean;
  data?: ApyData;
  error?: {
    code: string;
    message: string;
  };
}

// Fallback APYs when API is unavailable (net after 10% fee)
// Realistic Feb 2026 values for Arbitrum
const FALLBACK_APY_DATA: ApyData = {
  assets: {
    usdc: { aaveApy: 4.50, gmxApy: 8.0, grossApy: 5.90, netApy: 5.31 },  // USDC stablecoin
    weth: { aaveApy: 2.10, gmxApy: 4.0, grossApy: 2.86, netApy: 2.57 },  // ETH
    wbtc: { aaveApy: 1.50, gmxApy: 2.5, grossApy: 1.90, netApy: 1.71 },  // WBTC
    arb:  { aaveApy: 0.60, gmxApy: 1.5, grossApy: 0.96, netApy: 0.86 },  // ARB token
  },
  updatedAt: 0,
};

/**
 * Hook to fetch real APY data from NeverSell API
 * Always returns usable data — falls back to conservative estimates on error
 */
export function useRealApy() {
  const [data, setData] = useState<ApyData>(FALLBACK_APY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApy() {
      try {
        const response = await fetch('/api/apy');
        const json: ApyResponse = await response.json();

        if (json.success && json.data?.assets) {
          setData(json.data);
          setError(null);
        } else {
          setError(json.error?.message || 'Failed to fetch APY data');
          // Keep existing data (either previous successful fetch or fallback)
        }
      } catch (err) {
        setError('Network error - could not fetch APY data');
        console.error('APY fetch error:', err);
        // Keep existing data
      } finally {
        setLoading(false);
      }
    }

    fetchApy();

    // Refresh every 5 minutes
    const interval = setInterval(fetchApy, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}

/**
 * Hook for a single asset's APY data
 */
export function useAssetApy(assetId: string) {
  const { data, loading, error } = useRealApy();

  return {
    apy: data.assets[assetId] || null,
    loading,
    error,
  };
}

/**
 * Get all asset APYs as a record
 */
export function useAllAssetApys() {
  const { data, loading, error } = useRealApy();
  return { apys: data.assets, loading, error };
}

/**
 * Format APY for display
 */
export function formatRealApy(apy: number | undefined): string {
  if (apy === undefined || apy === null) return '—';
  return `${apy.toFixed(2)}%`;
}

/**
 * Get APY color based on value
 */
export function getApyColor(apy: number): string {
  if (apy >= 10) return 'text-mint';      // Green for high yields
  if (apy >= 5) return 'text-emerald-400'; // Light green
  if (apy >= 3) return 'text-yellow-400'; // Yellow for moderate
  return 'text-white/60';                  // Gray for low
}
