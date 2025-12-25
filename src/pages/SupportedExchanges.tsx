import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, X, Shield, Zap, TrendingUp, Globe, ArrowRight, ExternalLink } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function SupportedExchanges() {
  const { t } = useTranslation('exchanges');

  const exchanges = [
    {
      name: "Binance",
      logo: "🟡",
      description: t('items.binance.description'),
      website: "https://www.binance.com",
      gradient: "from-yellow-500 to-orange-500",
      features: {
        spot: true,
        futures: true,
        margin: true,
        options: false,
        staking: true,
        savings: true,
      },
      highlights: t('items.binance.highlights', { returnObjects: true }) as string[],
      requirements: t('items.binance.requirements', { returnObjects: true }) as string[]
    },
    {
      name: "OKX",
      logo: "⚫",
      description: t('items.okx.description'),
      website: "https://www.okx.com",
      gradient: "from-blue-500 to-cyan-500",
      features: {
        spot: true,
        futures: true,
        margin: true,
        options: true,
        staking: true,
        savings: true,
      },
      highlights: t('items.okx.highlights', { returnObjects: true }) as string[],
      requirements: t('items.okx.requirements', { returnObjects: true }) as string[]
    },
    {
      name: "Bybit",
      logo: "🟠",
      description: t('items.bybit.description'),
      website: "https://www.bybit.com",
      gradient: "from-orange-500 to-red-500",
      features: {
        spot: true,
        futures: true,
        margin: true,
        options: true,
        staking: true,
        savings: false,
      },
      highlights: t('items.bybit.highlights', { returnObjects: true }) as string[],
      requirements: t('items.bybit.requirements', { returnObjects: true }) as string[]
    },
    {
      name: "KuCoin",
      logo: "🟢",
      description: t('items.kucoin.description'),
      website: "https://www.kucoin.com",
      gradient: "from-green-500 to-emerald-500",
      features: {
        spot: true,
        futures: true,
        margin: true,
        options: false,
        staking: true,
        savings: true,
      },
      highlights: t('items.kucoin.highlights', { returnObjects: true }) as string[],
      requirements: t('items.kucoin.requirements', { returnObjects: true }) as string[]
    }
  ];

  const comparisonFeatures = [
    { name: t('comparison.spot'), key: "spot" },
    { name: t('comparison.futures'), key: "futures" },
    { name: t('comparison.margin'), key: "margin" },
    { name: t('comparison.options'), key: "options" },
    { name: t('comparison.staking'), key: "staking" },
    { name: t('comparison.savings'), key: "savings" },
  ];

  const integrationSteps = [
    {
      step: 1,
      title: t('guide.step1.title'),
      description: t('guide.step1.description'),
      tips: t('guide.step1.tips', { returnObjects: true }) as string[]
    },
    {
      step: 2,
      title: t('guide.step2.title'),
      description: t('guide.step2.description'),
      tips: t('guide.step2.tips', { returnObjects: true }) as string[]
    },
    {
      step: 3,
      title: t('guide.step3.title'),
      description: t('guide.step3.description'),
      permissions: [
        { name: t('guide.step3.permissions.read'), required: true },
        { name: t('guide.step3.permissions.spot'), required: true },
        { name: t('guide.step3.permissions.futures'), required: false, note: t('guide.step3.permissions.futures_note') },
        { name: t('guide.step3.permissions.margin'), required: false, note: t('guide.step3.permissions.margin_note') },
        { name: t('guide.step3.permissions.withdrawal'), required: false, note: t('guide.step3.permissions.withdrawal_note') }
      ]
    },
    {
      step: 4,
      title: t('guide.step4.title'),
      description: t('guide.step4.description'),
      tips: t('guide.step4.tips', { returnObjects: true }) as string[]
    },
    {
      step: 5,
      title: t('guide.step5.title'),
      description: t('guide.step5.description'),
      tips: t('guide.step5.tips', { returnObjects: true }) as string[]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
              {t('hero.badge')}
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Exchange Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {exchanges.map((exchange, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:scale-105 transition-transform">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`text-6xl`}>{exchange.logo}</div>
                      <div>
                        <CardTitle className="text-2xl">{exchange.name}</CardTitle>
                        <CardDescription className="mt-1">{exchange.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                  <a
                    href={exchange.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {t('sections.visit_website')} <ExternalLink className="w-3 h-3" />
                  </a>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Highlights */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      {t('sections.key_features')}
                    </h4>
                    <ul className="space-y-2">
                      {exchange.highlights.map((highlight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      {t('sections.requirements')}
                    </h4>
                    <ul className="space-y-2">
                      {exchange.requirements.map((req, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">
                          • {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t('sections.comparison_title')}</h2>
            <p className="text-xl text-muted-foreground">{t('sections.comparison_subtitle')}</p>
          </div>

          <div className="max-w-6xl mx-auto overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-4 font-semibold">{t('comparison.feature')}</th>
                  {exchanges.map((exchange, idx) => (
                    <th key={idx} className="text-center py-4 px-4">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">{exchange.logo}</span>
                        <span className="font-semibold text-sm">{exchange.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-4 px-4 font-medium">{feature.name}</td>
                    {exchanges.map((exchange, exchangeIdx) => (
                      <td key={exchangeIdx} className="text-center py-4 px-4">
                        {exchange.features[feature.key as keyof typeof exchange.features] ? (
                          <Check className="w-6 h-6 text-green-400 mx-auto" />
                        ) : (
                          <X className="w-6 h-6 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Integration Guide */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t('sections.integration_title')}</h2>
            <p className="text-xl text-muted-foreground">{t('sections.integration_subtitle')}</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {integrationSteps.map((step, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{step.title}</CardTitle>
                      <CardDescription className="text-base">{step.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {step.tips && (
                    <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                      <p className="font-semibold text-sm mb-2">💡 Tips:</p>
                      <ul className="space-y-1">
                        {step.tips.map((tip, tipIdx) => (
                          <li key={tipIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-purple-400 shrink-0">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.permissions && (
                    <div className="bg-secondary/30 rounded-lg p-4">
                      <p className="font-semibold text-sm mb-3">Required Permissions:</p>
                      <div className="space-y-2">
                        {step.permissions.map((perm, permIdx) => (
                          <div key={permIdx} className="flex items-start gap-3">
                            {perm.required ? (
                              <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                            ) : (
                              <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{perm.name}</p>
                              {perm.note && (
                                <p className="text-xs text-muted-foreground mt-0.5">{perm.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Best Practices */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-8 h-8 text-purple-400" />
                  <CardTitle className="text-3xl">{t('sections.security_title')}</CardTitle>
                </div>
                <CardDescription>{t('sections.security_subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-background/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-green-400">{t('security.do')}</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• {t('security.do_list.2fa')}</li>
                      <li>• {t('security.do_list.whitelist')}</li>
                      <li>• {t('security.do_list.rotate')}</li>
                      <li>• {t('security.do_list.monitor')}</li>
                      <li>• {t('security.do_list.testnet')}</li>
                    </ul>
                  </div>
                  <div className="bg-background/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-red-400">{t('security.dont')}</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• {t('security.dont_list.withdraw')}</li>
                      <li>• {t('security.dont_list.share')}</li>
                      <li>• {t('security.dont_list.reuse')}</li>
                      <li>• {t('security.dont_list.ignore')}</li>
                      <li>• {t('security.dont_list.skip')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t('sections.faq_title')}</h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible>
              {[1, 2, 3, 4, 5].map((i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger>{t(`faq.q${i}`)}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t(`faq.a${i}`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('sections.cta_title')}</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('sections.cta_subtitle')}
          </p>
          <Button size="lg" className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:opacity-90">
            {t('sections.cta_button')} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
