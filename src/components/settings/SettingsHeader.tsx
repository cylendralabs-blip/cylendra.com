
import { useTranslation } from 'react-i18next';

const SettingsHeader = () => {
  const { t } = useTranslation('settings');

  return (
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {t('title')}
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        {t('subtitle')}
      </p>
    </div>
  );
};

export default SettingsHeader;
