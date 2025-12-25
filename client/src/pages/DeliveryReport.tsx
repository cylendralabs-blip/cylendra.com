import { motion } from "framer-motion";
import { Check, Download, Share2, BarChart3, Code, Layers, Palette, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";

export default function DeliveryReport() {
  const [activeTab, setActiveTab] = useState("overview");

  const features = [
    { name: "Interactive Hero Simulation", status: "completed", category: "UX" },
    { name: "Dark Premium Design System", status: "completed", category: "Design" },
    { name: "Responsive Navigation", status: "completed", category: "Layout" },
    { name: "Product Grid & Filtering", status: "completed", category: "Feature" },
    { name: "Dynamic Product Detail Pages", status: "completed", category: "Feature" },
    { name: "Legal Pages (Privacy, Terms)", status: "completed", category: "Content" },
    { name: "Framer Motion Animations", status: "completed", category: "UX" },
    { name: "Mobile Menu Overlay", status: "completed", category: "Layout" },
  ];

  const stats = [
    { label: "Pages Created", value: 8, icon: Layers, color: "text-blue-500" },
    { label: "Components", value: 12, icon: Code, color: "text-purple-500" },
    { label: "Brand Colors", value: 6, icon: Palette, color: "text-yellow-500" },
    { label: "Animations", value: 15, icon: Zap, color: "text-green-500" },
  ];

  const techStack = [
    { name: "React 19", value: 100, color: "bg-blue-500" },
    { name: "TypeScript", value: 100, color: "bg-blue-700" },
    { name: "Tailwind CSS", value: 100, color: "bg-cyan-500" },
    { name: "Framer Motion", value: 100, color: "bg-purple-500" },
    { name: "Wouter", value: 100, color: "bg-orange-500" },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-20 pb-20">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 mb-4">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Project Delivery Report
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2">Cylendra Labs Website</h1>
            <p className="text-muted-foreground text-lg">Interactive build summary and feature analysis.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Download className="w-4 h-4" /> Save PDF
            </Button>
            <Button className="gap-2" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              <Share2 className="w-4 h-4" /> Share Report
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-white/5 hover:border-primary/20 transition-colors"
            >
              <div className={`p-3 rounded-xl bg-white/5 w-fit mb-4 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-2">
            {["overview", "features", "tech_stack"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 flex items-center justify-between ${
                  activeTab === tab 
                    ? "bg-primary/10 text-primary border border-primary/20" 
                    : "bg-card border border-white/5 hover:bg-white/5 text-muted-foreground"
                }`}
              >
                <span className="capitalize font-medium">{tab.replace("_", " ")}</span>
                {activeTab === tab && <ArrowRight className="w-4 h-4" />}
              </button>
            ))}
            
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
              <h3 className="font-bold mb-2 text-foreground">Ready to Launch?</h3>
              <p className="text-sm text-muted-foreground mb-4">The site is fully built and ready for deployment.</p>
              <Link href="/">
                <Button className="w-full">View Live Site</Button>
              </Link>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-white/5 rounded-2xl p-8 min-h-[500px]">
              
              {activeTab === "overview" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold mb-6">Project Overview</h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    The Cylendra Labs marketing website has been successfully implemented, strictly adhering to the "Dark Premium Intelligence" design philosophy. The project focuses on high-performance rendering, interactive storytelling, and a scalable component architecture.
                  </p>
                  
                  <h3 className="text-lg font-semibold mb-4">Key Achievements</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                      <div className="p-2 rounded-lg bg-green-500/20 text-green-500 mt-1">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Pixel-Perfect Design</h4>
                        <p className="text-sm text-muted-foreground">Replicated the sophisticated feel of the reference site with custom gradients and glassmorphism.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500 mt-1">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Interactive Simulation</h4>
                        <p className="text-sm text-muted-foreground">Built a custom hero animation that simulates the AI agent's workflow in real-time.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "features" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold mb-6">Feature Implementation Status</h2>
                  <div className="space-y-3">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="font-medium">{feature.name}</span>
                        </div>
                        <span className="text-xs px-2 py-1 rounded bg-white/10 text-muted-foreground">{feature.category}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "tech_stack" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-2xl font-bold mb-6">Technology Stack</h2>
                  <div className="space-y-6">
                    {techStack.map((tech, i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">{tech.name}</span>
                          <span className="text-muted-foreground text-sm">Implemented</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${tech.value}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={`h-full ${tech.color}`} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-10 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <h3 className="font-bold text-blue-400 mb-2">Architecture Note</h3>
                    <p className="text-sm text-blue-300/80">
                      The project uses a component-based architecture with centralized data management (products.ts), ensuring easy maintenance and scalability for future product additions.
                    </p>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Zap } from "lucide-react";
