import { X, Check } from 'lucide-react';

const sellPoints = [
  { text: 'Pay ~$3,000 in taxes', negative: true },
  { text: 'Lose future upside', negative: true },
  { text: 'Miss the pump', negative: true },
];

const borrowPoints = [
  { text: 'Keep your crypto', negative: false },
  { text: 'Keep the upside', negative: false },
  { text: 'Pay simple interest', negative: false },
];

const Method = () => {
  return (
    <section className="relative w-full py-24 lg:py-32 overflow-hidden">
      {/* Background - pointer-events-none to allow touch through */}
      <div className="absolute inset-0 bg-navy-light pointer-events-none" />
      {/* Background glow - hidden on mobile for performance */}
      <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-mint/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 w-full px-6 lg:px-10">
        <h2 className="font-display text-display-2 text-text-primary text-center mb-12 lg:mb-16">
          Need cash? <span className="text-mint">Borrow, don&apos;t sell.</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {/* Sell Card */}
          <div className="glass-card rounded-3xl p-8 lg:p-10 border-red-500/20 opacity-70">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center border border-red-500/25">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="font-display text-2xl text-red-400 font-semibold">SELL</h3>
            </div>

            <ul className="space-y-4 mb-8">
              {sellPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3 text-text-secondary">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                  {point.text}
                </li>
              ))}
            </ul>

            <div className="pt-6 border-t border-white/10">
              <p className="text-red-400 font-semibold">You lose.</p>
            </div>
          </div>

          {/* Borrow Card */}
          <div className="glass-card-strong rounded-3xl p-8 lg:p-10 border-mint/30 glow-mint relative overflow-hidden">
            {/* Animated glow background - pointer-events-none to allow touch through */}
            <div className="absolute inset-0 bg-gradient-to-br from-mint/10 via-transparent to-electric-blue/10 pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-mint/15 flex items-center justify-center border border-mint/30">
                  <Check className="w-6 h-6 text-mint" />
                </div>
                <h3 className="font-display text-2xl text-mint font-semibold">BORROW</h3>
              </div>

              <ul className="space-y-4 mb-8">
                {borrowPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 text-text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-mint mt-2 flex-shrink-0" />
                    {point.text}
                  </li>
                ))}
              </ul>

              <div className="pt-6 border-t border-white/10">
                <p className="text-mint font-semibold">You win.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-text-secondary mt-10 lg:mt-14 text-lg max-w-xl mx-auto">
          This is how the <span className="text-text-primary font-medium">smart money</span> plays.
        </p>
      </div>
    </section>
  );
};

export default Method;
