import { useState, useEffect } from 'react';

interface ApyData {
  aaveApy: number;
  gmxApy: number;
  grossApy: number;
  netApy: number;
}

interface AssetApy {
  wbtc: ApyData;
  weth: ApyData;
  usdc: ApyData;
  arb: ApyData;
}

interface ApyResponse {
  success: boolean;
  data: {
    assets: AssetApy;
    fee: number;
    updatedAt: number;
  };
}

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

// Display component for APY
export function ApyDisplay({ 
  assetId, 
  data 
}: { 
  assetId: string; 
  data: ApyData | undefined;
}) {
  if (!data) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-mint font-semibold">{data.netApy.toFixed(2)}%</span>
        <span className="text-xs text-muted-foreground">net APY</span>
      </div>
      <div className="text-xs text-white/40">
        {data.gmxApy.toFixed(1)}% GMX + {data.aaveApy.toFixed(1)}% Aave
      </div>
    </div>
  );
}

// Banner showing overall protocol stats
export function ProtocolApyBanner({ data }: { data: ApyResponse['data'] }) {
  if (!data) return null;

  const avgApy = Object.values(data.assets).reduce((sum, a) => sum + a.netApy, 0) / 4;

  return (
    <div className="glass-card p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Average Net APY</p>
          <p className="text-3xl font-bold text-mint">{avgApy.toFixed(2)}%</p>
        </div>
        <div className="text-right text-sm text-white/40">
          <p>Updated {new Date(data.updatedAt).toLocaleTimeString()}</p>
          <p>Fee: {data.fee}%</p>
        </div>
      </div>
    </div>
  );
}
