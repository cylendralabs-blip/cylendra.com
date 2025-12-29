import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, HelpCircle, Bot, Brain, CreditCard, Shield } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function FAQ() {
  const { t } = useTranslation('faq');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: "general", name: t('categories.general'), icon: HelpCircle, color: "from-purple-500 to-blue-500" },
    { id: "bot", name: t('categories.bot'), icon: Bot, color: "from-blue-500 to-cyan-500" },
    { id: "ai", name: t('categories.ai'), icon: Brain, color: "from-cyan-500 to-purple-500" },
    { id: "subscriptions", name: t('categories.subscriptions'), icon: CreditCard, color: "from-purple-500 to-pink-500" },
    { id: "security", name: t('categories.security'), icon: Shield, color: "from-pink-500 to-purple-500" },
  ];

  const faqs = [
    ...t('questions.general', { returnObjects: true }) as any[],
    ...t('questions.bot', { returnObjects: true }) as any[],
    ...t('questions.ai', { returnObjects: true }) as any[],
    ...t('questions.subscriptions', { returnObjects: true }) as any[],
    ...t('questions.security', { returnObjects: true }) as any[],
  ].map((faq, index) => {
    // Add category back to the faq object for filtering
    let category = "general";
    if (index >= (t('questions.general', { returnObjects: true }) as any[]).length) category = "bot";
    if (index >= (t('questions.general', { returnObjects: true }) as any[]).length + (t('questions.bot', { returnObjects: true }) as any[]).length) category = "ai";
    if (index >= (t('questions.general', { returnObjects: true }) as any[]).length + (t('questions.bot', { returnObjects: true }) as any[]).length + (t('questions.ai', { returnObjects: true }) as any[]).length) category = "subscriptions";
    if (index >= (t('questions.general', { returnObjects: true }) as any[]).length + (t('questions.bot', { returnObjects: true }) as any[]).length + (t('questions.ai', { returnObjects: true }) as any[]).length + (t('questions.subscriptions', { returnObjects: true }) as any[]).length) category = "security";

    return { ...faq, category };
  });

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('hero.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg bg-secondary/50 border-border/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-6 py-3 rounded-full transition-all ${selectedCategory === null
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                }`}
            >
              {t('categories.all')}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${selectedCategory === category.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {selectedCategory ? (
              // Grouped by selected category
              <div>
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                  {categories.find(c => c.id === selectedCategory)?.icon && (
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${categories.find(c => c.id === selectedCategory)?.color} text-white`}>
                      {(() => {
                        const Icon = categories.find(c => c.id === selectedCategory)?.icon;
                        return Icon ? <Icon className="w-6 h-6" /> : null;
                      })()}
                    </div>
                  )}
                  {categories.find(c => c.id === selectedCategory)?.name}
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredFaqs.map((faq, index) => (
                    <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
                      <AccordionItem value={`item-${index}`} className="border-0">
                        <AccordionTrigger className="px-6 hover:no-underline text-start">
                          <span className="text-left font-semibold">{faq.question}</span>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6 text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    </Card>
                  ))}
                </Accordion>
              </div>
            ) : (
              // All categories
              <div className="space-y-12">
                {categories.map((category) => {
                  const categoryFaqs = filteredFaqs.filter(faq => faq.category === category.id);
                  if (categoryFaqs.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${category.color} text-white`}>
                          <category.icon className="w-6 h-6" />
                        </div>
                        {category.name}
                      </h2>
                      <Accordion type="single" collapsible className="space-y-4">
                        {categoryFaqs.map((faq, index) => (
                          <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <AccordionItem value={`${category.id}-${index}`} className="border-0">
                              <AccordionTrigger className="px-6 hover:no-underline text-start">
                                <span className="text-left font-semibold">{faq.question}</span>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-6 text-muted-foreground">
                                {faq.answer}
                              </AccordionContent>
                            </AccordionItem>
                          </Card>
                        ))}
                      </Accordion>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredFaqs.length === 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm text-center py-12">
                <CardContent>
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">{t('no_results.title')}</h3>
                  <p className="text-muted-foreground">
                    {t('no_results.subtitle')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Still Have Questions CTA */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">{t('cta.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/contact" className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90 transition-opacity">
              {t('cta.contact')}
            </a>
            <a href="https://t.me/orbitra_ai" className="px-6 py-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              {t('cta.community')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
