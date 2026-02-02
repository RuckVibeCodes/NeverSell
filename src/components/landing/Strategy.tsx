import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  apy: string;
  description: string;
  subtext: string;
  color: string;
  popular?: boolean;
}

const assets: Asset[] = [
  {
    id: 'BTC',
    name: 'Bitcoin',
    symbol: 'BTC',
    apy: '~6%',
    description: 'Earn while you HODL.',
    subtext: '+ BTC price upside',
    color: '#F7931A',
  },
  {
    id: 'ETH',
    name: 'Ethereum',
    symbol: 'ETH',
    apy: '~9%',
    description: 'Your ETH works harder.',
    subtext: '+ ETH price upside',
    color: '#627EEA',
  },
  {
    id: 'ARB',
    name: 'Arbitrum',
    symbol: 'ARB',
    apy: '~4%',
    description: 'Higher risk, higher reward.',
    subtext: '+ ARB price upside',
    color: '#28A0F0',
  },
  {
    id: 'USDC',
    name: 'USDC',
    symbol: 'USDC',
    apy: '~11%',
    description: 'Stable yield, no volatility.',
    subtext: 'No price risk',
    color: '#2775CA',
    popular: true,
  },
];

const tokenIcons: Record<string, string> = {
  BTC: '/tokens/btc.png',
  ETH: '/tokens/eth.png',
  ARB: '/tokens/arb.png',
  USDC: '/tokens/usdc.png',
};

const Strategy = () => {
  return (
    <section id="assets" className="relative w-full py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-navy-light" />

      <div className="relative z-10 w-full px-6 lg:px-10">
        {/* Heading */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="font-display text-display-2 text-text-primary mb-4">
            Pick your <span className="text-gradient">asset.</span>
          </h2>
        </div>

        {/* Asset Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 max-w-5xl mx-auto">
          {assets.map((asset) => (
            <Link 
              key={asset.id} 
              href="/app/pools"
              className="block"
            >
              <div 
                className="glass-card rounded-2xl p-6 transition-all hover:scale-[1.02] hover:border-mint/30 cursor-pointer relative overflow-hidden group"
              >
                {asset.popular && (
                  <div 
                    className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: `${asset.color}20`, color: asset.color }}
                  >
                    Popular
                  </div>
                )}

                {/* Token Icon */}
                <div className="mb-4">
                  <div 
                    className="w-14 h-14 rounded-full overflow-hidden"
                    style={{ 
                      boxShadow: `0 0 20px ${asset.color}40`
                    }}
                  >
                    <Image 
                      src={tokenIcons[asset.symbol]} 
                      alt={asset.symbol}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Name & Symbol */}
                <div className="mb-3">
                  <h3 className="font-display font-semibold text-lg text-text-primary">
                    {asset.name}
                  </h3>
                  <p className="text-sm text-text-muted">{asset.symbol}</p>
                </div>

                {/* APY */}
                <div className="mb-3">
                  <span 
                    className="font-mono text-2xl font-bold"
                    style={{ color: asset.color }}
                  >
                    {asset.apy}
                  </span>
                  <span className="text-text-muted text-sm ml-1">APY</span>
                </div>

                {/* Description */}
                <p className="text-sm text-text-secondary mb-1">{asset.description}</p>
                <p className="text-xs text-text-muted">{asset.subtext}</p>

                {/* Hover CTA */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    className="w-full py-2.5 rounded-xl text-sm font-semibold"
                    style={{ 
                      backgroundColor: `${asset.color}20`,
                      color: asset.color,
                      border: `1px solid ${asset.color}40`
                    }}
                  >
                    Deposit {asset.symbol}
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Strategy;
