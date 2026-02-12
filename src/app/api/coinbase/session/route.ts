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
 * Extracts client IP from request headers
 * Checks common headers used by proxies/load balancers
 */
function getClientIp(request: NextRequest): string {
  // Vercel provides the real IP in x-forwarded-for
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ip = forwardedFor.split(',')[0].trim();
    // Only use if it's a public IP
    if (!ip.startsWith('127.') && !ip.startsWith('192.168.') && !ip.startsWith('10.') && ip !== '::1') {
      return ip;
    }
  }
  
  // Vercel also provides x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp && !realIp.startsWith('127.') && !realIp.startsWith('192.168.') && !realIp.startsWith('10.') && realIp !== '::1') {
    return realIp;
  }
  
  // For local development, use Google's DNS as a placeholder
  // This is only for trial testing - production will have real IPs from Vercel
  // Note: In trial mode, Coinbase allows 25 test transactions up to $5 each
  return '8.8.8.8';
}

/**
 * Generates a session token from Coinbase CDP API
 */
async function generateSessionToken(
  address: string,
  clientIp: string,
  blockchains: string[] = ['ethereum', 'arbitrum', 'base'],
  assets: string[] = ['ETH', 'USDC']
): Promise<string> {
  const jwt = await generateCDPJwt();

  const requestBody = {
    addresses: [
      {
        address,
        blockchains,
      },
    ],
    assets,
    clientIp,
  };

  console.log('Requesting session token with:', JSON.stringify(requestBody, null, 2));

  const response = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('CDP API Error:', response.status, errorData);
    throw new Error(`Failed to generate session token: ${response.status} - ${errorData}`);
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

    // Get client IP for Coinbase
    const clientIp = getClientIp(request);
    console.log('Client IP:', clientIp);

    const token = await generateSessionToken(
      body.address,
      clientIp,
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
