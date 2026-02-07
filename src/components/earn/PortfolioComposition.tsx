"use client";

interface Allocation {
  poolId: string;
  name: string;
  percentage: number;
  color: string;
}

interface PortfolioCompositionProps {
  allocations: Allocation[];
  totalValue: number;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function PortfolioComposition({ allocations, totalValue }: PortfolioCompositionProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Portfolio Composition</h2>
        <span className="text-white/40 text-sm">{allocations.length} assets</span>
      </div>
      
      {/* Visual bar chart */}
      <div className="flex h-3 rounded-full overflow-hidden mb-6">
        {allocations.map((allocation) => (
          <div
            key={allocation.poolId}
            className={`bg-gradient-to-r ${allocation.color}`}
            style={{ width: `${allocation.percentage}%` }}
            title={`${allocation.name}: ${allocation.percentage}%`}
          />
        ))}
      </div>
      
      {/* Allocation list */}
      <div className="space-y-3">
        {allocations.map((allocation) => {
          const value = (allocation.percentage / 100) * totalValue;
          
          return (
            <div
              key={allocation.poolId}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Color indicator */}
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${allocation.color}`} />
                
                <div>
                  <p className="text-white font-medium">{allocation.poolId}</p>
                  <p className="text-white/40 text-xs">{allocation.name}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-white font-medium">{allocation.percentage}%</p>
                <p className="text-white/40 text-xs">{formatCurrency(value)}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Total */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-white/60">Total Value</span>
        <span className="text-white font-bold text-lg">{formatCurrency(totalValue)}</span>
      </div>
    </div>
  );
}
