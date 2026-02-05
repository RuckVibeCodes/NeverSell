import { NextResponse } from 'next/server';
import type { ApiResponse, Address, BigIntString } from '@/types/api';

// Supported chains for withdrawal
const SUPPORTED_CHAINS = {
  1: { name: 'Ethereum', nativeSymbol: 'ETH', explorerUrl: 'https://etherscan.io' },
  137: { name: 'Polygon', nativeSymbol: 'MATIC', explorerUrl: 'https://polygonscan.com' },
  42161: { name: 'Arbitrum', nativeSymbol: 'ETH', explorerUrl: 'https://arbiscan.io' },
  8453: { name: 'Base', nativeSymbol: 'ETH', explorerUrl: 'https://basescan.org' },
} as const;

export type ChainId = keyof typeof SUPPORTED_CHAINS;

interface WithdrawRequest {
  amountUsd?: string;
  percentage?: string;
  destinationChain: ChainId;
  destinationAddress?: Address;
}

interface WithdrawalQuote {
  id: string;
  positionId: string;
  estimatedUsdc: BigIntString;
  bridgeFee: BigIntString;
  protocolFee: BigIntString;
  totalFees: BigIntString;
  netAmount: BigIntString;
  destinationChain: ChainId;
  estimatedTimeMinutes: number;
  expiresAt: number;
}

interface WithdrawResponse {
  quote: WithdrawalQuote;
  transaction?: {
    to: Address;
    data: string;
    value: BigIntString;
    chainId: ChainId;
    gasLimit: BigIntString;
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: positionId } = await params;
    const body: WithdrawRequest = await request.json();
    const { amountUsd, percentage, destinationChain, destinationAddress } = body;

    // Validate destination chain
    if (!SUPPORTED_CHAINS[destinationChain]) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CHAIN_NOT_SUPPORTED',
            message: `Chain ${destinationChain} is not supported for withdrawal. Supported chains: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`,
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate withdrawal amount
    if (!amountUsd && !percentage) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AMOUNT_REQUIRED',
            message: 'Must provide amountUsd or percentage for withdrawal',
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Mock position data - in production, fetch from database
    const mockPosition = {
      id: positionId,
      totalValueUsd: '125420.50',
      status: 'active' as const,
      assets: [
        { assetId: 'wbtc', currentValue: '50168200000' },
        { assetId: 'weth', currentValue: '43897180000' },
        { assetId: 'arb', currentValue: '18813080000' },
        { assetId: 'usdc', currentValue: '12542050000' },
      ],
    };

    // Check if position exists
    if (!mockPosition) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'POSITION_NOT_FOUND',
            message: `Position ${positionId} not found`,
          },
        } as ApiResponse,
        { status: 404 }
      );
    }

    // Check if position is active
    if (mockPosition.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'POSITION_NOT_ACTIVE',
            message: `Cannot withdraw from position with status: ${mockPosition.status}`,
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Calculate withdrawal amount
    const totalValue = parseFloat(mockPosition.totalValueUsd);
    let withdrawPercentage = 0;

    if (percentage) {
      withdrawPercentage = parseFloat(percentage);
      if (withdrawPercentage <= 0 || withdrawPercentage > 100) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_PERCENTAGE',
              message: 'Percentage must be between 0 and 100',
            },
          } as ApiResponse,
          { status: 400 }
        );
      }
    } else {
      withdrawPercentage = (parseFloat(amountUsd!) / totalValue) * 100;
    }

    // Calculate USDC amount to withdraw
    const withdrawAmountUsd = totalValue * (withdrawPercentage / 100);
    const withdrawAmountUsdc = Math.floor(withdrawAmountUsd * 1_000_000); // 6 decimals

    // Bridge fees (LiFi-style)
    const isCrossChain = destinationChain !== 42161; // If not Arbitrum
    const bridgeFee = isCrossChain ? Math.floor(withdrawAmountUsdc * 0.001) : BigInt(0); // 0.1% bridge fee
    const protocolFee = Math.floor(withdrawAmountUsdc * 0.001); // 0.1% protocol fee
    const totalFees = bridgeFee + protocolFee;
    const netAmount = BigInt(withdrawAmountUsdc) - totalFees;

    // Estimate bridge time
    const estimatedTimeMinutes = isCrossChain ? 15 : 2; // 15 min for cross-chain, 2 min for same-chain

    // Create quote
    const quote: WithdrawalQuote = {
      id: `withdraw_${crypto.randomUUID()}`,
      positionId,
      estimatedUsdc: String(withdrawAmountUsdc),
      bridgeFee: String(bridgeFee),
      protocolFee: String(protocolFee),
      totalFees: String(totalFees),
      netAmount: String(netAmount),
      destinationChain,
      estimatedTimeMinutes,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    // Generate transaction data
    // In production, this would call LiFi SDK or similar
    const transaction = {
      to: '0x1234567890123456789012345678901234567890' as Address, // Router address
      data: generateWithdrawCalldata(positionId, withdrawAmountUsdc, destinationChain, destinationAddress),
      value: '0' as BigIntString, // No native ETH value for withdraw
      chainId: 42161 as const, // Always from Arbitrum
      gasLimit: '300000' as BigIntString,
    };

    const response: ApiResponse<{ quote: WithdrawalQuote; transaction?: typeof transaction }> = {
      success: true,
      data: { quote, transaction },
      meta: {
        timestamp: Date.now(),
        requestId: crypto.randomUUID(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Withdraw error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate withdrawal quote',
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

/**
 * Generate calldata for withdrawal transaction
 * In production, this would integrate with LiFi or similar bridge protocol
 */
function generateWithdrawCalldata(
  positionId: string,
  amountUsdc: number,
  destinationChain: ChainId,
  destinationAddress?: Address
): string {
  // This is a mock implementation
  // In production, this would generate actual bridge transaction data via LiFi SDK

  const methodSelector = '0x12345678'; // Mock method selector
  const positionIdPadded = positionId.padStart(64, '0');
  const amountPadded = amountUsdc.toString(16).padStart(64, '0');
  const destChainPadded = destinationChain.toString(16).padStart(64, '0');
  const destAddress = (destinationAddress || '0x0000000000000000000000000000000000000000').slice(2).padStart(64, '0');

  return `${methodSelector}${positionIdPadded}${amountPadded}${destChainPadded}${destAddress}`;
}
