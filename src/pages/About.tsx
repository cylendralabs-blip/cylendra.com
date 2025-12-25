import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Target, Eye, Users, Award, Lock, Zap, TrendingUp } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation('about');

  const team = [
    {
      name: t('team.member1.name'),
      role: t('team.member1.role'),
      avatar: "AA",
      bio: t('team.member1.bio'),
      gradient: "from-purple-500 to-blue-500"
    },
    {
      name: t('team.member2.name'),
      role: t('team.member2.role'),
      avatar: "SC",
      bio: t('team.member2.bio'),
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: t('team.member3.name'),
      role: t('team.member3.role'),
      avatar: "MR",
      bio: t('team.member3.bio'),
      gradient: "from-cyan-500 to-purple-500"
    },
    {
      name: t('team.member4.name'),
      role: t('team.member4.role'),
      avatar: "FH",
      bio: t('team.member4.bio'),
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  const timeline = [
    { year: "2020", event: t('journey.step1.event'), description: t('journey.step1.description') },
    { year: "2021", event: t('journey.step2.event'), description: t('journey.step2.description') },
    { year: "2022", event: t('journey.step3.event'), description: t('journey.step3.description') },
    { year: "2023", event: t('journey.step4.event'), description: t('journey.step4.description') },
    { year: "2024", event: t('journey.step5.event'), description: t('journey.step5.description') },
  ];

  const certifications = [
    { name: "ISO 27001", description: t('security.iso'), icon: Shield },
    { name: "SOC 2 Type II", description: t('security.soc'), icon: Lock },
    { name: "PCI DSS", description: t('security.pci'), icon: Award },
    { name: "GDPR Compliant", description: t('security.gdpr'), icon: Shield },
  ];

  const values = [
    {
      icon: Target,
      title: t('values.innovation.title'),
      description: t('values.innovation.description')
    },
    {
      icon: Shield,
      title: t('values.security.title'),
      description: t('values.security.description')
    },
    {
      icon: Users,
      title: t('values.community.title'),
      description: t('values.community.description')
    },
    {
      icon: Zap,
      title: t('values.performance.title'),
      description: t('values.performance.description')
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 pt-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0">
              {t('hero.badge')}
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-3xl">{t('story.title')}</CardTitle>
                <CardDescription>{t('story.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                <p>{t('story.p1')}</p>
                <p>{t('story.p2')}</p>
                <p>{t('story.p3')}</p>
                <p className="font-semibold text-foreground">{t('story.footer')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                    <Target className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl">{t('mission.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{t('mission.description')}</p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 text-white">
                    <Eye className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-2xl">{t('vision.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{t('vision.description')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('values.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('values.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
                <CardContent className="pt-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 w-fit mb-4">
                    <value.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('team.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('team.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {team.map((member, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:scale-105 transition-transform">
                <CardContent className="pt-6 text-center">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4`}>
                    {member.avatar}
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-sm text-purple-400 mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('journey.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('journey.subtitle')}</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0">
                      {item.year.slice(2)}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-gradient-to-b from-purple-500 to-cyan-500 mt-2" style={{ minHeight: '60px' }} />
                    )}
                  </div>
                  <Card className="flex-1 border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                          {item.year}
                        </Badge>
                        <CardTitle className="text-xl">{item.event}</CardTitle>
                      </div>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security & Certifications */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">{t('security.title')}</h2>
            <p className="text-xl text-muted-foreground">{t('security.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {certifications.map((cert, index) => (
              <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm text-center">
                <CardContent className="pt-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 w-fit mx-auto mb-4">
                    <cert.icon className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{cert.name}</h3>
                  <p className="text-sm text-muted-foreground">{cert.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Powered By */}
      <section className="py-12 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">{t('footer.developed_by')}</p>
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            {t('footer.company')}
          </div>
        </div>
      </section>
    </div>
  );
}
