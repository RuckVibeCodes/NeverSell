import { NextRequest, NextResponse } from 'next/server';
import { getVaultById, BEEFY_CHAINS, type BeefyChain } from '@/lib/beefy';

/**
 * GET /api/earn/vaults/[id]
 * 
 * Get detailed info for a single vault
 * Query params:
 * - chain: optional chain hint for faster lookup
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const chainParam = searchParams.get('chain') as BeefyChain | null;
    
    const chain = chainParam && BEEFY_CHAINS.includes(chainParam) 
      ? chainParam 
      : undefined;
    
    const vault = await getVaultById(params.id, chain);
    
    if (!vault) {
      return NextResponse.json(
        { error: 'Vault not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ vault });
  } catch (error) {
    console.error('Error fetching vault:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vault' },
      { status: 500 }
    );
  }
}
