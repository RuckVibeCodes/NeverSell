import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAllVaultsWithStats,
  filterVaults,
  sortVaults,
  BEEFY_CHAINS,
  type BeefyChain,
  type VaultFilters,
  type SortField,
  type SortOrder,
} from '@/lib/beefy';

/**
 * GET /api/earn/vaults
 * 
 * Query params:
 * - chains: comma-separated list (arbitrum,base,optimism,polygon)
 * - assets: comma-separated list (ETH,USDC,BTC)
 * - minApy: minimum APY (number)
 * - maxRisk: low, medium, high
 * - minTvl: minimum TVL in USD
 * - search: search term
 * - sort: apy, tvl, name, risk
 * - order: asc, desc
 * - limit: number of results
 * - offset: pagination offset
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query params
    const chainsParam = searchParams.get('chains');
    const assetsParam = searchParams.get('assets');
    const minApy = searchParams.get('minApy');
    const maxRisk = searchParams.get('maxRisk') as 'low' | 'medium' | 'high' | null;
    const minTvl = searchParams.get('minTvl');
    const search = searchParams.get('search');
    const sort = (searchParams.get('sort') || 'apy') as SortField;
    const order = (searchParams.get('order') || 'desc') as SortOrder;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filters
    const filters: VaultFilters = {};
    
    if (chainsParam) {
      const chains = chainsParam.split(',').filter(c => 
        BEEFY_CHAINS.includes(c as BeefyChain)
      ) as BeefyChain[];
      if (chains.length) filters.chains = chains;
    }
    
    if (assetsParam) {
      filters.assets = assetsParam.split(',').map(a => a.trim().toUpperCase());
    }
    
    if (minApy) {
      filters.minApy = parseFloat(minApy);
    }
    
    if (maxRisk && ['low', 'medium', 'high'].includes(maxRisk)) {
      filters.maxRisk = maxRisk;
    }
    
    if (minTvl) {
      filters.minTvl = parseFloat(minTvl);
    }
    
    if (search) {
      filters.search = search;
    }

    // Fetch all vaults
    const allVaults = await fetchAllVaultsWithStats();
    
    // Apply filters
    const filtered = filterVaults(allVaults, filters);
    
    // Sort
    const sorted = sortVaults(filtered, sort, order);
    
    // Paginate
    const total = sorted.length;
    const vaults = sorted.slice(offset, offset + limit);
    
    // Calculate aggregate stats
    const stats = {
      totalVaults: total,
      totalTvl: sorted.reduce((sum, v) => sum + v.tvl, 0),
      avgApy: sorted.length > 0 
        ? sorted.reduce((sum, v) => sum + v.apy, 0) / sorted.length 
        : 0,
      chainBreakdown: Object.fromEntries(
        BEEFY_CHAINS.map(chain => [
          chain,
          sorted.filter(v => v.chain === chain).length
        ])
      ),
    };

    return NextResponse.json({
      vaults,
      stats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching vaults:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vaults' },
      { status: 500 }
    );
  }
}
