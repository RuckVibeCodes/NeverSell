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

  // Handle escaped newlines - try multiple formats
  let normalizedKey = apiKeySecret;
  
  // Try replacing literal \n first
  if (normalizedKey.includes('\\n')) {
    normalizedKey = normalizedKey.replace(/\\n/g, '\n');
  }
  
  // Remove any carriage returns
  normalizedKey = normalizedKey.replace(/\r/g, '');
  
  console.log('[CDP] Key format check:', normalizedKey.substring(0, 50), '...');
  
  let privateKey: jose.JWK | jose.CryptoKey;
  
  if (normalizedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    // PKCS#8 format
    console.log('[CDP] Using PKCS#8 format');
    privateKey = await jose.importPKCS8(normalizedKey, 'ES256');
  } else if (normalizedKey.includes('-----BEGIN EC PRIVATE KEY-----')) {
    // PKCS#1 EC format
    console.log('[CDP] Using PKCS#1 EC format');
    
    const lines = normalizedKey.split('\n').filter(l => l.trim() !== '');
    const keyBody = lines.filter(l => !l.includes('-----')).join('');
    
    console.log('[CDP] Key body length:', keyBody.length);
    
    try {
      const keyDer = Buffer.from(keyBody, 'base64');
      console.log('[CDP] DER length:', keyDer.length);
      
      // For secp256k1, private key is 32 bytes
      // SEC1 EC private key structure may have header bytes
      const ec = new EC('secp256k1');
      
      // Try different offsets to find the private key
      let keyPair;
      
      // Try treating the whole DER as potentially having the key at different positions
      // Standard SEC1 for secp256k1: 32-byte private key
      if (keyDer.length === 32) {
        // Raw 32-byte key
        keyPair = ec.keyFromPrivate(keyDer);
      } else if (keyDer.length === 48 || keyDer.length === 49) {
        // Might have algorithm identifier prefix
        keyPair = ec.keyFromPrivate(keyDer.slice(-32));
      } else if (keyDer.length > 32) {
        // Try extracting 32-byte key from various positions
        // First try at position that makes sense for EC key
        for (let i = 0; i <= keyDer.length - 32; i++) {
          const potentialKey = keyDer.slice(i, i + 32);
          // Check if this could be a valid private key (must be < curve order)
          const key = potentialKey.readUInt32BE(0);
          if (key > 0 && key < 0xFFFFFFFF) { // Rough check
            try {
              const testPair = ec.keyFromPrivate(potentialKey);
              if (testPair.getPublic()) {
                keyPair = testPair;
                console.log('[CDP] Found valid key at offset:', i);
                break;
              }
            } catch {
              continue;
            }
          }
        }
        
        // Fallback: just use the last 32 bytes
        if (!keyPair) {
          keyPair = ec.keyFromPrivate(keyDer.slice(-32));
        }
      } else {
        throw new Error('Key data too short');
      }
      
      const pubKey = keyPair.getPublic();
      
      // Create JWK - convert hex to base64url
      const toBase64Url = (hex: string) => Buffer.from(hex, 'hex').toString('base64url');
      
      privateKey = {
        kty: 'EC',
        crv: 'secp256k1',
        x: toBase64Url(pubKey.getX().toString('hex')),
        y: toBase64Url(pubKey.getY().toString('hex')),
        d: toBase64Url(keyPair.getPrivate().toString('hex')),
      };
      
      console.log('[CDP] Successfully created JWK from EC key');
    } catch (parseError) {
      console.error('[CDP] EC key parse error:', parseError);
      throw new Error('Failed to parse EC private key');
    }
  } else {
    console.error('[CDP] Unknown key format');
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
