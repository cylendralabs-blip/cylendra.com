import { useState } from 'react';
import { GraduationCap, Play, CheckCircle, Lock, Award, TrendingUp, BookOpen, Video } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const courses = [
  {
    id: 1,
    title: 'Cryptocurrency Trading Fundamentals',
    description: 'Master the basics of cryptocurrency trading, from market analysis to order execution.',
    level: 'Beginner',
    duration: '4 hours',
    lessons: 12,
    completed: 8,
    progress: 67,
    instructor: 'Dr. Sarah Chen',
    rating: 4.9,
    students: 2847,
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=250&fit=crop',
  },
  {
    id: 2,
    title: 'Advanced Technical Analysis',
    description: 'Deep dive into chart patterns, indicators, and predictive analytics for professional trading.',
    level: 'Advanced',
    duration: '8 hours',
    lessons: 24,
    completed: 0,
    progress: 0,
    instructor: 'Michael Torres',
    rating: 4.8,
    students: 1523,
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=250&fit=crop',
  },
  {
    id: 3,
    title: 'Risk Management & Portfolio Strategy',
    description: 'Learn to protect your capital and optimize returns with proven risk management techniques.',
    level: 'Intermediate',
    duration: '6 hours',
    lessons: 18,
    completed: 18,
    progress: 100,
    instructor: 'Jennifer Blake',
    rating: 5.0,
    students: 3241,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
  },
  {
    id: 4,
    title: 'Algorithmic Trading with AI',
    description: 'Understanding neural networks, LSTM models, and how AI makes trading decisions.',
    level: 'Advanced',
    duration: '10 hours',
    lessons: 30,
    completed: 15,
    progress: 50,
    instructor: 'Dr. Alex Kumar',
    rating: 4.9,
    students: 987,
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
  },
];

const certifications = [
  {
    id: 1,
    name: 'Certified Crypto Trader',
    description: 'Complete beginner and intermediate courses',
    earned: true,
    date: '2025-10-15',
  },
  {
    id: 2,
    name: 'Risk Management Expert',
    description: 'Master risk management strategies',
    earned: true,
    date: '2025-11-01',
  },
  {
    id: 3,
    name: 'AI Trading Specialist',
    description: 'Complete algorithmic trading course',
    earned: false,
    date: null,
  },
  {
    id: 4,
    name: 'Trading Master',
    description: 'Complete all courses with 90%+ scores',
    earned: false,
    date: null,
  },
];

const TradingAcademy = () => {
  const [selectedLevel, setSelectedLevel] = useState('All');
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCourses = selectedLevel === 'All' 
    ? courses 
    : courses.filter(c => c.level === selectedLevel);

  const totalProgress = Math.round(
    courses.reduce((acc, course) => acc + course.progress, 0) / courses.length
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-[hsl(var(--ai-purple))]/10 to-[hsl(var(--ai-cyan))]/10 py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="h-12 w-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[hsl(var(--ai-purple))] to-[hsl(var(--ai-cyan))] bg-clip-text text-transparent">
              Trading Academy
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Master cryptocurrency trading with expert-led courses, interactive tutorials, and earn certifications
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Overall Progress Dashboard */}
        <Card className="mb-8 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Overall Progress</p>
                <div className="flex items-center gap-3">
                  <Progress value={totalProgress} className="flex-1" />
                  <span className="text-2xl font-bold text-primary">{totalProgress}%</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{courses.length}</p>
                <p className="text-sm text-muted-foreground">Courses Enrolled</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {courses.filter(c => c.progress === 100).length}
                </p>
                <p className="text-sm text-muted-foreground">Courses Completed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {certifications.filter(c => c.earned).length}
                </p>
                <p className="text-sm text-muted-foreground">Certifications Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Video className="h-4 w-4 mr-2" />
              Video Library
            </TabsTrigger>
            <TabsTrigger value="certifications">
              <Award className="h-4 w-4 mr-2" />
              Certifications
            </TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {levels.map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? 'default' : 'outline'}
                  onClick={() => setSelectedLevel(level)}
                  size="sm"
                >
                  {level}
                </Button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={course.image} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-4 left-4" variant={
                      course.level === 'Beginner' ? 'secondary' : 
                      course.level === 'Intermediate' ? 'default' : 'destructive'
                    }>
                      {course.level}
                    </Badge>
                    {course.progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2">
                        <div className="flex items-center gap-2">
                          <Progress value={course.progress} className="flex-1" />
                          <span className="text-xs font-medium">{course.progress}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{course.instructor}</span>
                      <span>⭐ {course.rating} ({course.students.toLocaleString()})</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{course.lessons} lessons</span>
                      <span>{course.duration}</span>
                    </div>
                    <Button className="w-full" variant={course.progress > 0 ? 'default' : 'outline'}>
                      {course.progress === 0 ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Start Course
                        </>
                      ) : course.progress === 100 ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Review Course
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Continue Learning
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Video Library Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="relative h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Play className="h-12 w-12 text-primary group-hover:scale-110 transition-transform" />
                    <Badge className="absolute top-2 right-2">12:34</Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base">Tutorial Video {i}</CardTitle>
                    <CardDescription className="text-sm">
                      Learn key concepts with hands-on examples
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {certifications.map((cert) => (
                <Card key={cert.id} className={`${cert.earned ? 'border-primary bg-primary/5' : 'opacity-60'}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${cert.earned ? 'bg-primary/10' : 'bg-muted'}`}>
                          {cert.earned ? (
                            <Award className="h-6 w-6 text-primary" />
                          ) : (
                            <Lock className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{cert.name}</CardTitle>
                          <CardDescription>{cert.description}</CardDescription>
                        </div>
                      </div>
                      {cert.earned && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Earned
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  {cert.earned && cert.date && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Earned on {new Date(cert.date).toLocaleDateString()}
                      </p>
                      <Button variant="outline" size="sm" className="mt-3">
                        Download Certificate
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TradingAcademy;
