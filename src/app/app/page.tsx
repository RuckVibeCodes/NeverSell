"use client";

import Link from "next/link";
import { TrendingUp,  ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

const mockPositions = {
  totalDeposited: 0,
  totalBorrowed: 0,
  netAPY: 0,
  healthFactor: 0,
};

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-white/60">Overview of your positions and activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="stat-card">
          <span className="text-white/50 text-sm">Total Deposited</span>
          <span className="text-2xl font-bold text-white">
            ${mockPositions.totalDeposited.toLocaleString()}
          </span>
        </div>
        <div className="stat-card">
          <span className="text-white/50 text-sm">Total Borrowed</span>
          <span className="text-2xl font-bold text-white">
            ${mockPositions.totalBorrowed.toLocaleString()}
          </span>
        </div>
        <div className="stat-card">
          <span className="text-white/50 text-sm">Net APY</span>
          <span className="text-2xl font-bold text-mint">
            {mockPositions.netAPY}%
          </span>
        </div>
        <div className="stat-card">
          <span className="text-white/50 text-sm">Health Factor</span>
          <span className="text-2xl font-bold text-white">
            {mockPositions.healthFactor || "—"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/app/deposit" className="glass-card p-6 hover:border-mint/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-mint/10 flex items-center justify-center group-hover:bg-mint/20 transition-colors">
              <ArrowDownToLine className="text-mint" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Deposit Assets</h3>
              <p className="text-white/50 text-sm">Supply collateral and earn yield</p>
            </div>
          </div>
        </Link>
        
        <Link href="/app/borrow" className="glass-card p-6 hover:border-mint/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-mint/10 flex items-center justify-center group-hover:bg-mint/20 transition-colors">
              <ArrowUpFromLine className="text-mint" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Borrow</h3>
              <p className="text-white/50 text-sm">Access liquidity without selling</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Your Positions</h2>
        <div className="text-center py-12 text-white/50">
          <TrendingUp className="mx-auto mb-4 opacity-50" size={48} />
          <p>No positions yet. Deposit assets to get started.</p>
        </div>
      </div>
    </div>
  );
}
