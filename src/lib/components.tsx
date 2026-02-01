import { cn } from "@/lib/utils";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="nav-link text-sm font-medium"
    >
      {children}
    </a>
  );
}

export function Button({ 
  className, 
  variant = "primary", 
  children, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }) {
  return (
    <button 
      className={cn(
        "px-6 py-3 rounded-lg font-semibold transition-all duration-200",
        variant === "primary" 
          ? "bg-mint text-navy hover:bg-mint-600 hover:shadow-mint-glow" 
          : "bg-transparent border border-mint/50 text-mint hover:bg-mint/10",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
