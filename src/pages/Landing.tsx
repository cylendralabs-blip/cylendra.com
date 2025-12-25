import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NeuralNetworkBackground from '@/components/marketing/NeuralNetworkBackground';
import { useAuth } from '@/hooks/useAuth';
import {
  Brain,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Bot,
  ChevronRight,
  Star,
  Check,
  Activity,
  Target,
  Lock
} from 'lucide-react';

const Landing = () => {
  const { t } = useTranslation('marketing');
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Brain,
      title: t('features.signals.title'),
      description: t('features.signals.description'),
    },
    {
      icon: Bot,
      title: t('features.automation.title'),
      description: t('features.automation.description'),
    },
    {
      icon: Shield,
      title: t('features.risk.title'),
      description: t('features.risk.description'),
    },
    {
      icon: BarChart3,
      title: t('features.analytics.title'),
      description: t('features.analytics.description'),
    },
    {
      icon: Zap,
      title: t('features.speed.title'),
      description: t('features.speed.description'),
    },
    {
      icon: Target,
      title: t('features.backtesting.title'),
      description: t('features.backtesting.description'),
    },
  ];

  const stats = [
    { value: '99.9%', label: t('stats.uptime') },
    { value: '50K+', label: t('stats.active_traders') },
    { value: '$2.5B+', label: t('stats.volume') },
    { value: '150+', label: t('stats.pairs') },
  ];

  const platforms = [
    { name: 'Binance', logo: '🔶' },
    { name: 'OKX', logo: '⭕' },
    { name: 'Bybit', logo: '🟡' },
    { name: 'KuCoin', logo: '🟢' },
  ];

  const testimonials = [
    {
      name: t('testimonials.sarah.name'),
      role: t('testimonials.sarah.role'),
      content: t('testimonials.sarah.content'),
      rating: 5,
    },
    {
      name: t('testimonials.michael.name'),
      role: t('testimonials.michael.role'),
      content: t('testimonials.michael.content'),
      rating: 5,
    },
    {
      name: t('testimonials.emma.name'),
      role: t('testimonials.emma.role'),
      content: t('testimonials.emma.content'),
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Neural Network Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-[hsl(var(--ai-purple))]/10">
          <NeuralNetworkBackground />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--ai-cyan)) 1px, transparent 0)',
              backgroundSize: '40px 40px',
              transform: `translateY(${scrollY * 0.5}px)`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-card border border-border rounded-full px-4 py-2 mb-8 animate-fade-in">
              <Activity className="w-4 h-4 text-[hsl(var(--ai-cyan))]" />
              <span className="text-sm font-medium">{t('hero.badge')}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              {t('hero.title_part1')}{' '}
              <span className="bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] bg-clip-text text-transparent">
                {t('hero.title_part2')}
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in">
              {t('hero.description')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in">
              {!loading && user ? (
                <Button
                  size="lg"
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] hover:opacity-90 text-white text-lg px-8"
                >
                  {t('nav.dashboard')} <ChevronRight className="ml-2" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] hover:opacity-90 text-white text-lg px-8"
                  >
                    {t('hero.start_trading')} <ChevronRight className="ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/info/about')}
                    className="text-lg px-8"
                  >
                    {t('hero.view_demo')}
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 animate-fade-in">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('features.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-border hover:border-[hsl(var(--ai-cyan))]/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
              >
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('platforms.title')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('platforms.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {platforms.map((platform) => (
              <Card
                key={platform.name}
                className="text-center hover:border-[hsl(var(--ai-cyan))]/50 transition-all duration-300 hover:scale-105"
              >
                <CardContent className="pt-6">
                  <div className="text-5xl mb-3">{platform.logo}</div>
                  <p className="font-semibold">{platform.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('testimonials.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border">
                <CardHeader>
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-[hsl(var(--ai-cyan))] text-[hsl(var(--ai-cyan))]" />
                    ))}
                  </div>
                  <CardDescription className="text-base italic">
                    "{testimonial.content}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-br from-[hsl(var(--ai-purple))]/10 to-[hsl(var(--ai-cyan))]/10 border-[hsl(var(--ai-cyan))]/20">
            <CardContent className="text-center py-16">
              <Lock className="w-16 h-16 mx-auto mb-6 text-[hsl(var(--ai-cyan))]" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('cta.title')}
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t('cta.subtitle')}
              </p>
              <Button
                size="lg"
                onClick={() => navigate(!loading && user ? '/dashboard' : '/auth')}
                className="bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] hover:opacity-90 text-white text-lg px-8"
              >
                {!loading && user ? t('cta.button_dashboard') : t('cta.button_trial')} <ChevronRight className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Landing;
