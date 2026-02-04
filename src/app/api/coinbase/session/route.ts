import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import crypto from 'crypto';

interface SessionTokenRequest {
  address: string;
  blockchains?: string[];
  assets?: string[];
}

/**
 * Parse raw SEC1 EC private key to JWK
 */
function sec1ToJwk(keyDer: Buffer): jose.JWK {
  // SEC1 EC private key structure:
  // ECPrivateKey ::= SEQUENCE {
  //   version        INTEGER { ecPrivkeyVer1(1) },
  //   privateKey     OCTET STRING,
  //   parameters [0] ECParameters OPTIONAL
  // }
  
  // Skip ASN.1 header - find the private key octet string
  // For secp256k1, the key is 32 bytes
  let privKeyOffset = -1;
  
  // Parse minimally to find the private key bytes
  // EC private key OCTET STRING typically starts at offset 7-10
  // The structure is: 02 01 01 (version=1) | 04 20 (octet string, 32 bytes) | ...
  if (keyDer.length >= 38) {
    // Common structure: 30 (SEQUENCE) | length | 02 01 01 (version=1) | 04 20 (octet string) | [32 bytes key]
    privKeyOffset = 7; // 30 + length byte + 02 01 01 + 04 20
  } else if (keyDer.length === 32) {
    // Raw key
    privKeyOffset = 0;
  }
  
  if (privKeyOffset >= 0 && keyDer.length >= privKeyOffset + 32) {
    const privateKeyBytes = keyDer.slice(privKeyOffset, privKeyOffset + 32);
    
    // Derive public key using Node.js crypto
    const ecdsa = crypto.createECDH('secp256k1');
    ecdsa.setPrivateKey(privateKeyBytes);
    
    const publicKeyBytes = ecdsa.getPublicKey();
    
    // Extract x and y from public key (first byte 04 is uncompressed point, then x (32 bytes), y (32 bytes))
    if (publicKeyBytes.length === 65 && publicKeyBytes[0] === 0x04) {
      const x = publicKeyBytes.slice(1, 33);
      const y = publicKeyBytes.slice(33, 65);
      
      return {
        kty: 'EC',
        crv: 'secp256k1',
        x: x.toString('base64url'),
        y: y.toString('base64url'),
        d: privateKeyBytes.toString('base64url'),
      };
    }
  }
  
  throw new Error('Could not parse EC private key');
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

  // Normalize key format
  let normalizedKey = apiKeySecret;
  if (normalizedKey.includes('\\n')) {
    normalizedKey = normalizedKey.replace(/\\n/g, '\n');
  }
  normalizedKey = normalizedKey.replace(/\r/g, '');
  
  console.log('[CDP] Key format:', normalizedKey.substring(0, 40));
  
  let privateKey: jose.JWK;
  
  if (normalizedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    // PKCS#8 format
    console.log('[CDP] Parsing PKCS#8');
    const pkcs8Key = await jose.importPKCS8(normalizedKey, 'ES256');
    privateKey = pkcs8Key as jose.JWK;
  } else if (normalizedKey.includes('-----BEGIN EC PRIVATE KEY-----')) {
    // PKCS#1 EC format
    console.log('[CDP] Parsing PKCS#1 EC');
    
    const lines = normalizedKey.split('\n').filter(l => l.trim() !== '');
    const base64Body = lines.filter(l => !l.includes('-----')).join('');
    const keyDer = Buffer.from(base64Body, 'base64');
    
    console.log('[CDP] Key DER length:', keyDer.length);
    privateKey = sec1ToJwk(keyDer);
    console.log('[CDP] Successfully parsed EC key to JWK');
  } else {
    throw new Error('Invalid private key format - no PEM header found');
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
    .sign(privateKey as jose.JWK);

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
