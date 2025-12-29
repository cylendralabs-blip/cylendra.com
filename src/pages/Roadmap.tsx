import { useState } from 'react';
import { CheckCircle, Clock, Rocket, Sparkles, ThumbsUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const roadmapItems = {
  completed: [
    {
      id: 1,
      title: 'Multi-Exchange Support',
      description: 'Integrated Binance, OKX, Bybit, and KuCoin with unified API',
      quarter: 'Q4 2024',
      votes: 1247,
      status: 'completed',
    },
    {
      id: 2,
      title: 'LSTM Neural Network Integration',
      description: 'Advanced AI predictions using Long Short-Term Memory networks',
      quarter: 'Q4 2024',
      votes: 2134,
      status: 'completed',
    },
    {
      id: 3,
      title: 'Advanced Risk Management',
      description: 'Portfolio analysis, VaR calculations, and stress testing',
      quarter: 'Q1 2025',
      votes: 1876,
      status: 'completed',
    },
    {
      id: 4,
      title: 'Mobile-Optimized Interface',
      description: 'Responsive design with touch-friendly controls',
      quarter: 'Q1 2025',
      votes: 1543,
      status: 'completed',
    },
  ],
  inProgress: [
    {
      id: 5,
      title: 'Social Trading Features',
      description: 'Follow top traders, copy strategies, and compete on leaderboards',
      quarter: 'Q4 2025',
      votes: 2847,
      status: 'in-progress',
      progress: 65,
    },
    {
      id: 6,
      title: 'Advanced Backtesting Engine',
      description: 'Test strategies against historical data with ML optimization',
      quarter: 'Q4 2025',
      votes: 2234,
      status: 'in-progress',
      progress: 80,
    },
    {
      id: 7,
      title: 'Options Trading Support',
      description: 'Add crypto options trading with Greeks analysis',
      quarter: 'Q1 2026',
      votes: 1654,
      status: 'in-progress',
      progress: 35,
    },
  ],
  planned: [
    {
      id: 8,
      title: 'Decentralized Exchange Integration',
      description: 'Support for Uniswap, PancakeSwap, and other DEXs',
      quarter: 'Q1 2026',
      votes: 3124,
      status: 'planned',
    },
    {
      id: 9,
      title: 'NFT Portfolio Tracking',
      description: 'Track and analyze NFT holdings across multiple chains',
      quarter: 'Q2 2026',
      votes: 1876,
      status: 'planned',
    },
    {
      id: 10,
      title: 'On-Chain Analytics',
      description: 'Blockchain data analysis and whale tracking',
      quarter: 'Q2 2026',
      votes: 2543,
      status: 'planned',
    },
    {
      id: 11,
      title: 'AI Portfolio Rebalancing',
      description: 'Automated portfolio optimization based on market conditions',
      quarter: 'Q2 2026',
      votes: 2987,
      status: 'planned',
    },
    {
      id: 12,
      title: 'Custom AI Model Training',
      description: 'Train personalized AI models on your trading history',
      quarter: 'Q3 2026',
      votes: 3456,
      status: 'planned',
    },
    {
      id: 13,
      title: 'Multi-Language Support',
      description: 'Platform available in 15+ languages',
      quarter: 'Q3 2026',
      votes: 1234,
      status: 'planned',
    },
  ],
};

const Roadmap = () => {
  const [votedItems, setVotedItems] = useState<number[]>([]);

  const handleVote = (id: number) => {
    if (!votedItems.includes(id)) {
      setVotedItems([...votedItems, id]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-primary" />;
      case 'planned':
        return <Rocket className="h-5 w-5 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'in-progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'planned':
        return <Badge variant="secondary">Planned</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-[hsl(var(--ai-purple))]/10 to-[hsl(var(--ai-cyan))]/10 py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-12 w-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] bg-clip-text text-transparent">
              Product Roadmap
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            See what we've built, what we're working on, and what's coming next. Vote for features you want!
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-green-500/10 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-foreground">{roadmapItems.completed.length}</p>
              <p className="text-sm text-muted-foreground">Features Delivered</p>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-foreground">{roadmapItems.inProgress.length}</p>
              <p className="text-sm text-muted-foreground">Currently Building</p>
            </CardContent>
          </Card>
          
          <Card className="bg-secondary/10 border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Rocket className="h-5 w-5" />
                Planned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-foreground">{roadmapItems.planned.length}</p>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="planned">Planned</TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="space-y-12">
            {/* Completed Section */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Completed Features
              </h2>
              <div className="space-y-4">
                {roadmapItems.completed.map((item) => (
                  <Card key={item.id} className="border-green-500/20 bg-green-500/5">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(item.status)}
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                          </div>
                          <CardDescription>{item.description}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(item.status)}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {item.quarter}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        {item.votes.toLocaleString()} votes
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* In Progress Section */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                In Development
              </h2>
              <div className="space-y-4">
                {roadmapItems.inProgress.map((item) => (
                  <Card key={item.id} className="border-primary/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(item.status)}
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                          </div>
                          <CardDescription>{item.description}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(item.status)}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {item.quarter}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Progress value={item.progress} className="flex-1" />
                        <span className="text-sm font-medium text-primary">{item.progress}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        {item.votes.toLocaleString()} votes
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Planned Section */}
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Rocket className="h-6 w-6 text-muted-foreground" />
                Planned Features
              </h2>
              <div className="space-y-4">
                {roadmapItems.planned.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(item.status)}
                            <CardTitle className="text-lg">{item.title}</CardTitle>
                          </div>
                          <CardDescription>{item.description}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(item.status)}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {item.quarter}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ThumbsUp className="h-4 w-4" />
                          {item.votes.toLocaleString()} votes
                        </div>
                        <Button
                          variant={votedItems.includes(item.id) ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => handleVote(item.id)}
                          disabled={votedItems.includes(item.id)}
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          {votedItems.includes(item.id) ? 'Voted' : 'Vote'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          {/* Individual Category Tabs */}
          <TabsContent value="completed" className="space-y-4">
            {roadmapItems.completed.map((item) => (
              <Card key={item.id} className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(item.status)}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(item.status)}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {item.quarter}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            {roadmapItems.inProgress.map((item) => (
              <Card key={item.id} className="border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(item.status)}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(item.status)}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {item.quarter}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Progress value={item.progress} className="flex-1" />
                    <span className="text-sm font-medium text-primary">{item.progress}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="planned" className="space-y-4">
            {roadmapItems.planned.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(item.status)}
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(item.status)}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {item.quarter}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ThumbsUp className="h-4 w-4" />
                      {item.votes.toLocaleString()} votes
                    </div>
                    <Button
                      variant={votedItems.includes(item.id) ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => handleVote(item.id)}
                      disabled={votedItems.includes(item.id)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      {votedItems.includes(item.id) ? 'Voted' : 'Vote'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Roadmap;
