
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp, Zap, Play, BarChart3 } from 'lucide-react';
import { DCAStrategy } from '@/types/strategies';
import { DCAStrategyService } from '@/services/strategies/DCAStrategyService';
import { StrategyService } from '@/services/strategies/StrategyService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import CreateDCAStrategyDialog from './CreateDCAStrategyDialog';
import DCAStrategyCard from './DCAStrategyCard';
import DCAPerformanceChart from './DCAPerformanceChart';

const EnhancedDCAStrategies = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<DCAStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const dcaTypes = {
    basic: {
      title: 'DCA الأساسية',
      description: 'استراتيجية بسيطة وآمنة للمبتدئين',
      icon: Target,
      color: 'blue',
      features: ['متوسط سعر التكلفة', 'إدارة مخاطر أساسية', 'تنفيذ بسيط']
    },
    advanced: {
      title: 'DCA المتقدمة', 
      description: 'مميزات إضافية وتحكم أكبر',
      icon: TrendingUp,
      color: 'green',
      features: ['دخول ذكي', 'جني أرباح ديناميكي', 'مستويات متقدمة']
    },
    smart: {
      title: 'DCA الذكية',
      description: 'ذكاء اصطناعي وتحليل متقدم', 
      icon: Zap,
      color: 'purple',
      features: ['AI للدخول', 'وقف خسائر متحرك', 'تحليل السوق']
    }
  };

  useEffect(() => {
    loadStrategies();
  }, [user]);

  const loadStrategies = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userStrategies = await StrategyService.getUserStrategies(user.id);
      const dcaStrategies = userStrategies.filter(s => 
        s.type.startsWith('dca_')
      ) as DCAStrategy[];
      setStrategies(dcaStrategies);
    } catch (error) {
      console.error('Error loading strategies:', error);
      toast({
        title: 'خطأ في تحميل الاستراتيجيات',
        description: 'فشل في تحميل الاستراتيجيات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStrategy = async (type: 'dca_basic' | 'dca_advanced' | 'dca_smart') => {
    if (!user) return;
    
    try {
      const defaultSettings = DCAStrategyService.getDefaultSettings(type);
      const strategy = await DCAStrategyService.createDCAStrategy(
        `${dcaTypes[type.split('_')[1] as keyof typeof dcaTypes].title} - ${new Date().toLocaleDateString('ar')}`,
        user.id,
        defaultSettings,
        type
      );
      setStrategies(prev => [strategy, ...prev]);
      toast({
        title: 'تم إنشاء الاستراتيجية',
        description: `تم إنشاء استراتيجية ${dcaTypes[type.split('_')[1] as keyof typeof dcaTypes].title} بنجاح`
      });
    } catch (error) {
      toast({
        title: 'خطأ في إنشاء الاستراتيجية',
        description: 'فشل في إنشاء الاستراتيجية، يرجى المحاولة مرة أخرى',
        variant: 'destructive'
      });
    }
  };

  const handleCloneStrategy = async (strategyId: string) => {
    try {
      const cloned = await StrategyService.cloneStrategy(strategyId, `نسخة من الاستراتيجية`);
      setStrategies(prev => [cloned as DCAStrategy, ...prev]);
      toast({
        title: 'تم نسخ الاستراتيجية',
        description: 'تم إنشاء نسخة من الاستراتيجية بنجاح'
      });
    } catch (error) {
      toast({
        title: 'خطأ في النسخ',
        description: 'فشل في نسخ الاستراتيجية',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateStrategy = async (updatedStrategy: DCAStrategy) => {
    try {
      await StrategyService.updateStrategy(updatedStrategy.id, updatedStrategy);
      setStrategies(prev => 
        prev.map(s => s.id === updatedStrategy.id ? updatedStrategy : s)
      );
    } catch (error) {
      toast({
        title: 'خطأ في تحديث الاستراتيجية',
        description: 'فشل في حفظ التغييرات',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (strategyId: string, isActive: boolean) => {
    try {
      await StrategyService.toggleStrategyStatus(strategyId, isActive);
      setStrategies(prev =>
        prev.map(s => s.id === strategyId ? { ...s, isActive } : s)
      );
      toast({
        title: isActive ? 'تم تشغيل الاستراتيجية' : 'تم إيقاف الاستراتيجية',
        description: `الاستراتيجية الآن ${isActive ? 'نشطة' : 'متوقفة'}`
      });
    } catch (error) {
      toast({
        title: 'خطأ في تغيير حالة الاستراتيجية',
        description: 'فشل في تحديث حالة الاستراتيجية',
        variant: 'destructive'
      });
    }
  };

  const filteredStrategies = strategies.filter(strategy => {
    if (activeTab === 'all') return true;
    const typeKey = strategy.type.split('_')[1];
    return typeKey === activeTab;
  });

  const getActiveStrategiesCount = () => strategies.filter(s => s.isActive).length;
  const getTotalProfit = () => strategies.reduce((sum, s) => sum + (s.performance?.netProfit || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            استراتيجيات DCA المحسنة
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            نظام متقدم لاستراتيجيات متوسط سعر التكلفة بالدولار
          </p>
        </div>
        
        <div className="flex gap-2">
          <CreateDCAStrategyDialog onCreateStrategy={handleCreateStrategy} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الاستراتيجيات</p>
                <p className="font-bold text-2xl">{strategies.length}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">النشطة</p>
                <p className="font-bold text-2xl text-green-600">{getActiveStrategiesCount()}</p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">الربح الإجمالي</p>
                <p className="font-bold text-2xl text-green-600">+{getTotalProfit().toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الصفقات</p>
                <p className="font-bold text-2xl">248</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Types Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="basic">أساسية</TabsTrigger>
          <TabsTrigger value="advanced">متقدمة</TabsTrigger>
          <TabsTrigger value="smart">ذكية</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Strategy Type Info Cards */}
          {activeTab !== 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {Object.entries(dcaTypes)
                .filter(([key]) => activeTab === 'all' || key === activeTab)
                .map(([key, info]) => {
                  const Icon = info.icon;
                  return (
                    <Card key={key} className={`border-l-4 border-l-${info.color}-500`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Icon className={`w-5 h-5 text-${info.color}-600`} />
                          {info.title}
                        </CardTitle>
                        <CardDescription>{info.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ul className="space-y-1">
                          {info.features.map((feature, idx) => (
                            <li key={idx} className="text-sm flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-${info.color}-500`}></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Button 
                          className="w-full mt-4" 
                          variant="outline"
                          onClick={() => handleCreateStrategy(`dca_${key}` as 'dca_basic' | 'dca_advanced' | 'dca_smart')}
                        >
                          إنشاء {info.title}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}

          {/* Performance Chart */}
          <DCAPerformanceChart />

          {/* Strategies List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">الاستراتيجيات الموجودة</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <p>جاري تحميل الاستراتيجيات...</p>
              </div>
            ) : filteredStrategies.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    لا توجد استراتيجيات {activeTab !== 'all' ? dcaTypes[activeTab as keyof typeof dcaTypes]?.title : ''} حتى الآن
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    ابدأ بإنشاء استراتيجية جديدة
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredStrategies.map((strategy) => (
                  <DCAStrategyCard
                    key={strategy.id}
                    strategy={strategy}
                    onClone={() => handleCloneStrategy(strategy.id)}
                    onUpdateStrategy={handleUpdateStrategy}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedDCAStrategies;
