import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Network, TrendingUp, Zap, GitBranch, Target, ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function AITechnology() {
  const { t } = useTranslation('ai_technology');

  const technologies = [
    {
      id: "neural-networks",
      icon: Network,
      title: t('technologies.neural_networks.title'),
      subtitle: t('technologies.neural_networks.subtitle'),
      gradient: "from-purple-500 to-blue-500",
      description: t('technologies.neural_networks.description'),
      details: [
        {
          title: t('technologies.neural_networks.input_layer.title'),
          description: t('technologies.neural_networks.input_layer.description'),
          icon: "📥"
        },
        {
          title: t('technologies.neural_networks.hidden_layers.title'),
          description: t('technologies.neural_networks.hidden_layers.description'),
          icon: "🧠"
        },
        {
          title: t('technologies.neural_networks.output_layer.title'),
          description: t('technologies.neural_networks.output_layer.description'),
          icon: "📤"
        }
      ],
      architecture: {
        layers: t('technologies.neural_networks.architecture.layers'),
        neurons: t('technologies.neural_networks.architecture.neurons'),
        parameters: t('technologies.neural_networks.architecture.parameters'),
        activation: t('technologies.neural_networks.architecture.activation')
      }
    },
    {
      id: "lstm-transformers",
      icon: Brain,
      title: t('technologies.lstm_transformers.title'),
      subtitle: t('technologies.lstm_transformers.subtitle'),
      gradient: "from-blue-500 to-cyan-500",
      description: t('technologies.lstm_transformers.description'),
      details: [
        {
          title: t('technologies.lstm_transformers.lstm_networks.title'),
          description: t('technologies.lstm_transformers.lstm_networks.description'),
          icon: "🔄"
        },
        {
          title: t('technologies.lstm_transformers.attention_mechanism.title'),
          description: t('technologies.lstm_transformers.attention_mechanism.description'),
          icon: "🎯"
        },
        {
          title: t('technologies.lstm_transformers.contextual_understanding.title'),
          description: t('technologies.lstm_transformers.contextual_understanding.description'),
          icon: "🔗"
        }
      ],
      architecture: {
        layers: t('technologies.lstm_transformers.architecture.layers'),
        sequence: t('technologies.lstm_transformers.architecture.sequence'),
        attention: t('technologies.lstm_transformers.architecture.attention'),
        memory: t('technologies.lstm_transformers.architecture.memory')
      }
    },
    {
      id: "pipeline",
      icon: GitBranch,
      title: t('technologies.pipeline.title'),
      subtitle: t('technologies.pipeline.subtitle'),
      gradient: "from-cyan-500 to-purple-500",
      description: t('technologies.pipeline.description'),
      details: [
        {
          title: t('technologies.pipeline.data_collection.title'),
          description: t('technologies.pipeline.data_collection.description'),
          icon: "📡"
        },
        {
          title: t('technologies.pipeline.feature_engineering.title'),
          description: t('technologies.pipeline.feature_engineering.description'),
          icon: "⚙️"
        },
        {
          title: t('technologies.pipeline.model_ensemble.title'),
          description: t('technologies.pipeline.model_ensemble.description'),
          icon: "🎭"
        },
        {
          title: t('technologies.pipeline.risk_assessment.title'),
          description: t('technologies.pipeline.risk_assessment.description'),
          icon: "🛡️"
        },
        {
          title: t('technologies.pipeline.execution_engine.title'),
          description: t('technologies.pipeline.execution_engine.description'),
          icon: "⚡"
        }
      ],
      metrics: {
        latency: t('technologies.pipeline.metrics.latency'),
        throughput: t('technologies.pipeline.metrics.throughput'),
        uptime: t('technologies.pipeline.metrics.uptime'),
        accuracy: t('technologies.pipeline.metrics.accuracy')
      }
    },
    {
      id: "decision-making",
      icon: Target,
      title: t('technologies.decision_making.title'),
      subtitle: t('technologies.decision_making.subtitle'),
      gradient: "from-purple-500 to-pink-500",
      description: t('technologies.decision_making.description'),
      details: [
        {
          title: t('technologies.decision_making.signal_generation.title'),
          description: t('technologies.decision_making.signal_generation.description'),
          icon: "📊"
        },
        {
          title: t('technologies.decision_making.confidence_scoring.title'),
          description: t('technologies.decision_making.confidence_scoring.description'),
          icon: "💯"
        },
        {
          title: t('technologies.decision_making.risk_evaluation.title'),
          description: t('technologies.decision_making.risk_evaluation.description'),
          icon: "⚖️"
        },
        {
          title: t('technologies.decision_making.market_context.title'),
          description: t('technologies.decision_making.market_context.description'),
          icon: "🌐"
        },
        {
          title: t('technologies.decision_making.execution_decision.title'),
          description: t('technologies.decision_making.execution_decision.description'),
          icon: "✅"
        }
      ],
      decisionTree: [
        { step: t('technologies.decision_making.decision_flow.step1'), check: t('technologies.decision_making.decision_flow.check1') },
        { step: t('technologies.decision_making.decision_flow.step2'), check: t('technologies.decision_making.decision_flow.check2') },
        { step: t('technologies.decision_making.decision_flow.step3'), check: t('technologies.decision_making.decision_flow.check3') },
        { step: t('technologies.decision_making.decision_flow.step4'), check: t('technologies.decision_making.decision_flow.check4') },
        { step: t('technologies.decision_making.decision_flow.step5'), check: t('technologies.decision_making.decision_flow.check5') },
        { step: t('technologies.decision_making.decision_flow.step6'), check: t('technologies.decision_making.decision_flow.check6') }
      ]
    }
  ];

  const advantages = [
    {
      title: t('advantages.emotion_free.title'),
      description: t('advantages.emotion_free.description'),
      icon: CheckCircle2,
      color: "text-green-400"
    },
    {
      title: t('advantages.monitoring.title'),
      description: t('advantages.monitoring.description'),
      icon: CheckCircle2,
      color: "text-blue-400"
    },
    {
      title: t('advantages.speed.title'),
      description: t('advantages.speed.description'),
      icon: CheckCircle2,
      color: "text-purple-400"
    },
    {
      title: t('advantages.learning.title'),
      description: t('advantages.learning.description'),
      icon: CheckCircle2,
      color: "text-cyan-400"
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
            <p className="text-xl text-muted-foreground mb-8">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Technology Deep Dives */}
      {technologies.map((tech, index) => (
        <section key={tech.id} className={`py-20 ${index % 2 === 1 ? 'bg-secondary/20' : ''}`}>
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="flex items-start gap-6 mb-12">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${tech.gradient} text-white shrink-0`}>
                  <tech.icon className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-4xl font-bold mb-2">{tech.title}</h2>
                  <p className="text-xl text-muted-foreground">{tech.subtitle}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {tech.description}
              </p>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {tech.details.map((detail, idx) => (
                  <Card key={idx} className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <div className="text-3xl mb-2">{detail.icon}</div>
                      <CardTitle className="text-lg">{detail.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{detail.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Architecture/Metrics */}
              {tech.architecture && (
                <Card className="border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
                  <CardHeader>
                    <CardTitle>{t('technologies.neural_networks.architecture.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Object.entries(tech.architecture).map(([key, value]) => (
                        <div key={key}>
                          <div className="text-sm text-muted-foreground capitalize mb-1">
                            {key === 'layers' ? t('technologies.neural_networks.architecture.layers_label', 'Layers') :
                              key === 'neurons' ? t('technologies.neural_networks.architecture.neurons_label', 'Neurons') :
                                key === 'parameters' ? t('technologies.neural_networks.architecture.parameters_label', 'Parameters') :
                                  key === 'activation' ? t('technologies.neural_networks.architecture.activation_label', 'Activation') :
                                    key === 'sequence' ? t('technologies.lstm_transformers.architecture.sequence_label', 'Sequence') :
                                      key === 'attention' ? t('technologies.lstm_transformers.architecture.attention_label', 'Attention') :
                                        key === 'memory' ? t('technologies.lstm_transformers.architecture.memory_label', 'Memory') :
                                          key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-lg font-semibold">{value}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metrics */}
              {tech.metrics && (
                <Card className="border-purple-500/50 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
                  <CardHeader>
                    <CardTitle>{t('technologies.pipeline.metrics.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Object.entries(tech.metrics).map(([key, value]) => (
                        <div key={key}>
                          <div className="text-sm text-muted-foreground capitalize mb-1">
                            {key === 'latency' ? t('technologies.pipeline.metrics.latency_label', 'Latency') :
                              key === 'throughput' ? t('technologies.pipeline.metrics.throughput_label', 'Throughput') :
                                key === 'uptime' ? t('technologies.pipeline.metrics.uptime_label', 'Uptime') :
                                  key === 'accuracy' ? t('technologies.pipeline.metrics.accuracy_label', 'Accuracy') :
                                    key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-lg font-semibold text-green-400">{value}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Decision Tree */}
              {tech.decisionTree && (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>{t('technologies.decision_making.decision_flow.title')}</CardTitle>
                    <CardDescription>{t('technologies.decision_making.decision_flow.subtitle')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tech.decisionTree.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-white text-sm font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <div className="flex-1 flex items-center justify-between bg-secondary/50 rounded-lg p-4">
                            <span className="font-semibold">{step.step}</span>
                            <span className="text-sm text-muted-foreground">{step.check}</span>
                          </div>
                          {idx < tech.decisionTree.length - 1 && (
                            <div className="text-purple-400">↓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* Why AI is Better */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">{t('advantages.title')}</h2>
              <p className="text-xl text-muted-foreground">
                {t('advantages.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {advantages.map((advantage, index) => (
                <Card key={index} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-purple-500/50 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <advantage.icon className={`w-6 h-6 ${advantage.color} shrink-0 mt-1`} />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{advantage.title}</h3>
                        <p className="text-muted-foreground">{advantage.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Training Process */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">{t('learning_process.title')}</h2>
              <p className="text-xl text-muted-foreground">
                {t('learning_process.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="text-4xl mb-2">📚</div>
                  <CardTitle>{t('learning_process.data.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• {t('learning_process.data.item1')}</li>
                    <li>• {t('learning_process.data.item2')}</li>
                    <li>• {t('learning_process.data.item3')}</li>
                    <li>• {t('learning_process.data.item4')}</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="text-4xl mb-2">🔄</div>
                  <CardTitle>{t('learning_process.schedule.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• {t('learning_process.schedule.item1')}</li>
                    <li>• {t('learning_process.schedule.item2')}</li>
                    <li>• {t('learning_process.schedule.item3')}</li>
                    <li>• {t('learning_process.schedule.item4')}</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="text-4xl mb-2">📈</div>
                  <CardTitle>{t('learning_process.validation.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• {t('learning_process.validation.item1')}</li>
                    <li>• {t('learning_process.validation.item2')}</li>
                    <li>• {t('learning_process.validation.item3')}</li>
                    <li>• {t('learning_process.validation.item4')}</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('cta.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <Button size="lg" className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:opacity-90">
            {t('cta.button')} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
