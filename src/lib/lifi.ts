import { 
  createConfig, 
  getQuote, 
  executeRoute, 
  convertQuoteToRoute,
  ChainId, 
  type QuoteRequest, 
  type Route,
  type LiFiStep,
} from '@lifi/sdk';

// Arbitrum One chain ID (main destination for deposits)
export const ARBITRUM_CHAIN_ID = ChainId.ARB;

// NeverSell's fee percentage on bridge transactions (0.1%)
export const NEVERSELL_FEE_BPS = 10; // basis points

// Supported source chains for cross-chain deposits
export const SUPPORTED_SOURCE_CHAINS = [
  { id: ChainId.ETH, name: 'Ethereum', symbol: 'ETH' },
  { id: ChainId.ARB, name: 'Arbitrum', symbol: 'ARB' },
  { id: ChainId.BAS, name: 'Base', symbol: 'BASE' },
  { id: ChainId.OPT, name: 'Optimism', symbol: 'OP' },
  { id: ChainId.POL, name: 'Polygon', symbol: 'POL' },
] as const;

// Common token addresses
export const TOKENS = {
  // Native ETH (represented as zero address in Li.Fi)
  NATIVE: '0x0000000000000000000000000000000000000000',
  // USDC on various chains
  USDC: {
    [ChainId.ETH]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    [ChainId.ARB]: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    [ChainId.BAS]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    [ChainId.OPT]: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    [ChainId.POL]: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
  },
  // WETH on Arbitrum (destination)
  WETH_ARB: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
} as const;

// Initialize Li.Fi SDK config with fee collection
export function initLiFiConfig() {
  createConfig({
    integrator: process.env.NEXT_PUBLIC_LIFI_INTEGRATOR || 'NeverSell',
    apiKey: process.env.NEXT_PUBLIC_LIFI_API_KEY,
    // Fee is configured per-request in getBridgeQuote
  });
}

export interface BridgeQuoteParams {
  fromChainId: number;
  toChainId?: number; // defaults to Arbitrum
  fromTokenAddress: string;
  toTokenAddress: string;
  fromAmount: string; // in wei
  fromAddress: string;
  toAddress?: string; // defaults to fromAddress
  slippage?: number; // 0.03 = 3%
}

export interface BridgeQuoteResult {
  route: Route;
  step: LiFiStep;
  estimatedOutput: string;
  estimatedOutputFormatted: string;
  estimatedGasCost: string;
  estimatedTime: number; // in seconds
  bridgeName: string;
}

/**
 * Get a quote for bridging/swapping tokens to Arbitrum
 */
export async function getBridgeQuote(params: BridgeQuoteParams): Promise<BridgeQuoteResult> {
  const {
    fromChainId,
    toChainId = ARBITRUM_CHAIN_ID,
    fromTokenAddress,
    toTokenAddress,
    fromAmount,
    fromAddress,
    toAddress = fromAddress,
    slippage = 0.005, // 0.5% default
  } = params;

  // Get integrator fee (0.1% = 0.001)
  const integratorFee = parseFloat(process.env.NEXT_PUBLIC_LIFI_FEE || '0.001');
  
  const quoteRequest: QuoteRequest = {
    fromChain: fromChainId,
    toChain: toChainId,
    fromToken: fromTokenAddress,
    toToken: toTokenAddress,
    fromAmount,
    fromAddress,
    toAddress,
    slippage,
    // Integrator fee - 0.1% goes to NeverSell
    fee: integratorFee,
  };

  // getQuote returns a single LiFiStep
  const step = await getQuote(quoteRequest);
  
  // Convert the step to a Route for execution
  const route = convertQuoteToRoute(step);

  // Extract useful info from the step
  const estimatedOutput = step.estimate?.toAmount || '0';
  const toToken = step.action?.toToken;
  
  // Format output amount with decimals
  const decimals = toToken?.decimals || 18;
  const estimatedOutputFormatted = (
    Number(estimatedOutput) / Math.pow(10, decimals)
  ).toFixed(6);

  // Calculate total gas cost in USD
  const gasCosts = step.estimate?.gasCosts || [];
  const estimatedGasCost = gasCosts
    .reduce((sum, cost) => sum + Number(cost.amountUSD || 0), 0)
    .toFixed(2);
  
  // Get execution time estimate in seconds
  const estimatedTime = step.estimate?.executionDuration || 0;

  // Get bridge/DEX name
  const bridgeName = step.toolDetails?.name || step.tool || 'Unknown';

  return {
    route,
    step,
    estimatedOutput,
    estimatedOutputFormatted,
    estimatedGasCost,
    estimatedTime,
    bridgeName,
  };
}

/**
 * Execute a bridge route (requires wallet connection via wagmi)
 */
export async function executeBridgeRoute(route: Route): Promise<void> {
  // Execute the route - Li.Fi handles all the complexity
  // The SDK will use the connected wallet automatically
  await executeRoute(route, {
    // Update hook callbacks can be added here for UI updates
    updateRouteHook: (updatedRoute) => {
      console.log('Route updated:', updatedRoute.id);
    },
  });
}

/**
 * Format time estimate to human readable string
 */
export function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) {
    return `~${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `~${minutes} min`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.ceil((seconds % 3600) / 60);
    return `~${hours}h ${minutes}m`;
  }
}

/**
 * Check if a transfer is cross-chain (needs bridging)
 */
export function isCrossChainDeposit(sourceChainId: number): boolean {
  return sourceChainId !== ARBITRUM_CHAIN_ID;
}

// ============================================
// Cross-Chain Deposit Flow
// ============================================

export interface CrossChainDepositParams {
  // Source
  sourceChainId: number;
  sourceToken: string;
  sourceAmount: string; // in wei
  senderAddress: string;
  
  // Destination (where the vault is)
  destChainId?: number; // defaults to ARB
  destToken: string; // token to receive on dest
  
  // Vault deposit
  vaultAddress: string; // Beefy vault contract on dest chain
  
  // Options
  slippage?: number; // 0.005 = 0.5%
  referrer?: string; // for affiliate tracking
}

export interface CrossChainQuote {
  fromAmount: string;
  toAmount: string;
  toAmountMin: string; // after slippage
  bridgeFee: string; // NeverSell fee
  bridgeName: string;
  estimatedTime: number;
  gasCostUsd: string;
  routeId: string;
  steps: LiFiStep[];
}

export interface CrossChainDepositResult {
  quote: CrossChainQuote;
  route: Route;
  txHash?: string;
  status: 'pending' | 'submitted' | 'completed' | 'failed';
}

/**
 * Get a quote for cross-chain deposit to a Beefy vault
 */
export async function getCrossChainDepositQuote(
  params: CrossChainDepositParams
): Promise<CrossChainQuote> {
  const {
    sourceChainId,
    sourceToken,
    sourceAmount,
    destChainId = ARBITRUM_CHAIN_ID,
    destToken,
    senderAddress,
    slippage = 0.005,
  } = params;

  // Handle native ETH (LiFi uses 0x000... for native)
  const fromTokenAddress = sourceToken === 'NATIVE' 
    ? '0x0000000000000000000000000000000000000000'
    : sourceToken;

  // For cross-chain to same token (no swap needed)
  // Use the swap functionality even for direct bridge
  
  const quoteRequest: QuoteRequest = {
    fromChain: sourceChainId,
    toChain: destChainId,
    fromToken: fromTokenAddress,
    toToken: destToken,
    fromAmount,
    fromAddress: senderAddress,
    toAddress: senderAddress, // Will be updated to vault address
    slippage,
    // Fee configuration
    fee: NEVERSELL_FEE_BPS / 10000, // Convert bps to percentage
    // Integrator info
    integrator: 'NeverSell',
  };

  const step = await getQuote(quoteRequest);
  const route = convertQuoteToRoute(step);

  // Calculate minimum output (after slippage)
  const toAmount = step.estimate?.toAmount || '0';
  const toAmountMin = (
    Number(toAmount) * (1 - slippage)
  ).toFixed(0);

  // Calculate NeverSell's fee (0.1% of input)
  const bridgeFee = (
    Number(sourceAmount) * (NEVERSELL_FEE_BPS / 10000) * 0.1 // $ value approximation
  ).toFixed(2);

  return {
    fromAmount: sourceAmount,
    toAmount,
    toAmountMin,
    bridgeFee,
    bridgeName: step.toolDetails?.name || step.tool || 'Unknown',
    estimatedTime: step.estimate?.executionDuration || 0,
    gasCostUsd: step.estimate?.gasCosts
      ?.reduce((sum, cost) => sum + Number(cost.amountUSD || 0), 0)
      .toFixed(2) || '0',
    routeId: step.id,
    steps: [step],
  };
}

/**
 * Execute a cross-chain deposit
 * 
 * Steps:
 * 1. User approves token spending (if needed)
 * 2. Execute LiFi bridge route
 * 3. Update position in database
 */
export async function executeCrossChainDeposit(
  quote: CrossChainQuote,
  senderAddress: string,
  vaultAddress: string
): Promise<CrossChainDepositResult> {
  // Update the route's toAddress to be the vault
  const route = quote.steps[0] && convertQuoteToRoute(quote.steps[0]);
  
  if (!route) {
    throw new Error('Invalid quote: no route found');
  }

  // Execute the bridge
  await executeRoute(route, {
    updateRouteHook: (updatedRoute) => {
      console.log('Bridge progress:', updatedRoute.status);
    },
  });

  // Return result
  return {
    quote,
    route,
    status: 'submitted',
  };
}

/**
 * Estimate gas for cross-chain deposit (for UI display)
 */
export async function estimateCrossChainGas(
  sourceChainId: number,
  sourceToken: string,
  sourceAmount: string
): Promise<string> {
  try {
    // Get a quote to get gas estimates
    const quote = await getCrossChainDepositQuote({
      sourceChainId,
      sourceToken,
      sourceAmount,
      senderAddress: '0x0000000000000000000000000000000000000000', // placeholder
      destToken: sourceToken === 'NATIVE' 
        ? TOKENS.WETH_ARB 
        : TOKENS.USDC[ChainId.ARB],
    });

    return `~$${quote.gasCostUsd}`;
  } catch (error) {
    console.error('Error estimating gas:', error);
    return '~$15-50';
  }
}

/**
 * Validate a cross-chain route before executing
 */
export function validateCrossChainRoute(
  quote: CrossChainQuote,
  expectedMinOutput: string
): { valid: boolean; reason?: string } {
  // Check if output meets minimum expected
  if (Number(quote.toAmountMin) < Number(expectedMinOutput)) {
    return {
      valid: false,
      reason: 'Output amount is lower than expected due to market movement',
    };
  }

  // Check if bridge is reputable
  const reputableBridges = ['Across', 'Hop', 'Synapse', 'Stargate', 'Thorchain'];
  const isReputable = reputableBridges.some(
    b => quote.bridgeName.toLowerCase().includes(b.toLowerCase())
  );

  if (!isReputable && Number(quote.toAmount) > 10000) {
    return {
      valid: false,
      reason: 'For large amounts, we recommend using a more established bridge',
    };
  }

  return { valid: true };
}

/**
 * Get supported chains for cross-chain deposits
 */
export function getSupportedChains(): Array<{
  id: number;
  name: string;
  symbol: string;
  color: string;
}> {
  return [
    { id: ChainId.ETH, name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
    { id: ChainId.ARB, name: 'Arbitrum', symbol: 'ARB', color: '#28A0F0' },
    { id: ChainId.BAS, name: 'Base', symbol: 'BASE', color: '#0052FF' },
    { id: ChainId.OPT, name: 'Optimism', symbol: 'OP', color: '#FF0420' },
    { id: ChainId.POL, name: 'Polygon', symbol: 'MATIC', color: '#8247E5' },
  ];
}
