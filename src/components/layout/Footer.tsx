import Link from "next/link";

const footerLinks = {
  product: [
    { href: "/app", label: "Dashboard" },
    { href: "/app/deposit", label: "Deposit" },
    { href: "/app/borrow", label: "Borrow" },
    { href: "/app/vaults", label: "Vaults" },
  ],
  resources: [
    { href: "#", label: "Documentation" },
    { href: "#", label: "FAQ" },
    { href: "#", label: "Security" },
  ],
  social: [
    { href: "#", label: "Twitter" },
    { href: "#", label: "Discord" },
    { href: "#", label: "GitHub" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-mint flex items-center justify-center">
                <span className="text-navy font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-bold text-white">NeverSell</span>
            </Link>
            <p className="text-white/50 text-sm">
              DeFi yield without selling your assets. Built on Arbitrum.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/50 hover:text-mint text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/50 hover:text-mint text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Community</h4>
            <ul className="space-y-2">
              {footerLinks.social.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/50 hover:text-mint text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} NeverSell. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
