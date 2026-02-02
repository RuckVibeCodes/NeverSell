'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How does the yield loop work?',
    answer:
      'It\'s simple: 1) Deposit crypto and earn 7-15% APY. 2) Borrow up to 70% of your deposit value without selling. 3) Deploy borrowed funds into yield pools or Creator Portfolios. 4) Earn yield on your borrowed capital while your original deposit keeps earning. Your money works twice.',
  },
  {
    question: 'What are Creator Portfolios?',
    answer:
      'Creator Portfolios let influencers, traders, and community leaders launch their own yield strategies. Followers can deposit into these portfolios and earn alongside their favorite creators. It\'s a way to earn together while supporting the creators you trust.',
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
    question: 'What if prices drop?',
    answer:
      'If you\'re in BTC, ETH, or ARB, your position value moves with the market — just like holding those assets anywhere. If you\'ve borrowed against your position and prices drop significantly, liquidation can occur. We show your Health Factor at all times so you can manage risk. For zero price risk, choose USDC.',
  },
];

const FAQ = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="relative w-full py-24 lg:py-32"
    >
      <div className="w-full px-6 lg:px-10">
        <div className="max-w-3xl mx-auto">
          <h2
            className={`font-display text-display-2 text-text-primary text-center mb-12 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Questions? <span className="text-gradient">Answered.</span>
          </h2>

          <div 
            className={`transition-all duration-700 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="glass-card rounded-xl border-0 px-6 data-[state=open]:border-mint/30 transition-colors"
                >
                  <AccordionTrigger className="text-text-primary text-left hover:no-underline py-5 text-base lg:text-lg font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-text-secondary pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
