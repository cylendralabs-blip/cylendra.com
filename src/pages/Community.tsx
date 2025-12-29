import { MessageCircle, Users, Trophy, TrendingUp, Star, Quote, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    id: 1,
    name: 'Marcus Johnson',
    role: 'Day Trader',
    avatar: 'https://i.pravatar.cc/150?img=12',
    rating: 5,
    text: 'Orbitra AI has completely transformed my trading strategy. The AI predictions are incredibly accurate and the automated features save me hours every day.',
    profit: '+287%',
    duration: '6 months',
  },
  {
    id: 2,
    name: 'Sarah Williams',
    role: 'Swing Trader',
    avatar: 'https://i.pravatar.cc/150?img=45',
    rating: 5,
    text: 'The risk management tools are exceptional. I can sleep peacefully knowing my portfolio is protected with smart stop-losses and position sizing.',
    profit: '+156%',
    duration: '4 months',
  },
  {
    id: 3,
    name: 'David Chen',
    role: 'Crypto Investor',
    avatar: 'https://i.pravatar.cc/150?img=33',
    rating: 5,
    text: 'Started with zero trading experience. The academy courses and automated trading helped me become profitable within the first month!',
    profit: '+92%',
    duration: '3 months',
  },
];

const successStories = [
  {
    id: 1,
    user: 'Alex K.',
    title: 'From $5,000 to $50,000 in 8 Months',
    story: 'Using DCA strategies and AI-powered signals, I grew my portfolio 10x while learning risk management.',
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=250&fit=crop',
    verified: true,
  },
  {
    id: 2,
    user: 'Jennifer M.',
    title: 'Quit My Job to Trade Full-Time',
    story: 'After consistent profits for 6 months, I made the leap. Orbitra AI gives me the confidence to trade professionally.',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
    verified: true,
  },
  {
    id: 3,
    user: 'Robert T.',
    title: 'Recovered From 60% Loss',
    story: 'The platform helped me understand my mistakes and rebuild my portfolio with proper risk management.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
    verified: true,
  },
];

const stats = [
  { label: 'Active Traders', value: '25,847', icon: Users },
  { label: 'Total Trades', value: '2.4M+', icon: TrendingUp },
  { label: 'Success Rate', value: '78.3%', icon: Trophy },
  { label: 'Community Rating', value: '4.9/5', icon: Star },
];

const Community = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-[hsl(var(--ai-purple))]/10 to-[hsl(var(--ai-cyan))]/10 py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-12 w-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] bg-clip-text text-transparent">
              Trading Community
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Join thousands of successful traders, share strategies, and grow together
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Social Proof Metrics */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Community at a Glance</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="text-center bg-gradient-to-br from-primary/5 to-secondary/5">
                <CardHeader>
                  <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Discord & Telegram Integration */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Join Our Community Channels</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="bg-[#5865F2]/10 border-[#5865F2]/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-[#5865F2]">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Discord Community</CardTitle>
                    <CardDescription>Real-time discussions & support</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ 24/7 trading signals channel</li>
                  <li>✓ Strategy discussions & tips</li>
                  <li>✓ Live market analysis</li>
                  <li>✓ Expert Q&A sessions</li>
                </ul>
                <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4]">
                  Join Discord Server
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#0088cc]/10 border-[#0088cc]/20 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-[#0088cc]">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Telegram Group</CardTitle>
                    <CardDescription>Instant alerts & updates</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Instant trade notifications</li>
                  <li>✓ Market news & updates</li>
                  <li>✓ Community polls & votes</li>
                  <li>✓ Exclusive announcements</li>
                </ul>
                <Button className="w-full bg-[#0088cc] hover:bg-[#006699]">
                  Join Telegram Group
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* User Testimonials */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">What Traders Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="relative">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarImage src={testimonial.avatar} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{testimonial.text}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      {testimonial.profit} profit
                    </Badge>
                    <span className="text-xs text-muted-foreground">{testimonial.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Success Stories */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Success Stories</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {successStories.map((story) => (
              <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={story.image} 
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                  {story.verified && (
                    <Badge className="absolute top-3 right-3 bg-green-500">
                      Verified
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{story.title}</CardTitle>
                  <CardDescription className="text-xs">by {story.user}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{story.story}</p>
                  <Button variant="link" className="mt-3 px-0">
                    Read Full Story →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-12">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-secondary/10">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Join Our Community?</CardTitle>
              <CardDescription>
                Start your trading journey with thousands of successful traders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button size="lg" className="bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))]">
                Get Started Free
              </Button>
              <p className="text-xs text-muted-foreground">
                No credit card required • 7-day free trial
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Community;
