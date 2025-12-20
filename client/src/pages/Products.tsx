import { products } from "@/lib/products";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Zap, Bell, BarChart3, GraduationCap, Calculator, Wallet, Coins, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Products() {
  const [filter, setFilter] = useState("All");

  const categories = [
    { name: "All", icon: LayoutGrid },
    { name: "Trading Intelligence", icon: Zap },
    { name: "Alerts & Automation", icon: Bell },
    { name: "Portfolio & Risk", icon: BarChart3 },
    { name: "Learning", icon: GraduationCap },
    { name: "Tools & Calculators", icon: Calculator },
    { name: "DeFi / DEX", icon: Wallet },
    { name: "Token Utility", icon: Coins },
  ];

  // Simple mapping for demo purposes - in a real app, products would have category tags
  const getCategory = (productId: string) => {
    if (productId === "cylendra-portal") return "Trading Intelligence";
    if (productId === "orbitra-ai") return "Portfolio & Risk";
    if (productId === "cylendra-alerts") return "Alerts & Automation";
    if (productId === "cyle-learn-bot") return "Learning";
    if (productId === "cylendra-calculator") return "Tools & Calculators";
    if (productId === "cylendra-hedge-fund") return "Portfolio & Risk";
    if (productId === "cylendra-dex") return "DeFi / DEX";
    if (productId === "cylee-token") return "Token Utility";
    return "All";
  };

  const filteredProducts = filter === "All" 
    ? products 
    : products.filter(p => getCategory(p.id) === filter);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <section className="pt-20 pb-16 container text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold mb-6"
        >
          Cylendra <span className="text-gradient-gold">Products</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Explore our ecosystem of AI-powered tools designed to give you an edge in the market.
        </motion.p>
      </section>

      {/* Filters */}
      <section className="mb-16 container">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setFilter(cat.name)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
                filter === cat.name
                  ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(230,179,85,0.3)]"
                  : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-foreground"
              )}
            >
              <cat.icon className="w-4 h-4" />
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-card border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-primary group-hover:scale-110 transition-transform duration-300">
                    <product.icon className="w-8 h-8" />
                  </div>
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    product.status === "LIVE" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    product.status === "BETA" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                  )}>
                    {product.status.replace("_", " ")}
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-muted-foreground mb-8 flex-grow">{product.oneLiner}</p>

                <div className="flex gap-3 mt-auto">
                  <Link href={`/products/${product.slug}`} className="flex-1">
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">
                      Learn more
                    </Button>
                  </Link>
                  
                  {(product.status === "LIVE" || product.status === "BETA") && product.externalLink ? (
                    <a href={product.externalLink} target="_blank" rel="noopener noreferrer" className="flex-1">
                      <Button className="w-full bg-white/10 hover:bg-white/20 text-foreground border border-white/5">
                        Open <ExternalLink className="w-3 h-3 ml-2" />
                      </Button>
                    </a>
                  ) : (
                    <a href="mailto:hello@cylendra.com" className="flex-1">
                      <Button className="w-full bg-white/10 hover:bg-white/20 text-foreground border border-white/5">
                        Updates <ArrowRight className="w-3 h-3 ml-2" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
