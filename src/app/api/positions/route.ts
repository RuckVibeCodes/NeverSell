import { NextResponse } from 'next/server';
import type { ApiResponse, Position, Address } from '@/types/api';

// Mock positions database - in production this would be a real DB
const MOCK_POSITIONS: Record<string, Position> = {
  // Demo wallet position
  '0xdemo': {
    id: 'pos_demo_001',
    userAddress: '0xDemoUser0000000000000000000000000000001' as Address,
    assets: [
      {
        assetId: 'wbtc',
        allocation: '40',
        amountDeposited: '514700000', // 0.5147 WBTC in satoshis
        currentValue: '50168200000', // $50,168.20 in micro units
        aaveAmount: '308820000', // 60%
        gmxAmount: '205880000', // 40%
        earnedYield: '1254000000',
      },
      {
        assetId: 'weth',
        allocation: '35',
        amountDeposited: '13506824000000000000', // 13.5 ETH in wei
        currentValue: '43897180000', // $43,897.18
        aaveAmount: '8104094400000000000',
        gmxAmount: '5402729600000000000',
        earnedYield: '892000000',
      },
      {
        assetId: 'arb',
        allocation: '15',
        amountDeposited: '22133035294117647058824', // ~22,133 ARB
        currentValue: '18813080000', // $18,813.08
        aaveAmount: '13279821176470588235294',
        gmxAmount: '8853214117647058823530',
        earnedYield: '412000000',
      },
      {
        assetId: 'usdc',
        allocation: '10',
        amountDeposited: '12542050000', // 12,542.05 USDC (6 decimals)
        currentValue: '12542050000',
        aaveAmount: '7525230000',
        gmxAmount: '5016820000',
        earnedYield: '189000000',
      },
    ],
    totalValueUsd: '125420.50',
    totalDepositedUsd: '118500.00',
    totalEarnedUsd: '6920.50',
    currentApy: '13.52',
    borrowCapacityUsd: '62710.25',
    borrowedUsd: '15000.00',
    healthFactor: '2.85',
    status: 'active',
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    updatedAt: Date.now(),
  },
};

export async function GET(request: Request) {
  // Get wallet address from query params (mock auth)
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet')?.toLowerCase();
  const status = searchParams.get('status') || 'active';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // If no wallet provided, return empty
  if (!walletAddress) {
    return NextResponse.json({
      success: true,
      data: { positions: [], total: 0 },
      meta: { timestamp: Date.now(), requestId: crypto.randomUUID() },
    } as ApiResponse<{ positions: Position[]; total: number }>);
  }

  // Check if this is a demo/connected wallet - return mock data
  // In production, this would query the database
  let positions: Position[] = [];

  if (walletAddress === '0xdemo' || walletAddress.startsWith('0x')) {
    // For any connected wallet, return the demo position
    // This makes the app feel alive during development
    const demoPosition = MOCK_POSITIONS['0xdemo'];
    if (demoPosition) {
      positions = [{
        ...demoPosition,
        userAddress: walletAddress as Address,
      }];
    }
  }

  // Filter by status
  if (status !== 'all') {
    positions = positions.filter((p) => p.status === status);
  }

  // Apply pagination
  const total = positions.length;
  const paginatedPositions = positions.slice(offset, offset + limit);

  const response: ApiResponse<{ positions: Position[]; total: number }> = {
    success: true,
    data: {
      positions: paginatedPositions,
      total,
    },
    meta: {
      timestamp: Date.now(),
      requestId: crypto.randomUUID(),
    },
  };

  return NextResponse.json(response);
}
