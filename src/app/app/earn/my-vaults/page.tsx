'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  PieChart,
  Clock,
  Plus,
  Layers,
} from 'lucide-react';
import { 
  fetchUserPositions, 
  calculatePositionStats,
  formatDuration,
  formatValue,
  formatPercent,
  type UserPosition,
  type PositionStats,
} from '@/lib/positions';
import type { BeefyChain } from '@/lib/beefy';

// Ethereum provider type (matching window.ethereum shape)
interface TypedEthereum {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Helper to get typed ethereum
function getTypedEthereum(): TypedEthereum | undefined {
  return window.ethereum as TypedEthereum | undefined;
}

const chainColors: Record<BeefyChain, string> = {
  arbitrum: 'bg-blue-500',
  base: 'bg-blue-400',
  optimism: 'bg-red-500',
  polygon: 'bg-purple-500',
};

const chainLabels: Record<BeefyChain, string> = {
  arbitrum: 'Arbitrum',
  base: 'Base',
  optimism: 'Optimism',
  polygon: 'Polygon',
};

export default function MyVaultsPage() {
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [stats, setStats] = useState<PositionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Check wallet connection
    const eth = getTypedEthereum();
    if (eth) {
      eth.request({ method: 'eth_accounts' })
        .then((result: unknown) => {
          const accounts = result as string[];
          if (accounts.length > 0) {
            setIsConnected(true);
            setWalletAddress(accounts[0]);
            loadPositions(accounts[0]);
          } else {
            setLoading(false);
          }
        });
    } else {
      setLoading(false);
    }
  }, []);

  const loadPositions = async (address: string) => {
    try {
      const userPositions = await fetchUserPositions(address);
      setPositions(userPositions);
      setStats(calculatePositionStats(userPositions));
    } catch (err) {
      console.error('Failed to load positions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    const eth = getTypedEthereum();
    if (eth) {
      try {
        const result: unknown = await eth.request({ 
          method: 'eth_requestAccounts' 
        });
        const accounts = result as string[];
        setIsConnected(true);
        setWalletAddress(accounts[0]);
        loadPositions(accounts[0]);
      } catch (err) {
        console.error('Failed to connect:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading positions...</div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-6">
              Connect your wallet to view your vault positions
            </p>
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Vaults</h1>
            <p className="text-gray-400 text-sm">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </p>
          </div>
          <Link
            href="/app/earn"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium"
          >
            <Plus className="w-4 h-4" />
            New Deposit
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Layers}
              label="Total Value"
              value={formatValue(stats.totalValue)}
              subValue={`${stats.positionCount} positions`}
            />
            <StatCard
              icon={TrendingUp}
              label="Total Earnings"
              value={formatValue(stats.totalEarnings)}
              subValue={formatPercent((stats.totalEarnings / stats.totalDeposited) * 100)}
              positive
            />
            <StatCard
              icon={PieChart}
              label="Avg APY"
              value={`${stats.avgApy.toFixed(1)}%`}
              subValue="Weighted average"
            />
            <StatCard
              icon={Wallet}
              label="Total Deposited"
              value={formatValue(stats.totalDeposited)}
            />
          </div>
        )}

        {/* Chain Breakdown */}
        {stats && stats.positionCount > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4">
            <h3 className="text-sm text-gray-400 mb-3">Chain Distribution</h3>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(stats.chainBreakdown)
                .filter(([, data]) => data.count > 0)
                .map(([chain, data]) => (
                  <div
                    key={chain}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg"
                  >
                    <div className={`w-3 h-3 rounded-full ${chainColors[chain as BeefyChain]}`} />
                    <span className="text-sm text-gray-300">{chainLabels[chain as BeefyChain]}</span>
                    <span className="text-sm font-medium">{formatValue(data.value)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Positions List */}
        {positions.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <Layers className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Positions Yet</h3>
            <p className="text-gray-400 mb-4">
              Start earning yield by depositing into a vault
            </p>
            <Link
              href="/app/earn"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium"
            >
              Browse Vaults <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Active Positions</h2>
            {positions.map((position) => (
              <PositionCard key={position.id} position={position} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  positive,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      {subValue && (
        <p className={`text-sm ${positive ? 'text-emerald-400' : 'text-gray-500'}`}>
          {subValue}
        </p>
      )}
    </div>
  );
}

function PositionCard({ position }: { position: UserPosition }) {
  const isPositive = parseFloat(position.earnings) >= 0;

  return (
    <div className="bg-gray-900 rounded-2xl p-4 hover:border-gray-700 border border-gray-800 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Vault Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center">
            <span className="text-lg font-bold">{position.depositToken.slice(0, 2)}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{position.vaultId}</h3>
              <span className={`w-2 h-2 rounded-full ${chainColors[position.chain]}`} />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(position.depositTimestamp)}</span>
            </div>
          </div>
        </div>

        {/* Right: Value */}
        <div className="text-right">
          <p className="text-xl font-bold">{formatValue(position.currentValue)}</p>
          <div className={`flex items-center justify-end gap-1 text-sm ${
            isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{formatValue(position.earnings)} ({formatPercent(position.earningsPercent)})</span>
          </div>
        </div>
      </div>

      {/* Bottom: Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
        <div className="text-sm text-gray-400">
          Deposited: {position.depositAmount} {position.depositToken}
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium">
            Withdraw
          </button>
          <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-sm font-medium">
            Add More
          </button>
        </div>
      </div>
    </div>
  );
}
