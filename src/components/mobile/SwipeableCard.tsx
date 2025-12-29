
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useGestures } from '@/hooks/useGestures';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
  swipeThreshold?: number;
  disabled?: boolean;
}

const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className,
  swipeThreshold = 50,
  disabled = false,
  ...props
}: SwipeableCardProps) => {
  const [isSwipeHintVisible, setIsSwipeHintVisible] = useState(false);

  const { gestureRef, gestureState, isGestureActive } = useGestures({
    onSwipeLeft: disabled ? undefined : onSwipeLeft,
    onSwipeRight: disabled ? undefined : onSwipeRight,
    onSwipeUp: disabled ? undefined : onSwipeUp,
    onSwipeDown: disabled ? undefined : onSwipeDown,
  });

  // عرض مؤشر الـ swipe
  const getSwipeIndicator = () => {
    if (!isGestureActive || Math.abs(gestureState.deltaX) < 20 && Math.abs(gestureState.deltaY) < 20) {
      return null;
    }

    const { direction, deltaX, deltaY } = gestureState;
    const progress = Math.min(Math.abs(deltaX || deltaY) / swipeThreshold, 1);

    return (
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div 
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-all',
            'bg-primary/20 backdrop-blur-sm border-2',
            direction === 'left' && 'border-red-500 text-red-600',
            direction === 'right' && 'border-green-500 text-green-600',
            direction === 'up' && 'border-blue-500 text-blue-600',
            direction === 'down' && 'border-yellow-500 text-yellow-600'
          )}
          style={{
            transform: `scale(${0.5 + progress * 0.5})`,
            opacity: progress
          }}
        >
          {direction === 'left' && '←'}
          {direction === 'right' && '→'}
          {direction === 'up' && '↑'}
          {direction === 'down' && '↓'}
        </div>
      </div>
    );
  };

  return (
    <Card
      ref={gestureRef as any}
      className={cn(
        'relative overflow-hidden touch-manipulation',
        'transition-transform duration-200',
        isGestureActive && 'scale-[0.98]',
        !disabled && 'cursor-grab active:cursor-grabbing',
        disabled && 'opacity-50',
        className
      )}
      style={{
        transform: isGestureActive ? 
          `translate(${gestureState.deltaX * 0.1}px, ${gestureState.deltaY * 0.1}px)` : 
          undefined
      }}
      {...props}
    >
      {children}
      {getSwipeIndicator()}
    </Card>
  );
};

export default SwipeableCard;
