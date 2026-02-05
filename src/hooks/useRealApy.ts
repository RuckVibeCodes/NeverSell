"use client";

import { useState, useEffect } from 'react';

interface ApyResponse {
  success: boolean;
  data: {
    assets: Record<string, {
      aaveApy: number;
      gmxApy: number;
      grossApy: number;
      netApy: number;
    }>;
    fee: number;
    updatedAt: number;
  };
}

/**
 * Hook to fetch real APY data from NeverSell API
 * Replaces mock data with live on-chain yields
 */
export function useRealApy() {
  const [data, setData] = useState<ApyResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchApy() {
      try {
        const response = await fetch('/api/apy');
        const json: ApyResponse = await response.json();
        
        if (json.success) {
          setData(json.data);
          setError(null);
        } else {
          setError('Failed to fetch APY data');
        }
      } catch (err) {
        setError('Failed to fetch APY data');
        console.error('APY fetch error:', err);
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
    apy: data?.assets[assetId] || null,
    loading,
    error,
  };
}

/**
 * Get all asset APYs as a record
 */
export function useAllAssetApys() {
  const { data, loading, error } = useRealApy();
  return { apys: data?.assets || null, loading, error };
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
