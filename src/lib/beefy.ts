/**
 * Beefy Finance API Integration
 * Auto-compounding vault aggregator
 * 
 * Docs: https://docs.beefy.finance/beefy-api
 */

const BEEFY_API_BASE = 'https://api.beefy.finance';

// Supported chains for NeverSell integration
export const BEEFY_CHAINS = ['arbitrum', 'base', 'optimism', 'polygon'] as const;
export type BeefyChain = typeof BEEFY_CHAINS[number];

export interface BeefyVault {
  id: string;
  name: string;
  token: string;
  tokenAddress: string;
  tokenDecimals: number;
  tokenProviderId: string;
  earnedToken: string;
  earnedTokenAddress: string;
  earnContractAddress: string;
  oracle: string;
  oracleId: string;
  status: 'active' | 'eol' | 'paused';
  platformId: string;
  assets: string[];
  risks: string[];
  strategyTypeId: string;
  buyTokenUrl?: string;
  addLiquidityUrl?: string;
  network: string;
  createdAt: number;
  chain: BeefyChain;
  pricePerFullShare: string;
  tvl?: number;
  apy?: number;
}

export interface BeefyApy {
  [vaultId: string]: number;
}

export interface BeefyTvl {
  [vaultId: string]: number;
}

export interface BeefyLp {
  price: number;
  tokens: string[];
  balances: string[];
  totalSupply: string;
}

export interface BeefyPrice {
  [tokenId: string]: number;
}

// Vault with computed data (APY, TVL, etc.)
export interface BeefyVaultWithStats extends BeefyVault {
  apy: number;
  tvl: number;
  apyBreakdown?: {
    vaultApr: number;
    tradingApr: number;
    totalApy: number;
  };
  riskScore: 'low' | 'medium' | 'high';
}

// Cache for API responses (5 minute TTL)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, CacheEntry<unknown>> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// API Functions
export async function fetchBeefyVaults(chain: BeefyChain): Promise<BeefyVault[]> {
  const cacheKey = `vaults:${chain}`;
  const cached = getCached<BeefyVault[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${BEEFY_API_BASE}/vaults/${chain}`);
    if (!res.ok) throw new Error(`Failed to fetch vaults: ${res.status}`);
    
    const vaults: BeefyVault[] = await res.json();
    
    // Add chain to each vault
    const vaultsWithChain = vaults
      .filter(v => v.status === 'active')
      .map(v => ({ ...v, chain }));
    
    setCache(cacheKey, vaultsWithChain);
    return vaultsWithChain;
  } catch (error) {
    console.error(`Error fetching Beefy vaults for ${chain}:`, error);
    return [];
  }
}

export async function fetchBeefyApys(): Promise<BeefyApy> {
  const cacheKey = 'apys';
  const cached = getCached<BeefyApy>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${BEEFY_API_BASE}/apy`);
    if (!res.ok) throw new Error(`Failed to fetch APYs: ${res.status}`);
    
    const apys: BeefyApy = await res.json();
    setCache(cacheKey, apys);
    return apys;
  } catch (error) {
    console.error('Error fetching Beefy APYs:', error);
    return {};
  }
}

export async function fetchBeefyApyBreakdown(): Promise<Record<string, { vaultApr: number; tradingApr: number; totalApy: number }>> {
  const cacheKey = 'apy-breakdown';
  const cached = getCached<Record<string, { vaultApr: number; tradingApr: number; totalApy: number }>>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${BEEFY_API_BASE}/apy/breakdown`);
    if (!res.ok) throw new Error(`Failed to fetch APY breakdown: ${res.status}`);
    
    const breakdown = await res.json();
    setCache(cacheKey, breakdown);
    return breakdown;
  } catch (error) {
    console.error('Error fetching Beefy APY breakdown:', error);
    return {};
  }
}

export async function fetchBeefyTvls(): Promise<BeefyTvl> {
  const cacheKey = 'tvls';
  const cached = getCached<BeefyTvl>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${BEEFY_API_BASE}/tvl`);
    if (!res.ok) throw new Error(`Failed to fetch TVLs: ${res.status}`);
    
    const tvls: BeefyTvl = await res.json();
    setCache(cacheKey, tvls);
    return tvls;
  } catch (error) {
    console.error('Error fetching Beefy TVLs:', error);
    return {};
  }
}

export async function fetchBeefyPrices(): Promise<BeefyPrice> {
  const cacheKey = 'prices';
  const cached = getCached<BeefyPrice>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`${BEEFY_API_BASE}/prices`);
    if (!res.ok) throw new Error(`Failed to fetch prices: ${res.status}`);
    
    const prices: BeefyPrice = await res.json();
    setCache(cacheKey, prices);
    return prices;
  } catch (error) {
    console.error('Error fetching Beefy prices:', error);
    return {};
  }
}

// Get all vaults across all chains with stats
export async function fetchAllVaultsWithStats(
  chains: BeefyChain[] = [...BEEFY_CHAINS]
): Promise<BeefyVaultWithStats[]> {
  // Fetch all data in parallel
  const [vaultsByChain, apys, tvls, apyBreakdown] = await Promise.all([
    Promise.all(chains.map(chain => fetchBeefyVaults(chain))),
    fetchBeefyApys(),
    fetchBeefyTvls(),
    fetchBeefyApyBreakdown(),
  ]);

  // Flatten and enrich vaults
  const allVaults: BeefyVaultWithStats[] = vaultsByChain.flat().map(vault => {
    const apy = (apys[vault.id] || 0) * 100; // Convert to percentage
    const tvl = tvls[vault.id] || 0;
    const breakdown = apyBreakdown[vault.id];

    return {
      ...vault,
      apy,
      tvl,
      apyBreakdown: breakdown ? {
        vaultApr: (breakdown.vaultApr || 0) * 100,
        tradingApr: (breakdown.tradingApr || 0) * 100,
        totalApy: (breakdown.totalApy || 0) * 100,
      } : undefined,
      riskScore: calculateRiskScore(vault, apy, tvl),
    };
  });

  return allVaults;
}

// Calculate risk score based on vault characteristics
function calculateRiskScore(vault: BeefyVault, apy: number, tvl: number): 'low' | 'medium' | 'high' {
  let riskPoints = 0;

  // High APY = higher risk
  if (apy > 50) riskPoints += 2;
  else if (apy > 20) riskPoints += 1;

  // Low TVL = higher risk
  if (tvl < 100000) riskPoints += 2;
  else if (tvl < 1000000) riskPoints += 1;

  // Check vault risks array
  const highRiskFlags = ['IL', 'COMPLEXITY', 'AUDIT', 'CONTRACTS'];
  vault.risks.forEach(risk => {
    if (highRiskFlags.some(flag => risk.toUpperCase().includes(flag))) {
      riskPoints += 1;
    }
  });

  // Stablecoin pairs are lower risk
  const stables = ['USDC', 'USDT', 'DAI', 'FRAX', 'LUSD'];
  if (vault.assets.every(asset => stables.includes(asset.toUpperCase()))) {
    riskPoints -= 2;
  }

  if (riskPoints <= 1) return 'low';
  if (riskPoints <= 3) return 'medium';
  return 'high';
}

// Filter and sort vaults
export interface VaultFilters {
  chains?: BeefyChain[];
  assets?: string[];
  minApy?: number;
  maxRisk?: 'low' | 'medium' | 'high';
  minTvl?: number;
  search?: string;
}

export function filterVaults(
  vaults: BeefyVaultWithStats[],
  filters: VaultFilters
): BeefyVaultWithStats[] {
  return vaults.filter(vault => {
    // Chain filter
    if (filters.chains?.length && !filters.chains.includes(vault.chain)) {
      return false;
    }

    // Asset filter
    if (filters.assets?.length) {
      const hasAsset = filters.assets.some(asset =>
        vault.assets.map(a => a.toUpperCase()).includes(asset.toUpperCase())
      );
      if (!hasAsset) return false;
    }

    // APY filter
    if (filters.minApy && vault.apy < filters.minApy) {
      return false;
    }

    // Risk filter
    if (filters.maxRisk) {
      const riskOrder = { low: 1, medium: 2, high: 3 };
      if (riskOrder[vault.riskScore] > riskOrder[filters.maxRisk]) {
        return false;
      }
    }

    // TVL filter
    if (filters.minTvl && vault.tvl < filters.minTvl) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesName = vault.name.toLowerCase().includes(search);
      const matchesAsset = vault.assets.some(a => a.toLowerCase().includes(search));
      const matchesPlatform = vault.platformId.toLowerCase().includes(search);
      if (!matchesName && !matchesAsset && !matchesPlatform) {
        return false;
      }
    }

    return true;
  });
}

export type SortField = 'apy' | 'tvl' | 'name' | 'risk';
export type SortOrder = 'asc' | 'desc';

export function sortVaults(
  vaults: BeefyVaultWithStats[],
  field: SortField,
  order: SortOrder = 'desc'
): BeefyVaultWithStats[] {
  const sorted = [...vaults].sort((a, b) => {
    let comparison = 0;
    
    switch (field) {
      case 'apy':
        comparison = a.apy - b.apy;
        break;
      case 'tvl':
        comparison = a.tvl - b.tvl;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'risk':
        const riskOrder = { low: 1, medium: 2, high: 3 };
        comparison = riskOrder[a.riskScore] - riskOrder[b.riskScore];
        break;
    }
    
    return order === 'desc' ? -comparison : comparison;
  });
  
  return sorted;
}

// Get vault by ID
export async function getVaultById(
  vaultId: string,
  chain?: BeefyChain
): Promise<BeefyVaultWithStats | null> {
  const chains = chain ? [chain] : [...BEEFY_CHAINS];
  const vaults = await fetchAllVaultsWithStats(chains);
  return vaults.find(v => v.id === vaultId) || null;
}

// Get top vaults by APY
export async function getTopVaults(
  limit: number = 10,
  filters?: VaultFilters
): Promise<BeefyVaultWithStats[]> {
  const vaults = await fetchAllVaultsWithStats();
  const filtered = filters ? filterVaults(vaults, filters) : vaults;
  const sorted = sortVaults(filtered, 'apy', 'desc');
  return sorted.slice(0, limit);
}

// Get recommended vault based on criteria
export async function getRecommendedVault(
  preference: 'high-yield' | 'stable' | 'balanced'
): Promise<BeefyVaultWithStats | null> {
  const vaults = await fetchAllVaultsWithStats();
  
  let filtered: BeefyVaultWithStats[];
  
  switch (preference) {
    case 'stable':
      filtered = filterVaults(vaults, {
        maxRisk: 'low',
        minTvl: 1000000,
        assets: ['USDC', 'USDT', 'DAI'],
      });
      break;
    case 'high-yield':
      filtered = filterVaults(vaults, {
        minApy: 20,
        minTvl: 500000,
      });
      break;
    case 'balanced':
    default:
      filtered = filterVaults(vaults, {
        maxRisk: 'medium',
        minTvl: 500000,
        minApy: 10,
      });
  }
  
  const sorted = sortVaults(filtered, 'apy', 'desc');
  return sorted[0] || null;
}
