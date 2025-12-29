import { useState } from 'react';
import { Search, Calendar, User, ArrowRight, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const categories = ['All', 'Trading Strategies', 'Market Analysis', 'Risk Management', 'Technical Analysis', 'News'];

const articles = [
  {
    id: 1,
    title: 'Understanding LSTM Neural Networks in Algorithmic Trading',
    excerpt: 'Deep dive into how Long Short-Term Memory networks predict market movements with unprecedented accuracy.',
    category: 'Technical Analysis',
    author: 'Dr. Sarah Chen',
    date: '2025-11-15',
    readTime: '8 min',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
    featured: true,
  },
  {
    id: 2,
    title: 'DCA Strategies: Maximizing Returns in Volatile Markets',
    excerpt: 'Learn how Dollar Cost Averaging can protect your portfolio during market downturns.',
    category: 'Trading Strategies',
    author: 'Michael Torres',
    date: '2025-11-12',
    readTime: '6 min',
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=400&fit=crop',
    featured: true,
  },
  {
    id: 3,
    title: 'Risk Management: The Key to Long-Term Success',
    excerpt: 'Discover essential risk management principles that separate successful traders from the rest.',
    category: 'Risk Management',
    author: 'Jennifer Blake',
    date: '2025-11-10',
    readTime: '10 min',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    featured: false,
  },
  {
    id: 4,
    title: 'Crypto Market Trends: November 2025 Analysis',
    excerpt: 'Comprehensive analysis of current market conditions and predictions for the coming month.',
    category: 'Market Analysis',
    author: 'Alex Kumar',
    date: '2025-11-08',
    readTime: '12 min',
    image: 'https://images.unsplash.com/photo-1642543492950-e1e4c4697046?w=800&h=400&fit=crop',
    featured: false,
  },
  {
    id: 5,
    title: 'Grid Trading Strategies Explained',
    excerpt: 'Master grid trading techniques to profit from market volatility.',
    category: 'Trading Strategies',
    author: 'David Park',
    date: '2025-11-05',
    readTime: '7 min',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=400&fit=crop',
    featured: false,
  },
  {
    id: 6,
    title: 'Breaking: New Exchange Integrations Coming Soon',
    excerpt: 'Orbitra AI announces upcoming support for additional major exchanges.',
    category: 'News',
    author: 'Editorial Team',
    date: '2025-11-03',
    readTime: '3 min',
    image: 'https://images.unsplash.com/photo-1642543348745-03efebb95da9?w=800&h=400&fit=crop',
    featured: false,
  },
];

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 6;

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = filteredArticles.filter(a => a.featured);
  const regularArticles = filteredArticles.filter(a => !a.featured);

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = regularArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(regularArticles.length / articlesPerPage);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-[hsl(var(--ai-purple))]/10 to-[hsl(var(--ai-cyan))]/10 py-20">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] bg-clip-text text-transparent">
            Trading Insights & News
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Expert analysis, market insights, and educational content to elevate your trading journey
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(category)}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-foreground">Featured Articles</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredArticles.map((article) => (
                <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{article.category}</Badge>
                      <span className="text-xs text-muted-foreground">{article.readTime} read</span>
                    </div>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{article.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(article.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Link to={`/blog/${article.id}`}>
                        <Button variant="ghost" size="sm" className="group/btn">
                          Read More
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Articles Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Latest Articles</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentArticles.map((article) => (
              <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {article.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{article.readTime}</span>
                  </div>
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">
                    {article.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{article.author}</span>
                    <span>{new Date(article.date).toLocaleDateString()}</span>
                  </div>
                  <Link to={`/blog/${article.id}`}>
                    <Button variant="outline" size="sm" className="w-full group/btn">
                      Read Article
                      <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
