import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useEffect } from 'react';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lng;
    };

    // Sync on mount and change
    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
                <DropdownMenuItem onClick={() => changeLanguage('en')}>
                    English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('ar')}>
                    العربية
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('es')}>
                    Español
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('fr')}>
                    Français
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('pt')}>
                    Português
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('ru')}>
                    Русский
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('tr')}>
                    Türkçe
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('hi')}>
                    हिन्दी
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changeLanguage('id')}>
                    Bahasa Indonesia
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
