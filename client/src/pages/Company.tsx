import { motion } from "framer-motion";
import { Shield, Users, Zap, Target } from "lucide-react";

export default function Company() {
  return (
    <div className="min-h-screen pb-20">
      {/* Hero */}
      <section className="pt-20 pb-16 container text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold mb-6"
        >
          About <span className="text-gradient-gold">Cylendra Labs</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-muted-foreground max-w-2xl mx-auto"
        >
          Building the next generation of AI-powered trading tools for a decentralized world.
        </motion.p>
      </section>

      {/* Mission */}
      <section className="container py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                At Cylendra Labs, we believe that professional-grade market intelligence shouldn't be reserved for institutions. We're democratizing access to advanced trading analytics, automated signals, and risk management tools.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed">
                By combining cutting-edge AI with user-centric design, we empower traders to make data-driven decisions in real-time, removing emotion and guesswork from the equation.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Zap, label: "Speed" },
                { icon: Shield, label: "Security" },
                { icon: Users, label: "Community" },
                { icon: Target, label: "Precision" },
              ].map((item, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors">
                  <item.icon className="w-8 h-8 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="container py-16 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center p-10 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10">
          <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
          <p className="text-muted-foreground mb-8">
            Have questions about our products or want to explore a partnership? We'd love to hear from you.
          </p>
          <a 
            href="mailto:hello@cylendra.com" 
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-black bg-primary hover:bg-primary/90 rounded-full transition-colors shadow-[0_0_20px_rgba(230,179,85,0.2)]"
          >
            hello@cylendra.com
          </a>
        </div>
      </section>
    </div>
  );
}
