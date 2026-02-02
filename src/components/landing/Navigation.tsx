'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, TrendingUp, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How it Works', href: '#yield-loop' },
    { label: 'Portfolios', href: '#portfolios' },
    { label: 'Assets', href: '#assets' },
    { label: 'Security', href: '#security' },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-navy/90 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="w-full px-6 lg:px-10">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo + Live indicator */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3 group">
                <Image
                  src="/logo.png"
                  alt="NeverSell"
                  width={36}
                  height={36}
                  className="w-9 h-9"
                  priority
                />
                <span className="font-display text-xl lg:text-2xl font-bold text-text-primary group-hover:text-mint transition-colors">
                  NeverSell
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint/10 border border-mint/20">
                <Circle className="w-2 h-2 fill-mint text-mint animate-pulse" />
                <span className="font-mono text-xs text-mint">LIVE</span>
              </div>
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <TrendingUp className="w-3.5 h-3.5 text-mint" />
                <span className="font-mono text-xs text-text-secondary">USDC APY <span className="text-mint">7.5%</span></span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.href)}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <Link href="/app">
                <Button
                  className="btn-primary text-navy hover:opacity-90 px-6 py-2.5 rounded-full text-sm font-semibold transition-all"
                >
                  Launch App →
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-text-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Only render when open */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/98 backdrop-blur-xl"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col items-center justify-center h-full gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.href)}
                className="text-2xl font-display text-text-primary hover:text-mint transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link href="/app" onClick={() => setIsMobileMenuOpen(false)}>
              <Button
                className="mt-4 btn-primary text-navy px-8 py-3 rounded-full text-lg font-semibold"
              >
                Launch App →
              </Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
