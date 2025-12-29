import { Button } from "@/components/ui/button";
import { products } from "@/lib/products";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowRight, Check, ChevronDown, ExternalLink, Terminal, Shield, Zap, BarChart3, GraduationCap, Calculator, Wallet, Coins, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

// Hero Component with Interactive Simulation
const Hero = () => {
  const [text, setText] = useState("");
  const fullText = "Analyze my portfolio across exchanges and send actionable Telegram alerts.";
  const [step, setStep] = useState(0); // 0: typing, 1: thinking, 2: running
  
  useEffect(() => {
    if (step === 0) {
      if (text.length < fullText.length) {
        const timeout = setTimeout(() => {
          setText(fullText.slice(0, text.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setStep(1), 500);
        return () => clearTimeout(timeout);
      }
    } else if (step === 1) {
      const timeout = setTimeout(() => setStep(2), 1500);
      return () => clearTimeout(timeout);
    }
  }, [text, step]);

  const tasks = [
    { id: 1, name: "Portfolio breakdown", status: "completed" },
    { id: 2, name: "Risk snapshot", status: "completed" },
    { id: 3, name: "Signal filtering", status: "processing" },
    { id: 4, name: "Telegram delivery", status: "pending" },
  ];

  return (
    <section className="relative pt-20 pb-32 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container relative z-10">
        <div className="flex flex-col items-center text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary-foreground/80">Cylendra Labs Ecosystem</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl"
          >
            <span className="text-gradient-gold">AI-Powered Trading</span> & <br />
            Market Intelligence
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mb-10"
          >
            An interconnected suite of AI tools for crypto and markets—signals, learning, analytics, calculators, and the next layer: a DEX and unified token utility.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link href="/products">
              <Button size="lg" className="rounded-full px-8 bg-primary text-black hover:bg-primary/90 font-semibold text-lg h-14 shadow-[0_0_30px_rgba(230,179,85,0.2)]">
                Explore Products
              </Button>
            </Link>
            <a href="mailto:hello@cylendra.com">
              <Button variant="outline" size="lg" className="rounded-full px-8 border-white/10 hover:bg-white/5 text-lg h-14">
                Contact Us
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Interactive Simulation Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-5xl mx-auto relative"
        >
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* Browser Header */}
            <div className="h-12 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
              </div>
              <div className="ml-4 px-3 py-1 rounded-md bg-black/40 text-xs text-muted-foreground flex items-center gap-2 min-w-[200px]">
                <div className="w-2 h-2 rounded-full bg-primary" />
                cylendra-agent.ai
              </div>
            </div>

            {/* Browser Content */}
            <div className="p-8 min-h-[400px] flex flex-col">
              {/* Input Area */}
              <div className="w-full max-w-2xl mx-auto mb-12">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    readOnly
                    value={text}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  {step === 0 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-5 bg-primary animate-pulse" />
                  )}
                </div>
                
                {/* Thinking State */}
                <AnimatePresence>
                  {step >= 1 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pl-12"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Thinking...
                      </div>
                      <p className="text-sm text-muted-foreground/60 italic">
                        Accessing Orbitra AI for portfolio data... Checking Cylendra Alerts for signals...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Results Grid */}
              <AnimatePresence>
                {step === 2 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto w-full"
                  >
                    {/* Card 1: Orbitra */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-card/50 border border-white/5 rounded-lg p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded bg-blue-500/10 text-blue-500"><BarChart3 className="w-4 h-4" /></div>
                        <span className="font-medium text-sm">Orbitra AI: Portfolio Report</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Total Value</span>
                          <span className="font-mono">$124,592.40</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-500 h-full w-[75%]" />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">+4.2% (24h)</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">Binance + Bybit</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Card 2: Alerts */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-card/50 border border-white/5 rounded-lg p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded bg-yellow-500/10 text-yellow-500"><Bell className="w-4 h-4" /></div>
                        <span className="font-medium text-sm">Alerts: Signal Queue</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">BTC/USDT</span>
                            <span className="text-[10px] text-green-500">LONG</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">2m ago</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">ETH/USDT</span>
                            <span className="text-[10px] text-red-500">SHORT</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">15m ago</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Card 3: Calculator */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="bg-card/50 border border-white/5 rounded-lg p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded bg-purple-500/10 text-purple-500"><Calculator className="w-4 h-4" /></div>
                        <span className="font-medium text-sm">Calculator: Position Size</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-white/5 rounded">
                          <div className="text-muted-foreground mb-1">Risk (1%)</div>
                          <div className="font-mono">$1,245.92</div>
                        </div>
                        <div className="p-2 bg-white/5 rounded">
                          <div className="text-muted-foreground mb-1">Size (5x)</div>
                          <div className="font-mono">$6,229.60</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Card 4: Learn */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 }}
                      className="bg-card/50 border border-white/5 rounded-lg p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded bg-pink-500/10 text-pink-500"><GraduationCap className="w-4 h-4" /></div>
                        <span className="font-medium text-sm">Learn Bot: Lesson Plan</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">Next up: Risk Management 101</div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-pink-500 h-full w-[40%]" />
                      </div>
                      <div className="mt-2 text-[10px] text-right text-muted-foreground">40% Complete</div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Category Chips Component
const CategoryChips = () => {
  const categories = [
    { name: "Trading Intelligence", icon: Zap },
    { name: "Alerts & Automation", icon: Bell },
    { name: "Portfolio & Risk", icon: BarChart3 },
    { name: "Learning", icon: GraduationCap },
    { name: "Tools & Calculators", icon: Calculator },
    { name: "DeFi / DEX", icon: Wallet, comingSoon: true },
    { name: "Token Utility", icon: Coins, comingSoon: true },
  ];

  return (
    <section className="py-10 border-y border-white/5 bg-white/[0.02]">
      <div className="container overflow-x-auto no-scrollbar">
        <div className="flex gap-4 min-w-max px-4 md:justify-center">
          {categories.map((cat, i) => (
            <div 
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors cursor-default"
            >
              <cat.icon className="w-4 h-4" />
              {cat.name}
              {cat.comingSoon && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary ml-1">Soon</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Feature Block Component
const FeatureBlock = ({ product, index }: { product: any, index: number }) => {
  const isEven = index % 2 === 0;
  
  return (
    <section className="py-24 md:py-32 border-b border-white/5 last:border-0">
      <div className="container">
        <div className={cn(
          "flex flex-col md:flex-row items-center gap-12 md:gap-24",
          !isEven && "md:flex-row-reverse"
        )}>
          {/* Text Content */}
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 w-fit">
              {product.status === "LIVE" && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
              {product.status === "BETA" && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
              {product.status === "COMING_SOON" && <span className="w-2 h-2 rounded-full bg-yellow-500" />}
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.status.replace("_", " ")}</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              {product.name === "Cylendra Portal" && "Your Trading Command Center"}
              {product.name === "Orbitra AI By Cylendra" && "Smart Portfolio Analysis"}
              {product.name === "Crypto Pulse By Cylendra" && "Alerts That Respect Strategy"}
              {product.name === "Cyle Learn Bot" && "Learn Trading Like a System"}
              {product.name === "Cylendra Calculator" && "Trading Math, Made Effortless"}
              {product.name === "Cylendra Hedge Fund" && "A Managed Strategy Layer"}
              {product.name === "Cylendra DEX" && "Decentralized Trading Layer"}
              {product.name === "Cylee Token Platform" && "Unified Token Utility"}
            </h2>
            
            <p className="text-xl text-muted-foreground leading-relaxed">
              {product.description}
            </p>
            
            <div className="space-y-2 pl-4 border-l-2 border-primary/30">
              <p className="text-lg font-medium text-muted-foreground italic">
                "Still {
                  product.name === "Cylendra Portal" ? "switching between tools?" :
                  product.name === "Orbitra AI By Cylendra" ? "guessing what's happening?" :
                  product.name === "Crypto Pulse By Cylendra" ? "missing entries?" :
                  product.name === "Cyle Learn Bot" ? "learning without a path?" :
                  product.name === "Cylendra Calculator" ? "calculating manually?" :
                  "waiting for the next step?"
                }"
              </p>
              <p className="text-lg font-bold text-primary">
                {
                  product.name === "Cylendra Portal" ? "Cylendra brings it all into one lab." :
                  product.name === "Orbitra AI By Cylendra" ? "Orbitra turns raw data into clarity." :
                  product.name === "Crypto Pulse By Cylendra" ? "Cylendra pings you instantly." :
                  product.name === "Cyle Learn Bot" ? "Cyle Learn helps you progress step by step." :
                  product.name === "Cylendra Calculator" ? "Cylendra Calculator does it right." :
                  "Cylendra is building the future."
                }
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4">
              {product.externalLink && (product.status === "LIVE" || product.status === "BETA") ? (
                <a href={product.externalLink} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="rounded-full gap-2">
                    Open {product.name.split(" ")[1] || "App"} <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              ) : (
                <a href="mailto:hello@cylendra.com?subject=Updates">
                  <Button size="lg" className="rounded-full gap-2">
                    Get Updates <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              )}
              
              <Link href={`/products/${product.slug}`}>
                <Button variant="outline" size="lg" className="rounded-full border-white/10 hover:bg-white/5">
                  Learn more
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Visual/Mockup */}
          <div className="flex-1 w-full">
            <div className="relative aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-card/30 backdrop-blur-sm shadow-2xl group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
              
              {/* Abstract UI Representation based on product */}
              <div className="absolute inset-0 flex items-center justify-center">
                <product.icon className="w-32 h-32 text-primary/20 group-hover:text-primary/40 transition-colors duration-500" />
              </div>
              
              {/* Floating Elements */}
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded bg-primary/20 text-primary">
                    <product.icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold">{product.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">{product.oneLiner}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Transparency Section
const TransparencySection = () => {
  return (
    <section className="py-32 bg-gradient-to-b from-background to-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Transparent. Configurable. <br />
            <span className="text-gradient-gold">Under Your Control.</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            We design AI tools that explain their outputs and give you control over how signals and insights are delivered.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: "Explainable Insights", desc: "Clear reasoning behind every alert and risk metric.", icon: Shield },
            { title: "Configurable Rules", desc: "Set your own filters, thresholds, and preferences.", icon: Check },
            { title: "Safety-First Limits", desc: "Built-in cooldowns and risk boundaries.", icon: Shield },
            { title: "You Decide", desc: "Tools assist, but you always have the final say.", icon: Check },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Use Scenarios Section
const ScenariosSection = () => {
  const scenarios = [
    { title: "Cross-exchange performance snapshot in minutes", icon: BarChart3 },
    { title: "Telegram alerts filtered by your risk rules", icon: Bell },
    { title: "Position size checks before every trade", icon: Calculator },
    { title: "A structured learning plan for beginners", icon: GraduationCap },
  ];

  return (
    <section className="py-32 border-t border-white/5">
      <div className="container">
        <h2 className="text-3xl font-bold mb-12 text-center">Real World Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {scenarios.map((item, i) => (
            <div key={i} className="group p-8 rounded-2xl bg-card border border-white/5 hover:border-primary/30 transition-all hover:-translate-y-1">
              <item.icon className="w-8 h-8 text-muted-foreground group-hover:text-primary mb-6 transition-colors" />
              <p className="font-medium text-lg leading-snug">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// FAQ Section
const FAQSection = () => {
  const faqs = [
    { q: "What is Cylendra Labs?", a: "Cylendra Labs is an ecosystem of AI-powered tools designed to enhance trading intelligence, risk management, and execution." },
    { q: "Do I need to connect an exchange?", a: "For Orbitra AI, yes (read-only API). For other tools like the Calculator or Learn Bot, no connection is needed." },
    { q: "Which products are live?", a: "Currently, the Portal, Alerts, Calculator, and Learn Bot are live. Orbitra AI is in Beta." },
    { q: "Are Cylendra Alerts financial advice?", a: "No. They are technical signals based on market data. You are responsible for your own trading decisions." },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-32 border-t border-white/5 bg-black/50">
      <div className="container max-w-3xl">
        <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-white/10 rounded-xl bg-card overflow-hidden">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-lg">{faq.q}</span>
                <ChevronDown className={cn("w-5 h-5 transition-transform", openIndex === i ? "rotate-180" : "")} />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6 text-muted-foreground"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Final CTA
const FinalCTA = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="container relative z-10 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-8">Explore the Cylendra ecosystem.</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/products">
            <Button size="lg" className="rounded-full px-10 py-8 text-xl bg-primary text-black hover:bg-primary/90">
              Explore Products
            </Button>
          </Link>
          <a href="mailto:hello@cylendra.com">
            <Button variant="outline" size="lg" className="rounded-full px-10 py-8 text-xl border-white/10 hover:bg-white/5">
              Contact Us
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <CategoryChips />
      <div className="flex flex-col">
        {products.map((product, index) => (
          <FeatureBlock key={product.id} product={product} index={index} />
        ))}
      </div>
      <TransparencySection />
      <ScenariosSection />
      <FAQSection />
      <FinalCTA />
    </div>
  );
}
