
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGestures } from '@/hooks/useGestures';

interface TouchFriendlyButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  hapticFeedback?: boolean;
}

const TouchFriendlyButton = ({
  children,
  onClick,
  onLongPress,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  hapticFeedback = true,
  ...props
}: TouchFriendlyButtonProps) => {
  
  // تحسين الحجم للموبايل
  const getMobileSize = () => {
    if (size === 'sm') return 'h-10 px-4 text-sm';
    if (size === 'lg') return 'h-14 px-8 text-lg';
    if (size === 'icon') return 'h-12 w-12';
    return 'h-12 px-6 text-base'; // default مع تحسين للموبايل
  };

  const handleTap = () => {
    if (disabled) return;
    
    // Haptic feedback للأجهزة المدعومة
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onClick?.();
  };

  const handleLongPress = () => {
    if (disabled) return;
    
    // Haptic feedback أقوى للضغط الطويل
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate([50, 25, 50]);
    }
    
    onLongPress?.();
  };

  const { gestureRef, isGestureActive } = useGestures({
    onTap: handleTap,
    onLongPress: onLongPress ? handleLongPress : undefined
  });

  return (
    <Button
      ref={gestureRef as any}
      variant={variant}
      className={cn(
        getMobileSize(),
        'touch-manipulation select-none', // تحسين اللمس
        'active:scale-95 transition-transform duration-100', // تأثير بصري عند الضغط
        isGestureActive && 'scale-95', // تأثير أثناء اللمس
        'min-h-[44px] min-w-[44px]', // الحد الأدنى المُوصى به من Apple/Google
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </Button>
  );
};

export default TouchFriendlyButton;
