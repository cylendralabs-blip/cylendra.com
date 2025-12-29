import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const MarketingNavbar = () => {
  const { t } = useTranslation('marketing');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.strategies'), path: '/info/strategies' },
    { name: t('nav.exchanges'), path: '/info/exchanges' },
    { name: t('nav.pricing'), path: '/info/pricing' },
    { name: t('nav.about'), path: '/info/about' },
    { name: t('nav.contact'), path: '/info/contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-lg shadow-lg border-b border-border' : 'bg-transparent'
      }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img
              src="/logo/orbitra-ai-logo.svg"
              alt="Orbitra AI"
              className="h-12 w-auto transform group-hover:scale-105 transition-transform"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-sm font-medium text-foreground hover:text-[hsl(var(--ai-cyan))] transition-colors relative group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          {/* CTA Buttons & Language Switcher */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            {!loading && user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="hover:text-[hsl(var(--ai-cyan))]"
                >
                  {t('nav.dashboard')}
                </Button>
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] hover:opacity-90 text-white"
                >
                  {t('nav.go_to_dashboard')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                  className="hover:text-[hsl(var(--ai-cyan))]"
                >
                  {t('nav.sign_in')}
                </Button>
                <Button
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] hover:opacity-90 text-white"
                >
                  {t('nav.get_started')}
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button & Language Switcher */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSwitcher />
            <button
              className="p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block text-sm font-medium text-foreground hover:text-[hsl(var(--ai-cyan))] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex flex-col space-y-2 pt-4 border-t border-border">
              {!loading && user ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate('/dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {t('nav.dashboard')}
                  </Button>
                  <Button
                    onClick={() => {
                      navigate('/dashboard');
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] hover:opacity-90 text-white"
                  >
                    {t('nav.go_to_dashboard')}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate('/auth');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {t('nav.sign_in')}
                  </Button>
                  <Button
                    onClick={() => {
                      navigate('/auth');
                      setIsMobileMenuOpen(false);
                    }}
                    className="bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] hover:opacity-90 text-white"
                  >
                    {t('nav.get_started')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default MarketingNavbar;
