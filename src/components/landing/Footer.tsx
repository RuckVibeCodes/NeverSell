'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Twitter, MessageCircle, Send } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const footerLinks = {
  Product: ['Launch App', 'How it Works', 'Creator Vaults', 'Security'],
  Resources: ['Docs', 'FAQ', 'Blog', 'Audit Report'],
  Community: [
    { name: 'Twitter', icon: Twitter },
    { name: 'Discord', icon: MessageCircle },
    { name: 'Telegram', icon: Send },
  ],
  Legal: ['Terms', 'Privacy', 'Disclaimers'],
};

const Footer = () => {
  const footerRef = useRef<HTMLElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        columnsRef.current?.children || [],
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
          },
        }
      );

      gsap.fromTo(
        bottomRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: bottomRef.current,
            start: 'top 95%',
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative w-full py-16 lg:py-20 border-t border-white/5"
    >
      <div className="w-full px-6 lg:px-10">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div ref={columnsRef} className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
            {/* Logo Column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="NeverSell"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span className="font-display text-2xl font-bold text-text-primary hover:text-mint transition-colors">
                  NeverSell
                </span>
              </Link>
              <p className="text-text-muted text-sm">
                Stack yield on yield.
              </p>
            </div>

            {/* Link Columns */}
            <div>
              <h4 className="font-semibold text-text-primary mb-4 text-sm">
                Product
              </h4>
              <ul className="space-y-3">
                {footerLinks.Product.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-text-secondary hover:text-text-primary transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text-primary mb-4 text-sm">
                Resources
              </h4>
              <ul className="space-y-3">
                {footerLinks.Resources.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-text-secondary hover:text-text-primary transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text-primary mb-4 text-sm">
                Community
              </h4>
              <ul className="space-y-3">
                {footerLinks.Community.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.name}>
                      <a
                        href="#"
                        className="text-text-secondary hover:text-text-primary transition-colors text-sm flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        {link.name}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text-primary mb-4 text-sm">
                Legal
              </h4>
              <ul className="space-y-3">
                {footerLinks.Legal.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-text-secondary hover:text-text-primary transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            ref={bottomRef}
            className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4"
          >
            <p className="text-text-muted text-sm">
              © 2026 NeverSell. All rights reserved.
            </p>
            <p className="text-text-muted text-sm">
              Built on <span className="text-electric-blue">Arbitrum</span>. Powered by <span className="text-mint">Aave</span> & <span className="text-electric-purple">GMX</span>.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
