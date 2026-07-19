// Utility to detect and respect user's reduced motion preference

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
};

export const getAnimationConfig = () => {
  const reduced = prefersReducedMotion();
  
  return {
    duration: reduced ? 0 : 0.6,
    ease: reduced ? 'linear' : 'easeOut',
    enabled: !reduced,
  };
};

// React hook for reduced motion
import { useEffect, useState } from 'react';

export const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(prefersReducedMotion());

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = () => {
      setReduced(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reduced;
};
