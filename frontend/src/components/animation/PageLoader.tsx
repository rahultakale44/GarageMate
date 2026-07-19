import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/utils/reducedMotion';

const PageLoader = () => {
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    // Animate progress
    const duration = reducedMotion ? 500 : 2000;
    const steps = 100;
    const stepDuration = duration / steps;

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 1;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          document.body.style.overflow = 'unset';
        }, 500);
      }
    }, stepDuration);

    return () => {
      clearInterval(interval);
      document.body.style.overflow = 'unset';
    };
  }, [reducedMotion]);

  return (
    <AnimatePresence>
      {progress < 100 && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-dark-900 flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
        >
          {/* Logo Icon */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-3xl font-bold text-white">G</span>
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-dark-400 text-sm uppercase tracking-wider mb-12"
          >
            Help is closer than you think
          </motion.p>

          {/* Progress */}
          <div className="w-64 space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <span className="text-2xl font-mono text-white">{progress}%</span>
            </motion.div>

            {/* Progress Bar */}
            <div className="h-0.5 bg-dark-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: 'linear' }}
              />
            </div>
          </div>

          {/* Brand Name Reveal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-12 overflow-hidden"
          >
            <motion.h1
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }}
              className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight"
            >
              GARAGEMATE
            </motion.h1>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;
