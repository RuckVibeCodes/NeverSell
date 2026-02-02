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

// Arbitrum One chain ID
export const ARBITRUM_CHAIN_ID = ChainId.ARB;

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
