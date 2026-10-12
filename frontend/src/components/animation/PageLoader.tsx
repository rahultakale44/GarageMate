import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/utils/reducedMotion';

const PageLoader = () => {
  const [progress, setProgress] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Prevent scrolling
    document.body.style.overflow = 'hidden';

    // Animate progress - increased duration to showcase animations
    const duration = reducedMotion ? 800 : 3500;
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
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* GarageMate Logo with Animation */}
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.1,
                type: "spring",
                stiffness: 100,
                damping: 10
              }}
              className="mb-6"
            >
              <svg
                width={120}
                height={120}
                viewBox="0 0 180 150"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Location Pin with Pulse Animation */}
                <motion.path
                  d="M90 5 C60 5 35 30 35 60 C35 80 45 97 60 110 L90 145 L120 110 C135 97 145 80 145 60 C145 30 120 5 90 5 Z"
                  fill="#f97316"
                  stroke="#f97316"
                  strokeWidth="2"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
                
                {/* White circle background for car */}
                <motion.circle 
                  cx="90" 
                  cy="55" 
                  r="32" 
                  fill="white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                />
                
                {/* Car Icon with Slide-in Animation */}
                <motion.g 
                  transform="translate(90, 55)"
                  initial={{ x: -200, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: 0.8,
                    type: "spring",
                    stiffness: 100
                  }}
                >
                  {/* Car body */}
                  <path
                    d="M-16 2 L-13 -8 C-12 -11 -8 -13 -4 -13 L4 -13 C8 -13 12 -11 13 -8 L16 2 L16 10 C16 12 14 13 13 13 L-13 13 C-14 13 -16 12 -16 10 Z"
                    fill="#1e3a5f"
                  />
                  {/* Windshield */}
                  <path
                    d="M-11 -2 L-9 -9 C-8.5 -10.5 -5 -11.5 -3 -11.5 L3 -11.5 C5 -11.5 8.5 -10.5 9 -9 L11 -2 Z"
                    fill="#334e68"
                  />
                  {/* Headlights */}
                  <circle cx="-10" cy="7" r="2" fill="white" />
                  <circle cx="10" cy="7" r="2" fill="white" />
                  {/* Wheels */}
                  <circle cx="-8" cy="13" r="3" fill="#1e3a5f" />
                  <circle cx="8" cy="13" r="3" fill="#1e3a5f" />
                </motion.g>
                
                {/* Subtle shadow */}
                <motion.ellipse 
                  cx="90" 
                  cy="147" 
                  rx="25" 
                  ry="3" 
                  fill="#000" 
                  opacity="0.15"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                />
              </svg>
            </motion.div>

            {/* Brand Name with Letter Animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="mb-4"
            >
              <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight flex">
                {['G', 'a', 'r', 'a', 'g', 'e', 'M', 'a', 't', 'e'].map((letter, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 1.2 + index * 0.05,
                      type: "spring",
                      stiffness: 200
                    }}
                    className={letter === 'M' ? 'text-primary-500' : 'text-white'}
                  >
                    {letter}
                  </motion.span>
                ))}
              </h1>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.6 }}
              className="text-dark-400 text-sm uppercase tracking-[0.2em] mb-8 font-medium"
            >
              Help is closer than you think
            </motion.p>

            {/* Progress Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="w-72 space-y-3"
            >
              {/* Progress Percentage */}
              <div className="text-center">
                <motion.span 
                  className="text-3xl font-mono font-bold bg-gradient-to-r from-primary-500 to-orange-600 bg-clip-text text-transparent"
                  key={progress}
                  initial={{ scale: 1.2, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {progress}%
                </motion.span>
              </div>

              {/* Progress Bar Container */}
              <div className="relative h-2 bg-dark-700 rounded-full overflow-hidden border border-dark-600">
                {/* Glow effect behind bar */}
                <motion.div
                  className="absolute inset-0 bg-primary-500 blur-xl opacity-50"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
                
                {/* Actual Progress Bar */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary-500 via-orange-500 to-primary-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                >
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      ease: 'easeInOut',
                      repeatDelay: 0.5
                    }}
                  />
                </motion.div>
              </div>

              {/* Loading Text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-center"
              >
                <p className="text-dark-500 text-xs tracking-wide">
                  Loading your experience...
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Decorative Elements */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 2.2 }}
          >
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-primary-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;
