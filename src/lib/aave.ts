/**
 * Aave V3 Integration for Arbitrum One
 * Docs: https://docs.aave.com/developers/
 */

// =============================================================================
// Contract Addresses - Arbitrum One (Chain ID: 42161)
// =============================================================================

export const AAVE_V3_ADDRESSES = {
  // Core Protocol
  POOL: "0x794a61358D6845594F94dc1DB02A252b5b4814aD" as const,
  POOL_DATA_PROVIDER: "0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654" as const,
  UI_POOL_DATA_PROVIDER: "0x145dE30c929a065582da84Cf96F88460dB9745A7" as const,
  ORACLE: "0xb56c2F0B653B2e0b10C9b928C8580Ac5Df02C7C7" as const,
  
  // Common Assets on Arbitrum
  USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as const,
  USDC_E: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8" as const,
  WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" as const,
  WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f" as const,
  ARB: "0x912CE59144191C1204E64559FE8253a0e49E6548" as const,
  
  // aTokens (interest-bearing tokens)
  aUSDC: "0x724dc807b04555b71ed48a6896b6F41593b8C637" as const,
  aWETH: "0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8" as const,
  aWBTC: "0x078f358208685046a11C85e8ad32895DED33A249" as const,
  
  // Variable Debt Tokens
  variableDebtUSDC: "0xFCCf3cAbbe80101232d343252614b6A3eE81C989" as const,
  variableDebtWETH: "0x0c84331e39d6658Cd6e6b9ba04736cC4c4734351" as const,
} as const;

export const ARBITRUM_CHAIN_ID = 42161;

export const INTEREST_RATE_MODE = {
  NONE: 0,
  STABLE: 1,
  VARIABLE: 2,
} as const;

// =============================================================================
// ABIs
// =============================================================================

export const AAVE_POOL_ABI = [
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
      { name: "referralCode", type: "uint16" },
    ],
    name: "supply",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "to", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "interestRateMode", type: "uint256" },
      { name: "referralCode", type: "uint16" },
      { name: "onBehalfOf", type: "address" },
    ],
    name: "borrow",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "interestRateMode", type: "uint256" },
      { name: "onBehalfOf", type: "address" },
    ],
    name: "repay",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getUserAccountData",
    outputs: [
      { name: "totalCollateralBase", type: "uint256" },
      { name: "totalDebtBase", type: "uint256" },
      { name: "availableBorrowsBase", type: "uint256" },
      { name: "currentLiquidationThreshold", type: "uint256" },
      { name: "ltv", type: "uint256" },
      { name: "healthFactor", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const POOL_DATA_PROVIDER_ABI = [
  {
    inputs: [
      { name: "asset", type: "address" },
      { name: "user", type: "address" },
    ],
    name: "getUserReserveData",
    outputs: [
      { name: "currentATokenBalance", type: "uint256" },
      { name: "currentStableDebt", type: "uint256" },
      { name: "currentVariableDebt", type: "uint256" },
      { name: "principalStableDebt", type: "uint256" },
      { name: "scaledVariableDebt", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "stableRateLastUpdated", type: "uint40" },
      { name: "usageAsCollateralEnabled", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "asset", type: "address" }],
    name: "getReserveData",
    outputs: [
      { name: "unbacked", type: "uint256" },
      { name: "accruedToTreasuryScaled", type: "uint256" },
      { name: "totalAToken", type: "uint256" },
      { name: "totalStableDebt", type: "uint256" },
      { name: "totalVariableDebt", type: "uint256" },
      { name: "liquidityRate", type: "uint256" },
      { name: "variableBorrowRate", type: "uint256" },
      { name: "stableBorrowRate", type: "uint256" },
      { name: "averageStableBorrowRate", type: "uint256" },
      { name: "liquidityIndex", type: "uint256" },
      { name: "variableBorrowIndex", type: "uint256" },
      { name: "lastUpdateTimestamp", type: "uint40" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// =============================================================================
// Types
// =============================================================================

export interface AaveUserAccountData {
  totalCollateralBase: bigint;
  totalDebtBase: bigint;
  availableBorrowsBase: bigint;
  currentLiquidationThreshold: bigint;
  ltv: bigint;
  healthFactor: bigint;
}

export interface AavePosition {
  totalCollateralUSD: number;
  totalDebtUSD: number;
  availableBorrowsUSD: number;
  healthFactor: number;
  ltv: number;
  liquidationThreshold: number;
  raw: AaveUserAccountData;
}

export const ASSET_DECIMALS: Record<string, number> = {
  [AAVE_V3_ADDRESSES.USDC]: 6,
  [AAVE_V3_ADDRESSES.USDC_E]: 6,
  [AAVE_V3_ADDRESSES.WETH]: 18,
  [AAVE_V3_ADDRESSES.WBTC]: 8,
  [AAVE_V3_ADDRESSES.ARB]: 18,
};

// =============================================================================
// Utility Functions
// =============================================================================

export function parseHealthFactor(healthFactor: bigint): number {
  if (healthFactor >= BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") / BigInt(2)) {
    return Infinity;
  }
  return Number(healthFactor) / 1e18;
}

export function parseBaseToUSD(amount: bigint): number {
  return Number(amount) / 1e8;
}

export function parsePercentage(value: bigint): number {
  return Number(value) / 100;
}

export function formatTokenAmount(amount: bigint, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals);
}

export function parseTokenAmount(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}
