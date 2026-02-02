const stats = [
  { value: '0', label: 'Total Value Locked', prefix: '$', suffix: 'M' },
  { value: '0', label: 'Yield Distributed', prefix: '$', suffix: 'K' },
  { value: '0', label: 'Active Depositors', suffix: '+' },
  { value: '0', label: 'Creator Portfolios' },
];

const LiveStats = () => {
  return (
    <section className="relative w-full py-12 lg:py-16 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-mint/[0.02] to-transparent" />

      <div className="w-full px-6 lg:px-10">
        <div className="relative max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center relative">
                <div className="font-mono text-3xl lg:text-5xl font-bold text-mint pulse-number mb-2">
                  {stat.prefix}{stat.value}{stat.suffix}
                </div>
                <div className="text-sm lg:text-base text-text-muted">{stat.label}</div>
                {/* Subtle glow behind number - hidden on mobile for performance */}
                <div className="hidden lg:block absolute inset-0 bg-mint/5 blur-2xl rounded-full -z-10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveStats;
