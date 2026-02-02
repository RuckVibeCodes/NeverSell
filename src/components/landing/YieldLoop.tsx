import Link from 'next/link';
import { Wallet, TrendingUp, Landmark, Rocket, Layers, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const loopSteps = [
  {
    id: 'deposit',
    label: 'Deposit',
    icon: Wallet,
    color: '#94A3B8',
    description: 'BTC, ETH, ARB, or USDC',
  },
  {
    id: 'earn1',
    label: 'Earn Yield',
    icon: TrendingUp,
    color: '#2ED573',
    description: '7-15% APY on deposit',
  },
  {
    id: 'borrow',
    label: 'Borrow',
    icon: Landmark,
    color: '#6366F1',
    description: 'Up to 70% of value',
  },
  {
    id: 'deploy',
    label: 'Deploy',
    icon: Rocket,
    color: '#A855F7',
    description: 'To pools & vaults',
  },
  {
    id: 'earn2',
    label: 'Earn Again',
    icon: Layers,
    color: '#2ED573',
    description: 'Stack more yield',
  },
];

const YieldLoop = () => {
  return (
    <section id="yield-loop" className="relative w-full py-24 lg:py-32 overflow-hidden">
      {/* Background glow - hidden on mobile for performance */}
      <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[700px] bg-gradient-radial from-mint/10 via-transparent to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full px-6 lg:px-10">
        {/* Headline */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="font-display text-display-2 text-text-primary mb-4">
            Stack yield <span className="text-gradient-mint">on yield.</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Your money works twice. First from your deposit. Again from your deployment.
          </p>
        </div>

        {/* Loop Steps - Mobile: Vertical List, Desktop: Horizontal Flow */}
        <div className="max-w-4xl mx-auto">
          {/* Mobile: Vertical List */}
          <div className="flex flex-col gap-4 lg:hidden">
            {loopSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ 
                      backgroundColor: `${step.color}15`,
                      border: `1px solid ${step.color}30`
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-text-primary">{step.label}</h3>
                    <p className="text-sm text-text-muted">{step.description}</p>
                  </div>
                  {index < loopSteps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-text-muted ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: Horizontal Flow */}
          <div className="hidden lg:flex items-center justify-center gap-4">
            {loopSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center text-center group">
                    <div 
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                      style={{ 
                        backgroundColor: `${step.color}15`,
                        border: `1px solid ${step.color}30`
                      }}
                    >
                      <Icon className="w-8 h-8" style={{ color: step.color }} />
                    </div>
                    <h3 className="font-display font-semibold text-text-primary text-sm mb-1">{step.label}</h3>
                    <p className="text-xs text-text-muted max-w-[100px]">{step.description}</p>
                  </div>
                  {index < loopSteps.length - 1 && (
                    <ArrowRight className="w-6 h-6 text-text-muted mx-2 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 lg:mt-16">
          <Link href="/app/lend">
            <Button className="btn-primary text-navy hover:opacity-90 px-8 py-4 rounded-full text-base font-semibold transition-all flex items-center gap-2 group mx-auto">
              Start Your Loop
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default YieldLoop;
