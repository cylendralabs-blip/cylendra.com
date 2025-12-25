import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Grid3x3, Zap, LineChart, Brain, ArrowRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function StrategiesInfo() {
  const { t } = useTranslation('strategies');

  const strategies = [
    {
      id: "dca",
      icon: TrendingUp,
      title: t('items.dca.title'),
      description: t('items.dca.description'),
      color: "from-purple-500 to-blue-500",
      howItWorks: t('items.dca.howItWorks'),
    },
    {
      id: "grid",
      icon: Grid3x3,
      title: t('items.grid.title'),
      description: t('items.grid.description'),
      color: "from-blue-500 to-cyan-500",
      howItWorks: t('items.grid.howItWorks'),
    },
    {
      id: "scalping",
      icon: Zap,
      title: t('items.scalping.title'),
      description: t('items.scalping.description'),
      color: "from-cyan-500 to-purple-500",
      howItWorks: t('items.scalping.howItWorks'),
    },
    {
      id: "trend",
      icon: LineChart,
      title: t('items.trend.title'),
      description: t('items.trend.description'),
      color: "from-purple-500 to-pink-500",
      howItWorks: t('items.trend.howItWorks'),
    },
    {
      id: "ai-ensemble",
      icon: Brain,
      title: t('items.ai_ensemble.title'),
      description: t('items.ai_ensemble.description'),
      color: "from-pink-500 to-purple-500",
      howItWorks: t('items.ai_ensemble.howItWorks'),
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <section className="relative py-20 pt-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">{t('hero.badge')}</Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">{t('hero.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="space-y-32">
            {strategies.map((strategy, index) => (
              <Card key={strategy.id} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-8">
                  <div className="flex items-start gap-6">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${strategy.color} text-white`}>
                      <strategy.icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl mb-3">{strategy.title}</CardTitle>
                      <CardDescription className="text-lg">{strategy.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">{t('sections.how_it_works')}</h3>
                    <p className="text-muted-foreground leading-relaxed">{strategy.howItWorks}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
          <Button size="lg" className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:opacity-90">
            {t('cta.button')} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
