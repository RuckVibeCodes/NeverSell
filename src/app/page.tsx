import Link from "next/link";
import { ArrowRight, Shield, TrendingUp, Wallet } from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Deposit & Earn",
    description: "Deposit your crypto assets and start earning yield immediately. No lock-ups required.",
  },
  {
    icon: TrendingUp,
    title: "Borrow Against",
    description: "Access liquidity without selling. Borrow stablecoins against your deposited assets.",
  },
  {
    icon: Shield,
    title: "Never Sell",
    description: "Keep your upside exposure. Your assets stay yours while you access their value.",
  },
];

const stats = [
  { label: "Total Value Locked", value: "$0" },
  { label: "Total Borrowed", value: "$0" },
  { label: "Active Users", value: "0" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-mint/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Earn Yield.{" "}
              <span className="text-gradient">Never Sell.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-8">
              The DeFi protocol that lets you access the value of your crypto 
              without giving up your position. Deposit, borrow, and grow—all on Arbitrum.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app" className="btn-primary inline-flex items-center justify-center gap-2">
                Launch App
                <ArrowRight size={18} />
              </Link>
              <a href="#" className="btn-secondary inline-flex items-center justify-center">
                Read Docs
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-mint mb-2">{stat.value}</div>
                <div className="text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Simple, transparent DeFi lending. No hidden fees, no complicated tokenomics.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card p-8 text-center">
                <div className="w-14 h-14 rounded-xl bg-mint/10 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="text-mint" size={28} />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-mint/10 via-transparent to-mint/10 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
              <p className="text-white/60 mb-8 max-w-xl mx-auto">
                Connect your wallet and start earning yield on your crypto today.
              </p>
              <Link href="/app" className="btn-primary inline-flex items-center gap-2">
                Launch App
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
