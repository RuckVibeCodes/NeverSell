// GMX SDK Configuration for Arbitrum
// https://docs.gmx.io/docs/sdk/

export const GMX_SDK_CONFIG = {
  chainId: 42161, // Arbitrum One
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  oracleUrl: 'https://arbitrum-api.gmxinfra.io',
  subsquidUrl: 'https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql',
} as const;

// REST API endpoints (backup/fallback)
export const GMX_REST_API = {
  marketsInfo: 'https://arbitrum-api.gmxinfra.io/markets/info',
  tokens: 'https://arbitrum-api.gmxinfra.io/tokens',
  prices: 'https://arbitrum-api.gmxinfra.io/prices/tickers',
  glvInfo: 'https://arbitrum-api.gmxinfra.io/glvs/info',
} as const;

// Cache configuration
export const GMX_CACHE_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchInterval: 5 * 60 * 1000, // 5 minutes
} as const;
