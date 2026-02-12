/**
 * Multi-Chain Balance Fetching
 * Get token balances across all supported chains
 */

import { ChainId } from '@lifi/sdk';

// Supported chains for balance queries
export const BALANCE_CHAINS = [
  ChainId.ETH,
  ChainId.ARB,
  ChainId.BAS,
  ChainId.OPT,
  ChainId.POL,
] as const;

export type BalanceChainId = typeof BALANCE_CHAINS[number];

export interface TokenBalance {
  chainId: BalanceChainId;
  chainName: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenDecimals: number;
  balance: string;
  balanceUsd: number;
  price: number;
}

export interface WalletBalances {
  walletAddress: string;
  totalValueUsd: number;
  chains: {
    [key in BalanceChainId]?: TokenBalance[];
  };
}

export interface ChainInfo {
  id: BalanceChainId;
  name: string;
  symbol: string;
  color: string;
  rpc: string;
  explorer: string;
}

export const CHAIN_INFO: Record<BalanceChainId, ChainInfo> = {
  [ChainId.ETH]: {
    id: ChainId.ETH,
    name: 'Ethereum',
    symbol: 'ETH',
    color: '#627EEA',
    rpc: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
  },
  [ChainId.ARB]: {
    id: ChainId.ARB,
    name: 'Arbitrum',
    symbol: 'ARB',
    color: '#28A0F0',
    rpc: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
  },
  [ChainId.BAS]: {
    id: ChainId.BAS,
    name: 'Base',
    symbol: 'BASE',
    color: '#0052FF',
    rpc: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
  },
  [ChainId.OPT]: {
    id: ChainId.OPT,
    name: 'Optimism',
    symbol: 'OP',
    color: '#FF0420',
    rpc: 'https://mainnet.optimism.io',
    explorer: 'https://optimistic.etherscan.io',
  },
  [ChainId.POL]: {
    id: ChainId.POL,
    name: 'Polygon',
    symbol: 'MATIC',
    color: '#8247E5',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
  },
};

// Common tokens to check balances for
export const COMMON_TOKENS: Record<BalanceChainId, Array<{
  address: string;
  symbol: string;
  decimals: number;
}>> = {
  [ChainId.ETH]: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', decimals: 18 },
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
    { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8 },
  ],
  [ChainId.ARB]: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', decimals: 18 },
    { address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6 },
    { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', symbol: 'WETH', decimals: 18 },
  ],
  [ChainId.BAS]: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', decimals: 18 },
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 },
  ],
  [ChainId.OPT]: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'ETH', decimals: 18 },
    { address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', decimals: 6 },
  ],
  [ChainId.POL]: [
    { address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', symbol: 'MATIC', decimals: 18 },
    { address: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359', symbol: 'USDC', decimals: 6 },
  ],
};

// Token prices (would be fetched from API in production)
export async function getTokenPrices(
  tokenIds: string[]
): Promise<Record<string, number>> {
  // TODO: Fetch from price API (Coingecko, CoinGecko, etc.)
  const mockPrices: Record<string, number> = {
    ETH: 2500,
    WETH: 2500,
    USDC: 1,
    USDT: 1,
    DAI: 1,
    WBTC: 45000,
    MATIC: 0.8,
    ARB: 0.8,
    OP: 2.5,
    BASE: 0.5,
  };

  return tokenIds.reduce((acc, id) => {
    acc[id] = mockPrices[id.toUpperCase()] || 0;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get native ETH balance for a wallet on a chain
 */
export async function getNativeBalance(
  chainId: BalanceChainId,
  walletAddress: string
): Promise<TokenBalance> {
  // Using public RPC for read-only balance check
  const rpcUrl = CHAIN_INFO[chainId].rpc;
  
  const payload = {
    jsonrpc: '2.0',
    method: 'eth_getBalance',
    params: [walletAddress, 'latest'],
    id: 1,
  };

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const balanceWei = BigInt(data.result || '0');
    const balanceEth = Number(balanceWei) / 1e18;

    const prices = await getTokenPrices(['ETH']);
    const price = prices['ETH'];

    return {
      chainId,
      chainName: CHAIN_INFO[chainId].name,
      tokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      tokenSymbol: 'ETH',
      tokenDecimals: 18,
      balance: balanceWei.toString(),
      balanceUsd: balanceEth * price,
      price,
    };
  } catch (error) {
    console.error(`Error fetching native balance on ${chainId}:`, error);
    return {
      chainId,
      chainName: CHAIN_INFO[chainId].name,
      tokenAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      tokenSymbol: 'ETH',
      tokenDecimals: 18,
      balance: '0',
      balanceUsd: 0,
      price: 0,
    };
  }
}

/**
 * Get ERC20 token balance for a wallet on a chain
 */
export async function getErc20Balance(
  chainId: BalanceChainId,
  walletAddress: string,
  tokenAddress: string,
  symbol: string,
  decimals: number
): Promise<TokenBalance> {
  const rpcUrl = CHAIN_INFO[chainId].rpc;
  
  // ERC20 balanceOf ABI
  const data = `0x70a08231000000000000000000000000${walletAddress.slice(2)}`;

  const payload = {
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [{
      to: tokenAddress,
      data,
    }, 'latest'],
    id: 1,
  };

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    const balanceWei = BigInt(result.result || '0');
    const balanceToken = Number(balanceWei) / Math.pow(10, decimals);

    const prices = await getTokenPrices([symbol]);
    const price = prices[symbol] || 0;

    return {
      chainId,
      chainName: CHAIN_INFO[chainId].name,
      tokenAddress,
      tokenSymbol: symbol,
      tokenDecimals: decimals,
      balance: balanceWei.toString(),
      balanceUsd: balanceToken * price,
      price,
    };
  } catch (error) {
    console.error(`Error fetching ${symbol} balance on ${chainId}:`, error);
    return {
      chainId,
      chainName: CHAIN_INFO[chainId].name,
      tokenAddress,
      tokenSymbol: symbol,
      tokenDecimals: decimals,
      balance: '0',
      balanceUsd: 0,
      price: 0,
    };
  }
}

/**
 * Get all token balances for a wallet across all chains
 */
export async function getWalletBalances(
  walletAddress: string
): Promise<WalletBalances> {
  const chainPromises = BALANCE_CHAINS.map(async (chainId) => {
    // Get native balance
    const nativePromise = getNativeBalance(chainId, walletAddress);
    
    // Get ERC20 balances
    const erc20Promises = COMMON_TOKENS[chainId].map(token => 
      getErc20Balance(chainId, walletAddress, token.address, token.symbol, token.decimals)
    );

    const [native, ...erc20s] = await Promise.all([nativePromise, ...erc20Promises]);
    
    // Filter out zero balances
    const balances = [native, ...erc20s].filter(b => b.balanceUsd > 0.01);
    
    return { [chainId]: balances };
  });

  const chainResults = await Promise.all(chainPromises);
  
  // Combine all chains
  const chains = chainResults.reduce((acc, result) => {
    return { ...acc, ...result };
  }, {} as WalletBalances['chains']);

  // Calculate total value
  const totalValueUsd = Object.values(chains)
    .flat()
    .reduce((sum, b) => sum + b.balanceUsd, 0);

  return {
    walletAddress,
    totalValueUsd,
    chains,
  };
}

/**
 * Get total value across all chains (simplified)
 */
export async function getTotalPortfolioValue(
  walletAddress: string
): Promise<{
  totalUsd: number;
  chainBreakdown: Array<{ chainId: number; value: number; percent: number }>;
}> {
  const balances = await getWalletBalances(walletAddress);
  
  const breakdown = Object.entries(balances.chains).map(([chainIdStr, balances]) => {
    const chainId = parseInt(chainIdStr) as BalanceChainId;
    const value = balances.reduce((sum, b) => sum + b.balanceUsd, 0);
    return { chainId, value, percent: 0 };
  });

  const totalUsd = breakdown.reduce((sum, b) => sum + b.value, 0);

  // Calculate percentages
  return {
    totalUsd,
    chainBreakdown: breakdown.map(b => ({
      ...b,
      percent: totalUsd > 0 ? (b.value / totalUsd) * 100 : 0,
    })),
  };
}

/**
 * Format balance for display
 */
export function formatBalance(balance: string | number, decimals: number = 2): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(decimals)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(decimals)}K`;
  return num.toFixed(decimals);
}
