// GMX V2 Synthetics Integration for Arbitrum
// GM Pool liquidity provision for NeverSell yield strategy

import { type Address } from 'viem';

// ========== Chain Configuration ==========
export const ARBITRUM_CHAIN_ID = 42161;

// ========== GMX V2 Contract Addresses (Arbitrum) ==========
export const GMX_CONTRACTS = {
  // Core contracts
  exchangeRouter: '0x7C68C7866A64FA2160F78EEaE12217FFbf871fa8' as Address,
  depositVault: '0xF89e77e8Dc11691C9e8757e84aaFbCD8A67d7A55' as Address,
  withdrawalVault: '0x0628D46b5D145f183AdB6Ef1f2c97eD1C4701C55' as Address,
  router: '0x7452c558d45f8afC8c83dAe62C3f8A5BE19c71f6' as Address,
  dataStore: '0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8' as Address,
  reader: '0x38d91ED96283d62182Fc6d990C24097A918a4d9b' as Address,
  
  // Token addresses
  weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as Address,
  wbtc: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f' as Address,
  usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Address,
  arb: '0x912CE59144191C1204E64559FE8253a0e49E6548' as Address,
} as const;

// ========== GM Pool Addresses (Market Tokens) ==========
export const GM_POOLS = {
  'BTC/USD': {
    marketToken: '0x47c031236e19d024b42f8AE6780E44A573170703' as Address,
    longToken: GMX_CONTRACTS.wbtc,
    shortToken: GMX_CONTRACTS.usdc,
    indexToken: GMX_CONTRACTS.wbtc,
  },
  'ETH/USD': {
    marketToken: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336' as Address,
    longToken: GMX_CONTRACTS.weth,
    shortToken: GMX_CONTRACTS.usdc,
    indexToken: GMX_CONTRACTS.weth,
  },
  'ARB/USD': {
    marketToken: '0xC25cEf6061Cf5dE5eb761b50E4743c1F5D7E5407' as Address,
    longToken: GMX_CONTRACTS.arb,
    shortToken: GMX_CONTRACTS.usdc,
    indexToken: GMX_CONTRACTS.arb,
  },
} as const;

export type GMPoolName = keyof typeof GM_POOLS;

// ========== Types ==========
export interface GMPool {
  marketToken: Address;
  longToken: Address;
  shortToken: Address;
  indexToken: Address;
}

export interface DepositParams {
  receiver: Address;
  callbackContract: Address;
  uiFeeReceiver: Address;
  market: Address;
  initialLongToken: Address;
  initialShortToken: Address;
  longTokenSwapPath: Address[];
  shortTokenSwapPath: Address[];
  minMarketTokens: bigint;
  shouldUnwrapNativeToken: boolean;
  executionFee: bigint;
  callbackGasLimit: bigint;
}

export interface WithdrawalParams {
  receiver: Address;
  callbackContract: Address;
  uiFeeReceiver: Address;
  market: Address;
  longTokenSwapPath: Address[];
  shortTokenSwapPath: Address[];
  minLongTokenAmount: bigint;
  minShortTokenAmount: bigint;
  shouldUnwrapNativeToken: boolean;
  executionFee: bigint;
  callbackGasLimit: bigint;
}

export interface MarketInfo {
  marketToken: Address;
  indexToken: Address;
  longToken: Address;
  shortToken: Address;
}

export interface MarketPoolValueInfo {
  poolValue: bigint;
  longPnl: bigint;
  shortPnl: bigint;
  netPnl: bigint;
  longTokenAmount: bigint;
  shortTokenAmount: bigint;
  longTokenUsd: bigint;
  shortTokenUsd: bigint;
  totalBorrowingFees: bigint;
  borrowingFeePoolFactor: bigint;
  impactPoolAmount: bigint;
}

// ========== ABIs ==========

// ERC20 ABI for GM token balance
export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// GMX ExchangeRouter ABI (relevant functions)
export const EXCHANGE_ROUTER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'receiver', type: 'address' },
          { name: 'callbackContract', type: 'address' },
          { name: 'uiFeeReceiver', type: 'address' },
          { name: 'market', type: 'address' },
          { name: 'initialLongToken', type: 'address' },
          { name: 'initialShortToken', type: 'address' },
          { name: 'longTokenSwapPath', type: 'address[]' },
          { name: 'shortTokenSwapPath', type: 'address[]' },
          { name: 'minMarketTokens', type: 'uint256' },
          { name: 'shouldUnwrapNativeToken', type: 'bool' },
          { name: 'executionFee', type: 'uint256' },
          { name: 'callbackGasLimit', type: 'uint256' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'createDeposit',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { name: 'receiver', type: 'address' },
          { name: 'callbackContract', type: 'address' },
          { name: 'uiFeeReceiver', type: 'address' },
          { name: 'market', type: 'address' },
          { name: 'longTokenSwapPath', type: 'address[]' },
          { name: 'shortTokenSwapPath', type: 'address[]' },
          { name: 'minLongTokenAmount', type: 'uint256' },
          { name: 'minShortTokenAmount', type: 'uint256' },
          { name: 'shouldUnwrapNativeToken', type: 'bool' },
          { name: 'executionFee', type: 'uint256' },
          { name: 'callbackGasLimit', type: 'uint256' },
        ],
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'createWithdrawal',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'key', type: 'bytes32' }],
    name: 'cancelDeposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'key', type: 'bytes32' }],
    name: 'cancelWithdrawal',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokens', type: 'address[]' }],
    name: 'sendTokens',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'sendWnt',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'data', type: 'bytes[]' }],
    name: 'multicall',
    outputs: [{ name: 'results', type: 'bytes[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

// GMX Reader ABI for market data
export const READER_ABI = [
  {
    inputs: [
      { name: 'dataStore', type: 'address' },
      { name: 'market', type: 'address' },
      { name: 'indexTokenPrice', type: 'tuple', components: [
        { name: 'min', type: 'uint256' },
        { name: 'max', type: 'uint256' },
      ]},
      { name: 'longTokenPrice', type: 'tuple', components: [
        { name: 'min', type: 'uint256' },
        { name: 'max', type: 'uint256' },
      ]},
      { name: 'shortTokenPrice', type: 'tuple', components: [
        { name: 'min', type: 'uint256' },
        { name: 'max', type: 'uint256' },
      ]},
      { name: 'pnlFactorType', type: 'bytes32' },
      { name: 'maximize', type: 'bool' },
    ],
    name: 'getMarketTokenPrice',
    outputs: [
      { name: '', type: 'int256' },
      {
        components: [
          { name: 'poolValue', type: 'int256' },
          { name: 'longPnl', type: 'int256' },
          { name: 'shortPnl', type: 'int256' },
          { name: 'netPnl', type: 'int256' },
          { name: 'longTokenAmount', type: 'uint256' },
          { name: 'shortTokenAmount', type: 'uint256' },
          { name: 'longTokenUsd', type: 'uint256' },
          { name: 'shortTokenUsd', type: 'uint256' },
          { name: 'totalBorrowingFees', type: 'uint256' },
          { name: 'borrowingFeePoolFactor', type: 'uint256' },
          { name: 'impactPoolAmount', type: 'uint256' },
        ],
        name: 'poolValueInfo',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'dataStore', type: 'address' },
      { name: 'marketKey', type: 'address' },
    ],
    name: 'getMarket',
    outputs: [
      {
        components: [
          { name: 'marketToken', type: 'address' },
          { name: 'indexToken', type: 'address' },
          { name: 'longToken', type: 'address' },
          { name: 'shortToken', type: 'address' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'dataStore', type: 'address' },
      { name: 'start', type: 'uint256' },
      { name: 'end', type: 'uint256' },
    ],
    name: 'getMarkets',
    outputs: [
      {
        components: [
          { name: 'marketToken', type: 'address' },
          { name: 'indexToken', type: 'address' },
          { name: 'longToken', type: 'address' },
          { name: 'shortToken', type: 'address' },
        ],
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Router ABI for token approvals
export const ROUTER_ABI = [
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'pluginApprove',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// ========== Constants ==========
export const DEFAULT_EXECUTION_FEE = BigInt('100000000000000'); // 0.0001 ETH
export const DEFAULT_CALLBACK_GAS_LIMIT = BigInt(0);
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

// PNL factor type for getMarketTokenPrice
export const PNL_FACTOR_TYPE_FOR_DEPOSITS = 
  '0x0b86fd3c52f54d5a4a2c1c6b6b2e19b4b6d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0' as `0x${string}`;

// ========== Helper Functions ==========

/**
 * Get the GM pool configuration by name
 */
export function getGMPool(poolName: GMPoolName): GMPool {
  return GM_POOLS[poolName];
}

/**
 * Get all available GM pools
 */
export function getAllGMPools(): Record<GMPoolName, GMPool> {
  return GM_POOLS;
}

/**
 * Find pool name by market token address
 */
export function findPoolByMarketToken(marketToken: Address): GMPoolName | null {
  for (const [name, pool] of Object.entries(GM_POOLS)) {
    if (pool.marketToken.toLowerCase() === marketToken.toLowerCase()) {
      return name as GMPoolName;
    }
  }
  return null;
}

/**
 * Calculate slippage-adjusted minimum output
 */
export function calculateMinOutput(amount: bigint, slippageBps: number): bigint {
  const slippageFactor = BigInt(10000 - slippageBps);
  return (amount * slippageFactor) / BigInt(10000);
}

/**
 * Format GM token amount (18 decimals)
 */
export function formatGMAmount(amount: bigint): string {
  const formatted = Number(amount) / 1e18;
  return formatted.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

/**
 * Parse GM token amount from string
 */
export function parseGMAmount(amount: string): bigint {
  const parsed = parseFloat(amount);
  return BigInt(Math.floor(parsed * 1e18));
}
