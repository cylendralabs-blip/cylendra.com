
import { useState, useEffect, useRef, useCallback } from 'react';

interface GestureState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  isActive: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

interface GestureHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

export const useGestures = (handlers: GestureHandlers = {}) => {
  const [gestureState, setGestureState] = useState<GestureState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    isActive: false,
    direction: null
  });

  const elementRef = useRef<HTMLElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const lastTapTime = useRef<number>(0);
  const initialDistance = useRef<number>(0);

  const minSwipeDistance = 50;
  const minSwipeVelocity = 0.3;
  const longPressDelay = 500;
  const doubleTapDelay = 300;

  // حساب المسافة بين نقطتين للـ pinch gesture
  const getDistance = useCallback((touches: TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  // تحديد اتجاه الـ swipe
  const getSwipeDirection = useCallback((deltaX: number, deltaY: number) => {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  // بداية اللمس
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    
    if (e.touches.length === 2) {
      // Pinch gesture
      initialDistance.current = getDistance(e.touches);
    } else {
      // Single touch
      setGestureState(prev => ({
        ...prev,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        isActive: true
      }));

      // بدء مؤقت الضغط الطويل
      if (handlers.onLongPress) {
        longPressTimer.current = setTimeout(() => {
          handlers.onLongPress?.();
        }, longPressDelay);
      }
    }
  }, [handlers.onLongPress, getDistance]);

  // حركة اللمس
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault(); // منع التمرير الافتراضي
    
    if (e.touches.length === 2 && handlers.onPinch) {
      // Pinch gesture
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / initialDistance.current;
      handlers.onPinch(scale);
    } else {
      const touch = e.touches[0];
      
      setGestureState(prev => ({
        ...prev,
        currentX: touch.clientX,
        currentY: touch.clientY,
        deltaX: touch.clientX - prev.startX,
        deltaY: touch.clientY - prev.startY,
        direction: getSwipeDirection(touch.clientX - prev.startX, touch.clientY - prev.startY)
      }));

      // إلغاء مؤقت الضغط الطويل عند الحركة
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    }
  }, [handlers.onPinch, getDistance, getSwipeDirection]);

  // نهاية اللمس
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const { deltaX, deltaY, startX, startY } = gestureState;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // التحقق من النقر المزدوج
    const currentTime = Date.now();
    const timeDiff = currentTime - lastTapTime.current;
    
    if (distance < 10) { // نقرة وليس swipe
      if (timeDiff < doubleTapDelay && handlers.onDoubleTap) {
        handlers.onDoubleTap();
        lastTapTime.current = 0; // إعادة تعيين لمنع النقر الثلاثي
      } else {
        lastTapTime.current = currentTime;
        setTimeout(() => {
          if (lastTapTime.current === currentTime && handlers.onTap) {
            handlers.onTap();
          }
        }, doubleTapDelay);
      }
    } else if (distance > minSwipeDistance) {
      // Swipe gesture
      const direction = getSwipeDirection(deltaX, deltaY);
      
      switch (direction) {
        case 'left':
          handlers.onSwipeLeft?.();
          break;
        case 'right':
          handlers.onSwipeRight?.();
          break;
        case 'up':
          handlers.onSwipeUp?.();
          break;
        case 'down':
          handlers.onSwipeDown?.();
          break;
      }
    }

    setGestureState(prev => ({
      ...prev,
      isActive: false,
      deltaX: 0,
      deltaY: 0,
      direction: null
    }));
  }, [gestureState, handlers, getSwipeDirection]);

  // ربط الأحداث
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    gestureRef: elementRef,
    gestureState,
    isGestureActive: gestureState.isActive
  };
};
