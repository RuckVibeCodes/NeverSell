import Link from 'next/link';
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pillars = [
  {
    icon: TrendingUp,
    title: 'Earn',
    desc: 'Your crypto works 24/7',
  },
  {
    icon: Zap,
    title: 'Borrow',
    desc: 'Access liquidity instantly',
  },
  {
    icon: Shield,
    title: 'Keep',
    desc: 'Never sell your bags',
  },
];

const FinalCTA = () => {
  return (
    <section className="relative w-full py-24 lg:py-32 flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-gradient-to-br from-mint/15 via-electric-blue/10 to-electric-purple/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full px-6 lg:px-10 text-center">
        <h2 className="font-display text-display-2 lg:text-display-1 text-text-primary mb-10 max-w-4xl mx-auto">
          The <span className="text-gradient-mint">NeverSell</span> Method
        </h2>

        {/* Three Pillars */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 lg:gap-16 mb-12">
          {pillars.map((pillar, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-mint/10 border border-mint/20 flex items-center justify-center">
                <pillar.icon className="w-5 h-5 text-mint" />
              </div>
              <div className="text-left">
                <p className="font-display font-semibold text-text-primary">{pillar.title}</p>
                <p className="text-sm text-text-secondary">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <Link href="/app">
            <Button className="btn-primary text-navy hover:opacity-90 px-10 py-5 rounded-full text-lg font-semibold transition-all flex items-center gap-3 group mx-auto animate-pulse-glow">
              Start Earning
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-text-muted text-sm mt-4">
            No lock-ups • No selling • No banks
          </p>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
