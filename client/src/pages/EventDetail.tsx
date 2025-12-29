import { events } from "@/lib/events";
import { useRoute } from "wouter";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ReactMarkdown from "react-markdown";

export default function EventDetail() {
  const [match, params] = useRoute("/events/:slug");

  if (!match) return null;

  const event = events.find(e => e.slug === params?.slug);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Event not found</h1>
          <p className="text-muted-foreground mb-8">The event you're looking for doesn't exist.</p>
          <Link href="/events">
            <Button className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section with Image */}
      <section className="relative pt-32 pb-12 overflow-hidden border-b border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container relative z-10">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link href="/events">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Events
              </Button>
            </Link>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/20 to-transparent h-96 flex items-center justify-center overflow-hidden mb-12"
          >
            {event.image ? (
              <img 
                src={event.image} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <event.icon className="w-32 h-32 text-primary/30" />
            )}
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl mx-auto"
          >
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className={`text-xs font-medium uppercase tracking-wider px-3 py-1 rounded-full border ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {formatDate(event.date)}
              </span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {event.readTime} min read
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
              {event.title}
            </h1>

            {/* Author */}
            <div className="flex items-center justify-between py-6 border-y border-white/10">
              <p className="text-muted-foreground">By <span className="text-foreground font-semibold">{event.author}</span></p>
              <Button variant="ghost" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="prose prose-invert max-w-none"
          >
            <div className="text-foreground space-y-6">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-8 mb-4 text-primary" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-6 mb-3" {...props} />,
                  p: ({node, ...props}) => <p className="text-muted-foreground leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 text-muted-foreground" {...props} />,
                  li: ({node, ...props}) => <li className="ml-4" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-foreground font-semibold" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-muted-foreground" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary pl-4 py-2 italic text-muted-foreground my-4" {...props} />,
                  code: ({node, ...props}) => <code className="bg-white/5 px-2 py-1 rounded text-sm font-mono" {...props} />,
                  hr: ({node, ...props}) => <hr className="my-8 border-white/10" {...props} />,
                }}
              >
                {event.content}
              </ReactMarkdown>
            </div>
          </motion.div>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 pt-8 border-t border-white/10"
          >
            <p className="text-sm text-muted-foreground mb-4">Tags:</p>
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground hover:text-primary transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 pt-8 border-t border-white/10"
          >
            <Link href="/events">
              <Button className="rounded-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to All Events
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
