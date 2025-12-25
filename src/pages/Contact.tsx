import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare, MapPin, Phone, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation('contact');
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const socialLinks = [
    {
      name: "Telegram",
      icon: "📱",
      url: "https://t.me/orbitra_ai",
      description: t('info.social.telegram')
    },
    {
      name: "Twitter",
      icon: "🐦",
      url: "https://twitter.com/orbitra_ai",
      description: t('info.social.twitter')
    },
    {
      name: "YouTube",
      icon: "▶️",
      url: "https://youtube.com/@orbitra_ai",
      description: t('info.social.youtube')
    },
    {
      name: "LinkedIn",
      icon: "💼",
      url: "https://linkedin.com/company/cylendra",
      description: t('info.social.linkedin')
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: t('form.messages.success_title'),
        description: t('form.messages.success_desc'),
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
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

      {/* Contact Form & Info */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-3xl">{t('form.title')}</CardTitle>
                  <CardDescription>{t('form.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('form.labels.name')}</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder={t('form.placeholders.name')}
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t('form.labels.email')}</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder={t('form.placeholders.email')}
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('form.labels.subject')}</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder={t('form.placeholders.subject')}
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">{t('form.labels.message')}</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder={t('form.placeholders.message')}
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:opacity-90"
                    >
                      {isSubmitting ? t('form.buttons.sending') : t('form.buttons.send')}
                      <Send className="ml-2 w-4 h-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {/* Quick Contact */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{t('info.quick_contact.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                      <Mail className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{t('info.quick_contact.email')}</p>
                      <a href="mailto:support@orbitra.ai" className="text-sm text-muted-foreground hover:text-purple-400">
                        support@orbitra.ai
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
                      <MessageSquare className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{t('info.quick_contact.live_chat')}</p>
                      <p className="text-sm text-muted-foreground">{t('info.quick_contact.live_chat_desc')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <Phone className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{t('info.quick_contact.phone')}</p>
                      <p className="text-sm text-muted-foreground">+971 4 123 4567</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Office Location */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{t('info.office.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
                      <MapPin className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{t('info.office.company')}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {t('info.office.address')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{t('info.social.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group"
                    >
                      <span className="text-2xl">{social.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold group-hover:text-purple-400 transition-colors">{social.name}</p>
                        <p className="text-xs text-muted-foreground">{social.description}</p>
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">{t('map.title')}</h2>
              <p className="text-xl text-muted-foreground">{t('map.subtitle')}</p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-border/50 bg-secondary/50 h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3613.0989890449706!2d55.15344231501137!3d25.09439598395021!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6b3d3b3b3b3b%3A0x3b3b3b3b3b3b3b3b!2sDubai%20Internet%20City!5e0!3m2!1sen!2sae!4v1234567890123"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Office Location"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center">{t('hours.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6 text-center">
                <div>
                  <p className="font-semibold mb-2">{t('hours.chat_email')}</p>
                  <p className="text-sm text-green-400">{t('hours.chat_email_status')}</p>
                </div>
                <div>
                  <p className="font-semibold mb-2">{t('hours.phone')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('hours.phone_hours')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
