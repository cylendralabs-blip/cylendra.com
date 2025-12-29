import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface ThemeToggleProps {
  className?: string;
  size?: 'icon' | 'sm' | 'lg';
  variant?: 'ghost' | 'outline';
}

const ThemeToggle = ({
  className,
  size = 'icon',
  variant = 'ghost',
}: ThemeToggleProps) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const icon = mounted ? (
    isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
  ) : (
    <div className="h-4 w-4" />
  );

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'rounded-full p-0 flex items-center justify-center',
        className
      )}
      aria-label="Toggle theme"
    >
      {icon}
    </Button>
  );
};

export default ThemeToggle;


