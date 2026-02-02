import { Wallet, Split, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Deposit',
    description: 'Deposit USDC from any wallet. We handle bridging, swapping, routing.',
    icon: Wallet,
  },
  {
    number: '02',
    title: 'We Split',
    description: '60% earns lending yield on Aave. 40% earns trading fees on GMX.',
    icon: Split,
  },
  {
    number: '03',
    title: 'You Earn',
    description: 'Watch your balance grow daily. Withdraw anytime—no penalties.',
    icon: TrendingUp,
  },
];

const HowItWorks = () => {
  return (
    <section className="relative w-full py-24 lg:py-32">
      <div className="w-full px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          {/* Heading */}
          <h2 className="font-display text-display-2 text-text-primary text-center mb-12 lg:mb-16">
            Simple as <span className="text-gradient-mint">1-2-3</span>
          </h2>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-12">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-mint/10 border border-mint/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-mint" />
                  </div>
                  <div className="text-sm font-mono text-mint mb-2">{step.number}</div>
                  <h3 className="font-display text-xl text-text-primary font-semibold mb-2">
                    {step.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Closing */}
          <p className="text-center text-text-secondary text-lg">
            Zero lock-ups. <span className="text-mint">Withdraw anytime.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
