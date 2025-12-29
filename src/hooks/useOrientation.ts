
import { useState, useEffect } from 'react';

interface OrientationState {
  isPortrait: boolean;
  isLandscape: boolean;
  angle: number;
  width: number;
  height: number;
}

export const useOrientation = () => {
  const [orientation, setOrientation] = useState<OrientationState>(() => {
    if (typeof window === 'undefined') {
      return {
        isPortrait: true,
        isLandscape: false,
        angle: 0,
        width: 0,
        height: 0
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = height > width;

    return {
      isPortrait,
      isLandscape: !isPortrait,
      angle: screen.orientation?.angle || 0,
      width,
      height
    };
  });

  useEffect(() => {
    const updateOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPortrait = height > width;
      const angle = screen.orientation?.angle || 0;

      setOrientation({
        isPortrait,
        isLandscape: !isPortrait,
        angle,
        width,
        height
      });
    };

    // استماع لتغيير الاتجاه
    window.addEventListener('orientationchange', updateOrientation);
    window.addEventListener('resize', updateOrientation);

    // تحديث فوري
    updateOrientation();

    return () => {
      window.removeEventListener('orientationchange', updateOrientation);
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return orientation;
};
