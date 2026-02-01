'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How does the yield loop work?',
    answer:
      "It's simple: 1) Deposit crypto and earn 7-15% APY. 2) Borrow up to 70% of your deposit value without selling. 3) Deploy borrowed funds into yield pools or Creator Vaults. 4) Earn yield on your borrowed capital while your original deposit keeps earning. Your money works twice.",
  },
  {
    question: 'What are Creator Vaults?',
    answer:
      "Creator Vaults let influencers, traders, and community leaders launch their own yield strategies. Followers can deposit into these vaults and earn alongside their favorite creators. It's a way to earn together while supporting the creators you trust.",
  },
  {
    question: 'Is my money safe?',
    answer:
      'Your funds are held in Aave and GMX — two of the most battle-tested DeFi protocols with billions in TVL and years of security track record. NeverSell is just the routing layer. We never have custody of your funds, and all contracts are audited.',
  },
  {
    question: 'Can I withdraw anytime?',
    answer:
      'Yes. No lock-ups, no penalties. Click withdraw, sign the transaction, and your funds are back in your wallet within minutes. Your deposit, your control.',
  },
  {
    question: 'What are the fees?',
    answer:
      'We take 10-15% of your yield (not your principal). If you earn $100, we keep $10-15, you keep $85-90. No deposit fees. No withdrawal fees. No hidden costs.',
  },
  {
    question: 'What chains do you support?',
    answer:
      'We launch on Arbitrum One for low fees and fast transactions. More chains coming soon based on community demand.',
  },
  {
    question: 'How do I get started?',
    answer:
      'Connect your wallet, choose your assets, and deposit. Your yield loop starts automatically. Watch your earnings grow in real-time.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-navy-900/50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Frequently Asked <span className="text-mint-400">Questions</span>
          </h2>
          <p className="text-white/60 text-lg">
            Everything you need to know about earning yield without selling
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="glass-card-mint rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-white font-medium text-lg">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-mint-400 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-5 text-white/60 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
