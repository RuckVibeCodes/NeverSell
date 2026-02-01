'use client';

import { useState } from 'react';
import Image from 'next/image';

// Token logo URLs from multiple sources for maximum coverage
// Priority: 1. TrustWallet assets, 2. CoinGecko, 3. Custom mappings

// TrustWallet asset repo on jsDelivr CDN (most reliable)
const TRUSTWALLET_CDN = 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/arbitrum/assets';

// CoinGecko API images (fallback)
const COINGECKO_CDN = 'https://assets.coingecko.com/coins/images';

// Known token address to logo mappings (Arbitrum addresses, lowercase)
const TOKEN_LOGOS: Record<string, string> = {
  // Native & Major
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': `${TRUSTWALLET_CDN}/0x82aF49447D8a07e3bd95BD0d56f35241523fBab1/logo.png`, // WETH
  '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': `${TRUSTWALLET_CDN}/0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f/logo.png`, // WBTC
  '0xaf88d065e77c8cc2239327c5edb3a432268e5831': `${TRUSTWALLET_CDN}/0xaf88d065e77c8cC2239327C5EDb3A432268e5831/logo.png`, // USDC
  '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': `${TRUSTWALLET_CDN}/0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8/logo.png`, // USDC.e
  '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': `${TRUSTWALLET_CDN}/0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9/logo.png`, // USDT
  '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': `${TRUSTWALLET_CDN}/0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1/logo.png`, // DAI
  
  // GMX ecosystem
  '0xfc5a1a6eb076a2c7ad06ed22c90d7e710e35ad0a': `${TRUSTWALLET_CDN}/0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a/logo.png`, // GMX
  '0x912ce59144191c1204e64559fe8253a0e49e6548': `${TRUSTWALLET_CDN}/0x912CE59144191C1204E64559FE8253a0e49E6548/logo.png`, // ARB
  
  // DeFi tokens
  '0xf97f4df75117a78c1a5a0dbb814af92458539fb4': `${TRUSTWALLET_CDN}/0xf97f4df75117a78c1A5a0DBb814Af92458539FB4/logo.png`, // LINK
  '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0': `${TRUSTWALLET_CDN}/0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0/logo.png`, // UNI
  '0xba5ddd1f9d7f570dc94a51479a000e3bce967196': `${TRUSTWALLET_CDN}/0xba5DdD1f9d7F570dc94a51479a000E3BCE967196/logo.png`, // AAVE
  
  // Memecoins & newer tokens (CoinGecko fallbacks)
  '0x6985884c4392d348587b19cb9eaaf157f13271cd': `${COINGECKO_CDN}/28850/small/photo_2024-04-26_14-33-03.jpg`, // ZRO
};

// Symbol to CoinGecko ID mapping for fallback
const SYMBOL_TO_COINGECKO: Record<string, string> = {
  'ETH': '/279/small/ethereum.png',
  'WETH': '/279/small/ethereum.png',
  'BTC': '/1/small/bitcoin.png',
  'WBTC': '/7598/small/wrapped_bitcoin_wbtc.png',
  'USDC': '/6319/small/usdc.png',
  'USDT': '/325/small/Tether.png',
  'DAI': '/9956/small/Badge_Dai.png',
  'ARB': '/16547/small/photo_2023-03-29_21.11.00.jpeg',
  'GMX': '/18323/small/arbit.png',
  'LINK': '/877/small/chainlink-new-logo.png',
  'UNI': '/12504/small/uni.png',
  'AAVE': '/12645/small/AAVE.png',
  'SOL': '/4128/small/solana.png',
  'DOGE': '/5/small/dogecoin.png',
  'PEPE': '/24994/small/pepe.png',
  'WIF': '/33566/small/wif.png',
  'ATOM': '/1481/small/cosmos_hub.png',
  'NEAR': '/10365/small/near.jpg',
  'XRP': '/44/small/xrp-symbol-white-128.png',
  'AVAX': '/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  'MATIC': '/4713/small/polygon.png',
  'OP': '/25244/small/Optimism.png',
  'LTC': '/2/small/litecoin.png',
  'SHIB': '/11939/small/shiba.png',
  'PENGU': '/37505/small/pengu.png',
  'TRUMP': '/35336/small/trump.png',
  'HYPE': '/35381/small/hyperliquid.png',
  'AI16Z': '/53063/small/ai16z.png',
  'FARTCOIN': '/52901/small/fartcoin.png',
  'VIRTUAL': '/29420/small/virtual-protocol.png',
};

interface TokenLogoProps {
  symbol: string;
  address?: string;
  size?: number;
  className?: string;
}

export function TokenLogo({ symbol, address, size = 32, className = '' }: TokenLogoProps) {
  const [error, setError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  
  // Build list of image URLs to try
  const getImageUrls = (): string[] => {
    const urls: string[] = [];
    
    // 1. Try direct address mapping (TrustWallet)
    if (address) {
      const lowerAddress = address.toLowerCase();
      if (TOKEN_LOGOS[lowerAddress]) {
        urls.push(TOKEN_LOGOS[lowerAddress]);
      }
      // Try TrustWallet with checksummed address
      urls.push(`${TRUSTWALLET_CDN}/${address}/logo.png`);
    }
    
    // 2. Try CoinGecko by symbol
    const upperSymbol = symbol.toUpperCase();
    if (SYMBOL_TO_COINGECKO[upperSymbol]) {
      urls.push(`${COINGECKO_CDN}${SYMBOL_TO_COINGECKO[upperSymbol]}`);
    }
    
    return urls;
  };
  
  const urls = getImageUrls();
  const currentUrl = urls[fallbackIndex];
  
  // Handle image load error - try next URL
  const handleError = () => {
    if (fallbackIndex < urls.length - 1) {
      setFallbackIndex(fallbackIndex + 1);
    } else {
      setError(true);
    }
  };
  
  // Fallback to symbol letter with gradient
  if (error || !currentUrl) {
    const gradientColors = getGradientColors(symbol);
    return (
      <div 
        className={`rounded-full flex items-center justify-center text-white font-bold ${className}`}
        style={{ 
          width: size, 
          height: size, 
          background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})`,
          fontSize: size * 0.45,
        }}
      >
        {symbol.charAt(0).toUpperCase()}
      </div>
    );
  }
  
  return (
    <Image
      src={currentUrl}
      alt={symbol}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      onError={handleError}
      unoptimized // External URLs
    />
  );
}

// Get gradient colors based on symbol
function getGradientColors(symbol: string): [string, string] {
  const gradients: Record<string, [string, string]> = {
    'BTC': ['#F7931A', '#E67E22'],
    'WBTC': ['#F7931A', '#E67E22'],
    'ETH': ['#627EEA', '#8B5CF6'],
    'WETH': ['#627EEA', '#8B5CF6'],
    'USDC': ['#2775CA', '#1E40AF'],
    'USDT': ['#26A17B', '#16A34A'],
    'DAI': ['#F5AC37', '#F59E0B'],
    'ARB': ['#28A0F0', '#2563EB'],
    'SOL': ['#9945FF', '#14F195'],
    'LINK': ['#375BD2', '#2563EB'],
    'UNI': ['#FF007A', '#EC4899'],
    'AAVE': ['#B6509E', '#A855F7'],
    'GMX': ['#2D42FC', '#4F46E5'],
    'DOGE': ['#C2A633', '#EAB308'],
    'PEPE': ['#3D9C3C', '#22C55E'],
    'PENGU': ['#4A90D9', '#3B82F6'],
  };
  
  return gradients[symbol.toUpperCase()] || ['#6B7280', '#4B5563'];
}

// Stacked token logos (e.g., for LP pairs)
interface StackedTokenLogosProps {
  tokens: { symbol: string; address?: string }[];
  size?: number;
  className?: string;
}

export function StackedTokenLogos({ tokens, size = 32, className = '' }: StackedTokenLogosProps) {
  if (tokens.length === 0) return null;
  if (tokens.length === 1) {
    return <TokenLogo symbol={tokens[0].symbol} address={tokens[0].address} size={size} className={className} />;
  }
  
  return (
    <div className={`flex items-center ${className}`} style={{ width: size + (tokens.length - 1) * size * 0.6 }}>
      {tokens.map((token, index) => (
        <div 
          key={token.symbol + index}
          style={{ 
            marginLeft: index > 0 ? -size * 0.4 : 0,
            zIndex: tokens.length - index,
          }}
        >
          <TokenLogo 
            symbol={token.symbol} 
            address={token.address} 
            size={size}
            className="ring-2 ring-navy"
          />
        </div>
      ))}
    </div>
  );
}
