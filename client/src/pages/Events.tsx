import { Button } from "@/components/ui/button";
import { events } from "@/lib/events";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Events() {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "UPCOMING":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "COMPLETED":
        return "bg-gray-500/10 text-gray-500 border-gray-500/30";
      default:
        return "bg-white/5 text-muted-foreground border-white/10";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-40 pb-32 overflow-hidden">
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
              <span className="text-xs font-medium text-primary-foreground/80">Latest Updates & Announcements</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl"
            >
              <span className="text-gradient-gold">Events & Updates</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl"
            >
              Stay informed with the latest news, product launches, and insights from the Cylendra ecosystem.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-20 border-t border-white/5">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Link href={`/events/${event.slug}`}>
                  <a className="group h-full flex flex-col rounded-2xl border border-white/10 bg-card/50 hover:border-primary/30 hover:bg-card/80 transition-all duration-300 overflow-hidden hover:-translate-y-1">
                    {/* Image or Icon Placeholder */}
                    <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center overflow-hidden">
                      {event.image ? (
                        <img 
                          src={event.image} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <event.icon className="w-16 h-16 text-primary/40 group-hover:text-primary/60 transition-colors duration-300" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col gap-4 p-6">
                      {/* Status & Date */}
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-xs font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border",
                          getStatusColor(event.status)
                        )}>
                          {event.status}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(event.date)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold tracking-tight leading-tight line-clamp-2">
                        {event.title}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                        {event.shortDescription}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>by {event.author}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.readTime} min read
                        </span>
                      </div>

                      {/* CTA */}
                      <div className="mt-auto flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all duration-300">
                        Read More
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </a>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {events.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No events yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
