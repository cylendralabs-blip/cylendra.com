import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Products", href: "/products" },
    { name: "Company", href: "/company" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/30 selection:text-primary-foreground">
      {/* Navigation */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
          isScrolled ? "bg-background/80 backdrop-blur-md border-white/5 py-3" : "bg-transparent py-5"
        )}
      >
        <div className="container flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E6B355] to-[#F2D088] flex items-center justify-center text-black font-bold text-lg shadow-[0_0_15px_rgba(230,179,85,0.3)] group-hover:shadow-[0_0_25px_rgba(230,179,85,0.5)] transition-all duration-300">
                C
              </div>
              <span className="font-bold text-xl tracking-tight">Cylendra Labs</span>
            </a>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <a className={cn(
                  "text-sm font-medium transition-colors hover:text-primary relative group",
                  location === link.href ? "text-primary" : "text-muted-foreground"
                )}>
                  {link.name}
                  <span className={cn(
                    "absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full",
                    location === link.href ? "w-full" : ""
                  )} />
                </a>
              </Link>
            ))}
            
            {/* Legal Dropdown Trigger (Simplified for now) */}
            <div className="relative group cursor-pointer">
              <span className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                Legal <ChevronDown className="w-3 h-3" />
              </span>
              <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                <div className="bg-card border border-white/10 rounded-lg shadow-xl p-2 min-w-[160px] flex flex-col gap-1">
                  <Link href="/legal/privacy"><a className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-2 rounded-md transition-colors">Privacy Policy</a></Link>
                  <Link href="/legal/terms"><a className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-2 rounded-md transition-colors">Terms of Service</a></Link>
                  <Link href="/legal/disclaimer"><a className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-2 rounded-md transition-colors">Disclaimer</a></Link>
                </div>
              </div>
            </div>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/products">
              <Button className="rounded-full px-6 bg-white text-black hover:bg-white/90 hover:scale-105 transition-all duration-300 font-medium shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Explore Products
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-foreground p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 px-6 md:hidden flex flex-col gap-6"
          >
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <a className="text-2xl font-medium text-foreground hover:text-primary transition-colors">
                  {link.name}
                </a>
              </Link>
            ))}
            <div className="h-px bg-white/10 w-full my-2" />
            <Link href="/legal/privacy"><a className="text-lg text-muted-foreground">Privacy Policy</a></Link>
            <Link href="/legal/terms"><a className="text-lg text-muted-foreground">Terms of Service</a></Link>
            <Link href="/legal/disclaimer"><a className="text-lg text-muted-foreground">Disclaimer</a></Link>
            <div className="mt-auto mb-10">
              <Link href="/products">
                <Button className="w-full rounded-full py-6 text-lg bg-white text-black hover:bg-white/90">
                  Explore Products
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow pt-24">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-white/5 py-16 mt-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            {/* Brand Column */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-[#E6B355] to-[#F2D088] flex items-center justify-center text-black font-bold text-xs">
                  C
                </div>
                <span className="font-bold text-lg">Cylendra Labs</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                AI-Powered Trading & Market Intelligence Ecosystem. An interconnected suite of tools for the modern trader.
              </p>
            </div>

            {/* Product Column */}
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-foreground">Products</h3>
              <ul className="flex flex-col gap-2">
                <li><Link href="/products/cylendra-portal"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">Portal</a></Link></li>
                <li><Link href="/products/orbitra-ai"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">Orbitra AI</a></Link></li>
                <li><Link href="/products/cylendra-alerts"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">Alerts</a></Link></li>
                <li><Link href="/products/cyle-learn-bot"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">Learn Bot</a></Link></li>
                <li><Link href="/products"><a className="text-sm text-primary hover:text-primary/80 transition-colors">View All →</a></Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-foreground">Company</h3>
              <ul className="flex flex-col gap-2">
                <li><Link href="/company"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</a></Link></li>
                <li><a href="mailto:hello@cylendra.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal Column */}
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-foreground">Legal</h3>
              <ul className="flex flex-col gap-2">
                <li><Link href="/legal/privacy"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></Link></li>
                <li><Link href="/legal/terms"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></Link></li>
                <li><Link href="/legal/disclaimer"><a className="text-sm text-muted-foreground hover:text-primary transition-colors">Disclaimer</a></Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Cylendra Labs. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/60 max-w-md text-center md:text-right">
              Not financial advice. Cryptocurrency trading involves substantial risk of loss.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
