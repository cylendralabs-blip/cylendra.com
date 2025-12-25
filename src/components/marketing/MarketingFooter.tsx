import { Link } from 'react-router-dom';
import { Twitter, Youtube, Linkedin, Send } from 'lucide-react';

const MarketingFooter = () => {
  const footerLinks = {
    product: [
      { name: 'Features', path: '/#features' },
      { name: 'Pricing', path: '/info/pricing' },
      { name: 'Strategies', path: '/info/strategies' },
      { name: 'AI Technology', path: '/info/ai-technology' },
    ],
    resources: [
      { name: 'Blog', path: '/blog' },
      { name: 'Trading Academy', path: '/academy' },
      { name: 'FAQ', path: '/info/faq' },
      { name: 'Roadmap', path: '/roadmap' },
    ],
    company: [
      { name: 'About Us', path: '/info/about' },
      { name: 'Community', path: '/community' },
      { name: 'Contact', path: '/info/contact' },
    ],
    legal: [
      { name: 'Terms & Conditions', path: '/terms' },
      { name: 'Privacy Policy', path: '/privacy' },
      { name: 'Cookie Policy', path: '#' },
    ],
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center mb-4">
              <img 
                src="/logo/orbitra-ai-logo.svg" 
                alt="Orbitra AI" 
                className="h-14 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              AI-powered trading platform combining cutting-edge neural networks with advanced trading strategies.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[hsl(var(--ai-cyan))] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[hsl(var(--ai-cyan))] transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[hsl(var(--ai-cyan))] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://t.me" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[hsl(var(--ai-cyan))] transition-colors">
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-muted-foreground hover:text-[hsl(var(--ai-cyan))] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-muted-foreground hover:text-[hsl(var(--ai-cyan))] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-muted-foreground hover:text-[hsl(var(--ai-cyan))] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-muted-foreground hover:text-[hsl(var(--ai-cyan))] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Cylendra. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground mt-4 md:mt-0">
            Powered by <span className="text-[hsl(var(--ai-cyan))] font-semibold">Cylendra Labs</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default MarketingFooter;
