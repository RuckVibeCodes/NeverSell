import { NextRequest, NextResponse } from 'next/server';
import { generateJwt } from '@coinbase/cdp-sdk/auth';

interface SessionTokenRequest {
  address: string;
  blockchains?: string[];
  assets?: string[];
}

/**
 * Generates a JWT using Coinbase's CDP SDK
 * The SDK handles private key parsing internally
 */
async function generateCDPJwt(): Promise<string> {
  const apiKeyId = process.env.COINBASE_CDP_API_KEY;
  const apiKeySecret = process.env.COINBASE_CDP_API_SECRET;

  if (!apiKeyId || !apiKeySecret) {
    throw new Error('Missing CDP API credentials in environment variables');
  }

  const requestMethod = 'POST';
  const requestHost = 'api.developer.coinbase.com';
  const requestPath = '/onramp/v1/token';

  // Use the CDP SDK to generate the JWT - it handles all key parsing
  const jwt = await generateJwt({
    apiKeyId,
    apiKeySecret,
    requestMethod,
    requestHost,
    requestPath,
    expiresIn: 120, // 120 seconds
  });

  return jwt;
}

/**
 * Generates a session token from Coinbase CDP API
 */
async function generateSessionToken(
  address: string,
  blockchains: string[] = ['ethereum', 'arbitrum', 'base'],
  assets: string[] = ['ETH', 'USDC']
): Promise<string> {
  const jwt = await generateCDPJwt();

  const response = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      addresses: [
        {
          address,
          blockchains,
        },
      ],
      assets,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('CDP API Error:', response.status, errorData);
    throw new Error(`Failed to generate session token: ${response.status}`);
  }

  const data = await response.json();
  return data.token;
}

export async function POST(request: NextRequest) {
  try {
    const body: SessionTokenRequest = await request.json();
    
    if (!body.address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const token = await generateSessionToken(
      body.address,
      body.blockchains,
      body.assets
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Session token generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
