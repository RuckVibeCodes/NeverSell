import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import crypto from 'crypto';
import { ec as EC } from 'elliptic';

interface SessionTokenRequest {
  address: string;
  blockchains?: string[];
  assets?: string[];
}

/**
 * Generates a JWT for Coinbase CDP API authentication
 */
async function generateCDPJwt(): Promise<string> {
  const apiKeyId = process.env.COINBASE_CDP_API_KEY;
  const apiKeySecret = process.env.COINBASE_CDP_API_SECRET;

  if (!apiKeyId || !apiKeySecret) {
    throw new Error('Missing CDP API credentials');
  }

  const requestMethod = 'POST';
  const requestHost = 'api.developer.coinbase.com';
  const requestPath = '/onramp/v1/token';

  const normalizedKey = apiKeySecret.replace(/\\n/g, '\n');
  
  let privateKey: jose.JWK | jose.CryptoKey;
  
  if (normalizedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    // PKCS#8 format
    privateKey = await jose.importPKCS8(normalizedKey, 'ES256');
  } else if (normalizedKey.includes('-----BEGIN EC PRIVATE KEY-----')) {
    // PKCS#1 EC format - parse manually and convert to JWK
    const lines = normalizedKey.split('\n');
    const keyBody = Buffer.from(lines.filter(l => !l.includes('-----')).join(''), 'base64');
    
    // Parse the SEC1 EC private key format to extract components
    // EC Private Key (SEC1) structure:
    // 0x02 (integer, 1 byte) + length + private key scalar
    const privKeyBytes = keyBody.slice(7); // Skip the EC key header
    
    // Get public key from private key using elliptic
    const ec = new EC('secp256k1');
    const keyPair = ec.keyFromPrivate(privKeyBytes);
    
    const pubKey = keyPair.getPublic();
    
    // Create JWK - convert hex to base64url manually
    const xHex = pubKey.getX().toString('hex');
    const yHex = pubKey.getY().toString('hex');
    const dHex = keyPair.getPrivate().toString('hex');
    
    const toBase64Url = (hex: string) => Buffer.from(hex, 'hex').toString('base64url');
    
    privateKey = {
      kty: 'EC',
      crv: 'secp256k1',
      x: toBase64Url(xHex),
      y: toBase64Url(yHex),
      d: toBase64Url(dHex),
    };
  } else {
    throw new Error('Invalid private key format');
  }

  const now = Math.floor(Date.now() / 1000);
  
  const jwt = await new jose.SignJWT({
    sub: apiKeyId,
    iss: 'cdp',
    aud: ['cdp_service'],
    uris: [`${requestMethod} ${requestHost}${requestPath}`],
  })
    .setProtectedHeader({ 
      alg: 'ES256',
      kid: apiKeyId,
      typ: 'JWT',
      nonce: crypto.randomUUID(),
    })
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + 120)
    .sign(privateKey);

  return jwt;
}

/**
 * Generates a session token from Coinbase CDP API
 */
async function generateSessionToken(
  address: string,
  blockchains: string[] = ['ethereum', 'arbitrum', 'base'],
  assets: string[] = ['ETH', 'USDC', 'USDT']
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
