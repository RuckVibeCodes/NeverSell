'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Github, MessageCircle } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'How It Works', href: '#yield-loop' },
    { label: 'Assets', href: '#assets' },
    { label: 'Creator Vaults', href: '#vaults' },
    { label: 'Security', href: '#security' },
  ],
  resources: [
    { label: 'Documentation', href: '#' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Blog', href: '#' },
    { label: 'Audits', href: '#' },
  ],
  community: [
    { label: 'Discord', href: '#' },
    { label: 'Twitter', href: '#' },
    { label: 'GitHub', href: '#' },
  ],
};

const Footer = () => {
  return (
    <footer className="relative w-full py-16 lg:py-24 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16 mb-12">
          {/* Logo & Description */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image
                src="/logo.png"
                alt="NeverSell"
                width={36}
                height={36}
                className="w-9 h-9"
              />
              <span className="font-display text-xl font-bold text-text-primary">
                NeverSell
              </span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed mb-6">
              Earn yield on your crypto without selling. Built on Arbitrum.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-text-muted hover:text-mint transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-text-muted hover:text-mint transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
              <a href="#" className="text-text-muted hover:text-mint transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold text-text-primary mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-muted hover:text-mint transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-display font-semibold text-text-primary mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-muted hover:text-mint transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-display font-semibold text-text-primary mb-4">Community</h4>
            <ul className="space-y-3">
              {footerLinks.community.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-text-muted hover:text-mint transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-sm">
            © {new Date().getFullYear()} NeverSell. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
              Terms
            </a>
            <a href="#" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
