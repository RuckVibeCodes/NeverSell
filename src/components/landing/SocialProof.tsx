const stats = [
  { value: '0', label: 'Total Value Locked', prefix: '$', suffix: 'M' },
  { value: '0', label: 'Yield Distributed', prefix: '$', suffix: 'K' },
  { value: '0', label: 'Active Depositors', suffix: '+' },
  { value: '0', label: 'Creator Portfolios' },
];

const SocialProof = () => {
  return (
    <section className="relative w-full py-16 lg:py-20 border-y border-white/5">
      <div className="w-full px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-3xl lg:text-5xl font-bold text-mint mb-2">
                  {stat.prefix}{stat.value}{stat.suffix}
                </div>
                <div className="text-sm lg:text-base text-text-secondary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
