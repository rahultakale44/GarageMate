import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, ChevronDown } from 'lucide-react';
import { useReducedMotion } from '@/utils/reducedMotion';

const HeroSection = () => {
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;

      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      const xPercent = (clientX / innerWidth - 0.5) * 20;
      const yPercent = (clientY / innerHeight - 0.5) * 20;

      const image = heroRef.current.querySelector('.hero-image') as HTMLElement;
      if (image) {
        image.style.transform = `translate(${xPercent}px, ${yPercent}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reducedMotion]);

  const headlineWords = ['STRANDED?', 'HELP IS ALREADY', 'ON THE WAY.'];

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Background Image with Parallax */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.15 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="hero-image absolute inset-0 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Content */}
      <div className="container-custom relative z-10 py-32">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Headline */}
          <div className="space-y-4 overflow-hidden">
            {headlineWords.map((line, index) => (
              <div key={index} className="overflow-hidden">
                <motion.h1
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3 + index * 0.2,
                    ease: [0.43, 0.13, 0.23, 0.96],
                  }}
                  className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white leading-[1.1]"
                >
                  {line}
                </motion.h1>
              </div>
            ))}
          </div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="text-lg md:text-xl text-dark-300 max-w-2xl mx-auto"
          >
            Verified local garages. Real-time mechanic tracking. Transparent roadside assistance.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              to="/get-started"
              className="group relative px-8 py-4 bg-primary-500 text-white rounded-full font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary-500/50"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Emergency Help
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>

            <button className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all">
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Find Nearby Garages
              </span>
            </button>
          </motion.div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-12"
          >
            {[
              { label: '12 Garages Nearby', icon: '🔧' },
              { label: 'Mechanic ETA: 8 min', icon: '⏱️' },
              { label: 'Verified Partners', icon: '✓' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 + index * 0.1 }}
                className="px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
              >
                <span className="text-sm text-white/80">
                  {stat.icon} {stat.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2 text-white/60"
          >
            <span className="text-xs uppercase tracking-wider">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
