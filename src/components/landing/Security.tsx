import { Check } from 'lucide-react';

const protocols = [
  {
    name: 'Aave',
    tvl: '$12B+',
    description: 'Lending protocol',
    logo: (
      <svg viewBox="0 0 48 48" className="w-12 h-12">
        <circle cx="24" cy="24" r="22" fill="#B6509E" />
        <path d="M24 12l-8 20h4l2-5h8l2 5h4L24 12zm-2 12l2-5 2 5h-4z" fill="white" />
      </svg>
    ),
  },
  {
    name: 'GMX',
    tvl: '$500M+',
    description: 'Perpetual exchange',
    logo: (
      <svg viewBox="0 0 48 48" className="w-12 h-12">
        <circle cx="24" cy="24" r="22" fill="#2D42FC" />
        <path d="M16 16h6v6h-6zM26 16h6v6h-6zM16 26h6v6h-6zM26 26h6v6h-6z" fill="white" />
      </svg>
    ),
  },
];

const checks = [
  'Non-custodial — you control your keys',
  'Audited smart contracts',
  '100% on-chain',
  '$50K bug bounty',
  '48-hour timelock',
  'Built on Arbitrum',
];

const Security = () => {
  return (
    <section id="security" className="relative w-full py-24 lg:py-32">
      <div className="w-full px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          {/* Heading */}
          <div className="text-center mb-12">
            <h2 className="font-display text-display-2 text-text-primary mb-4">
              Built on <span className="text-gradient">battle-tested</span> protocols.
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Your funds sit in Aave and GMX — $12B+ of DeFi infrastructure. We never have custody.
            </p>
          </div>

          {/* Protocol Cards */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            {protocols.map((protocol) => (
              <div
                key={protocol.name}
                className="glass-card rounded-2xl p-6 text-center min-w-[160px] hover:border-mint/20 transition-all group"
              >
                <div className="mb-4 group-hover:scale-110 transition-transform">
                  {protocol.logo}
                </div>
                <div className="font-display text-xl text-text-primary mb-1">
                  {protocol.name}
                </div>
                <div className="font-mono text-2xl text-mint font-bold mb-1">
                  {protocol.tvl}
                </div>
                <div className="text-xs text-text-muted">
                  {protocol.description}
                </div>
              </div>
            ))}
          </div>

          {/* Checklist */}
          <div className="glass-card rounded-2xl p-8 lg:p-10">
            <div className="grid sm:grid-cols-2 gap-4">
              {checks.map((check, index) => (
                <div key={index} className="flex items-center gap-3 text-text-secondary">
                  <div className="w-6 h-6 rounded-full bg-mint/15 flex items-center justify-center flex-shrink-0 border border-mint/25">
                    <Check className="w-3.5 h-3.5 text-mint" />
                  </div>
                  {check}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;
