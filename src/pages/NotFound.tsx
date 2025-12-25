
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const { t } = useTranslation('not_found');

  return (
    <div className="min-h-screen bg-trading-bg dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-6">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center">
              <Bot className="w-10 h-10 text-accent" />
            </div>
          </div>

          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
            {t('title')}
          </h1>

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            {t('status')}
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('description')}
          </p>

          <Link to="/">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              {t('back_home')}
            </Button>
          </Link>

          <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            <p>{t('copyright')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
