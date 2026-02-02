'use client';

import { useState } from 'react';
import Image from 'next/image';

// Token logo URLs - using exact CoinGecko URLs from GMX SDK
// Source: https://github.com/gmx-io/gmx-interface/blob/master/sdk/src/configs/tokens.ts

const COINGECKO_CDN = 'https://assets.coingecko.com/coins/images';

// Complete mapping from GMX's token config + additional tokens
// Format: symbol -> full CoinGecko URL path after /coins/images/
const SYMBOL_TO_IMAGE: Record<string, string> = {
  // Major Cryptocurrencies (from GMX config)
  'ETH': '279/small/ethereum.png?1595348880',
  'WETH': '2518/thumb/weth.png?1628852295',
  'BTC': '1/small/bitcoin.png?1547033579',
  'WBTC': '26115/thumb/btcb.png?1655921693',
  'SOL': '4128/small/solana.png?1640133422',
  'BNB': '825/standard/bnb-icon2_2x.png?1696501970',
  'XRP': '44/small/xrp-symbol-white-128.png?1605778731',
  'ADA': '975/standard/cardano.png?1696502090',
  'AVAX': '12559/small/coin-round-red.png?1604021818',
  'DOT': '12171/standard/polkadot.png',
  'LTC': '2/small/litecoin.png?1547033580',
  'TRX': '1094/standard/tron-logo.png?1696502193',
  'ATOM': '1481/standard/cosmos_hub.png?1696502525',
  'NEAR': '10365/standard/near.jpg?1696510367',
  'TON': '17980/standard/photo_2024-09-10_17.09.00.jpeg?1725963446',
  'BCH': '780/standard/bitcoin-cash-circle.png?1696501932',
  'ICP': '14495/standard/icp.png',
  'APT': '26455/standard/aptos_round.png?1696525528',
  'FIL': '12817/standard/filecoin.png',
  'ALGO': '4030/standard/Algorand_400x400.png',
  
  // Layer 2 & Ecosystem tokens
  'ARB': '16547/small/photo_2023-03-29_21.47.00.jpeg?1680097630',
  'OP': '25244/standard/Optimism.png?1696524385',
  'MATIC': '4713/standard/polygon.png',
  'POL': '32440/standard/polygon.png?1698233684',
  'STRK': '26997/standard/starknet.png',
  'IMX': '17233/standard/immutableX-symbol-BLK-RGB.png',
  'SKY': '33854/standard/sky.png',
  
  // DeFi tokens (from GMX config)
  'LINK': '877/thumb/chainlink-new-logo.png?1547034700',
  'UNI': '12504/thumb/uniswap-uni.png?1600306604',
  'AAVE': '12645/standard/AAVE.png?1696512452',
  'CRV': '12124/standard/Curve.png',
  'MKR': '1348/standard/mkr.png',
  'SNX': '3406/standard/SNX.png',
  'COMP': '10775/standard/COMP.png',
  'SUSHI': '12271/standard/sushi.png',
  'CVX': '15585/standard/convex.png',
  'PENDLE': '15069/standard/Pendle_Logo_Normal-03.png?1696514728',
  '1INCH': '13469/standard/1inch-token.png',
  'LDO': '13573/standard/Lido_DAO.png',
  'FXS': '6953/standard/frax_share.png',
  'GMX': '18323/small/arbit.png?1631532468',
  'DYDX': '17500/standard/dydx.png',
  'GRT': '13397/standard/Graph_Token.png',
  'ENS': '19785/standard/ens.png',
  'RPL': '2848/standard/rpl.png',
  'BAL': '11683/standard/Balancer.png',
  'YFI': '11849/standard/yearn.jpg',
  
  // Stablecoins
  'USDC': '6319/thumb/USD_Coin_icon.png?1547042389',
  'USDT': '325/thumb/Tether-logo.png?1598003707',
  'DAI': '9956/thumb/4943.png?1636636734',
  'FRAX': '13422/small/frax_logo.png?1608476506',
  'USDE': '33613/standard/USDE.png?1716355685',
  'LUSD': '14666/standard/lusd.png',
  
  // Meme coins (from GMX config)
  'DOGE': '5/small/dogecoin.png?1547792256',
  'SHIB': '11939/standard/shiba.png?1696511800',
  'PEPE': '29850/standard/pepe-token.jpeg?1696528776',
  'WIF': '33566/standard/dogwifhat.jpg?1702499428',
  'BONK': '28600/standard/bonk.jpg?1696527587',
  'FLOKI': '16746/standard/PNG_image.png?1696516318',
  'MEME': '32528/standard/memecoin_%282%29.png?1698912168',
  'MEW': '36440/standard/MEW.png?1711442286',
  'BOME': '36071/standard/bome.png?1710407255',
  'BRETT': '35529/standard/brett.png',
  'POPCAT': '35899/standard/popcat.png',
  'TRUMP': '35336/standard/trump.png',
  'MELANIA': '53711/standard/melania.png',
  
  // Newer/Trending GMX tokens
  'SEI': '28205/standard/Sei_Logo_-_Transparent.png?1696527207',
  'SUI': '26375/standard/sui-ocean-square.png?1727791290',
  'TIA': '31967/standard/tia.jpg?1696530772',
  'STX': '2069/standard/Stacks_Logo_png.png?1709979332',
  'INJ': '12882/standard/Secondary_Symbol.png',
  'JUP': '35114/standard/jup.png',
  'PYTH': '31924/standard/pyth.png',
  'ENA': '36124/standard/ena.png',
  'ONDO': '26580/standard/ONDO.png',
  'ZRO': '28850/standard/photo_2024-04-26_14-33-03.jpg',
  'ORDI': '30162/standard/ordi.png?1696529082',
  'SATS': '30666/standard/_dD8qr3M_400x400.png?1702913020',
  'EIGEN': '37441/standard/eigen.jpg?1728023974',
  'TAO': '28452/standard/ARUsPeNQ_400x400.jpeg?1696527447',
  'WLD': '31069/standard/worldcoin.jpeg?1696529903',
  'APE': '24383/standard/apecoin.jpg?1696523566',
  'RENDER': '11636/standard/rndr.png',
  'FET': '5681/standard/Fetch.jpg',
  'WSTETH': '18834/standard/wstETH.png?1696518295',
  'TBTC': '11224/standard/0x18084fba666a33d37592fa2633fd49a74dd93a88.png?1696511155',
  
  // Additional GMX pools
  'KAS': '25034/standard/kas.png',
  'OKB': '4463/standard/okb.png',
  'CHZ': '8834/standard/chz.png',
  'ASTR': '12885/standard/astar.png',
  'ASTER': '12885/standard/astar.png',
  'KTA': '28205/standard/Sei_Logo_-_Transparent.png', // Placeholder
  'DOLO': '35645/standard/dolo.png',
  'OG': '7676/standard/origin_protocol.png',
  'SPX6900': '35750/standard/spx.png',
  'SPX': '35750/standard/spx.png',
  
  // Gold/Silver RWA
  'XAU': '5246/standard/Gold.png',
  'XAG': '5247/standard/Silver.png',
  
  // AI tokens
  'AI16Z': '53063/standard/ai16z.png',
  'VIRTUAL': '29420/standard/virtual-protocol.png',
  'HYPE': '35381/standard/hyperliquid.png',
  
  // Gaming/Metaverse
  'SAND': '12129/standard/sandbox_logo.jpg',
  'MANA': '1966/standard/decentraland.png',
  'AXS': '13029/standard/axie_infinity_logo.png',
  'GALA': '12493/standard/gala.png',
  
  // More recent additions
  'PENGU': '53708/standard/pudgy-penguins.jpg',
  'FARTCOIN': '52901/standard/fartcoin.png',
};

interface TokenLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function TokenLogo({ symbol, size = 32, className = '' }: TokenLogoProps) {
  const [error, setError] = useState(false);
  
  // Normalize symbol
  const normalizedSymbol = symbol.toUpperCase().replace('.E', '').replace('WSOL', 'SOL');
  
  // Get image URL
  const imagePath = SYMBOL_TO_IMAGE[normalizedSymbol];
  const imageUrl = imagePath ? `${COINGECKO_CDN}/${imagePath}` : null;
  
  // Handle image load error
  const handleError = () => {
    setError(true);
  };
  
  // Fallback to symbol letter with gradient
  if (error || !imageUrl) {
    const gradientColors = getGradientColors(normalizedSymbol);
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
      src={imageUrl}
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
    'BNB': ['#F3BA2F', '#E6A700'],
    'LINK': ['#375BD2', '#2563EB'],
    'UNI': ['#FF007A', '#EC4899'],
    'AAVE': ['#B6509E', '#A855F7'],
    'GMX': ['#2D42FC', '#4F46E5'],
    'DOGE': ['#C2A633', '#EAB308'],
    'PEPE': ['#3D9C3C', '#22C55E'],
    'PENGU': ['#4A90D9', '#3B82F6'],
    'SEI': ['#9B1C1C', '#DC2626'],
    'SUI': ['#4DA2FF', '#3B82F6'],
    'TRX': ['#EF0027', '#DC2626'],
    'AVAX': ['#E84142', '#DC2626'],
  };
  
  return gradients[symbol.toUpperCase()] || ['#6B7280', '#4B5563'];
}

// Stacked token logos (e.g., for LP pairs)
interface StackedTokenLogosProps {
  tokens: { symbol: string }[];
  size?: number;
  className?: string;
}

export function StackedTokenLogos({ tokens, size = 32, className = '' }: StackedTokenLogosProps) {
  if (tokens.length === 0) return null;
  if (tokens.length === 1) {
    return <TokenLogo symbol={tokens[0].symbol} size={size} className={className} />;
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
            size={size}
            className="ring-2 ring-navy"
          />
        </div>
      ))}
    </div>
  );
}
