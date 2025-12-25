import { products } from "@/lib/products";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Check, ChevronLeft, Shield, Zap, Users, Layers } from "lucide-react";
import NotFound from "./NotFound";

export default function ProductDetail() {
  const [match, params] = useRoute("/products/:slug");
  const product = products.find(p => p.slug === params?.slug);

  if (!product) return <NotFound />;

  return (
    <div className="min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="container pt-8 pb-4">
        <Link href="/products">
          <a className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Products
          </a>
        </Link>
      </div>

      {/* Hero */}
      <section className="container py-12 md:py-20">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          <div className="flex-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6"
            >
              <div className="p-1 rounded bg-primary/20 text-primary">
                <product.icon className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-foreground">{product.name}</span>
              <span className="w-1 h-1 rounded-full bg-white/20 mx-1" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{product.status.replace("_", " ")}</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              {product.valueProp}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground mb-10 leading-relaxed"
            >
              {product.description}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              {(product.status === "LIVE" || product.status === "BETA") && product.externalLink ? (
                <a href={product.externalLink} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="rounded-full px-8 bg-primary text-black hover:bg-primary/90 font-semibold text-lg h-14 shadow-[0_0_30px_rgba(230,179,85,0.2)]">
                    Open {product.name.split(" ")[1] || "App"} <ExternalLink className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              ) : (
                <a href="mailto:hello@cylendra.com?subject=Updates">
                  <Button size="lg" className="rounded-full px-8 bg-primary text-black hover:bg-primary/90 font-semibold text-lg h-14 shadow-[0_0_30px_rgba(230,179,85,0.2)]">
                    Get Updates <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              )}
            </motion.div>
          </div>

          {/* Visual Side */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex-1 w-full"
          >
            <div className="aspect-square md:aspect-[4/3] rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              
              <product.icon className="w-40 h-40 text-primary/20 group-hover:text-primary/40 transition-all duration-700 transform group-hover:scale-110" />
              
              {/* Floating Badge */}
              <div className="absolute bottom-8 right-8 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${product.status === 'LIVE' ? 'bg-green-500' : product.status === 'BETA' ? 'bg-blue-500' : 'bg-yellow-500'} animate-pulse`} />
                <span className="text-xs font-mono text-muted-foreground">System Status: {product.status}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Details Grid */}
      <section className="container py-16 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Features */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> Key Features
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-colors">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Ecosystem Integration
              </h2>
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <p className="text-lg text-foreground/90 leading-relaxed">
                  {product.integration}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Who is it for?
              </h2>
              <ul className="space-y-3">
                {product.whoIsItFor.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8 border-t border-white/5">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" /> FAQ
              </h2>
              <div className="space-y-4">
                {product.faq.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <h3 className="font-medium text-foreground text-sm">{item.question}</h3>
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
