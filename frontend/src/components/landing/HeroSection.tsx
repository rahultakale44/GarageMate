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

  // Automotive parts images for the scrolling background
  const automotiveImages = [
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop', // Mechanic working
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop', // Car parts
    'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400&h=300&fit=crop', // Engine parts
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&h=300&fit=crop', // Car tools
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400&h=300&fit=crop', // Engine
    'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400&h=300&fit=crop', // Tire
    'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=400&h=300&fit=crop', // Brake disc
    'https://images.unsplash.com/photo-1580414057798-1d56d4d4145c?w=400&h=300&fit=crop', // Workshop
  ];

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900"
    >
      {/* Infinite Scrolling Background Images */}
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <motion.div
          animate={{ x: [0, -2400] }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="flex absolute inset-0"
          style={{ width: '4800px' }}
        >
          {/* First set of images */}
          {automotiveImages.map((img, index) => (
            <div
              key={`first-${index}`}
              className="flex-shrink-0 w-[300px] h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
              }}
            />
          ))}
          {/* Duplicate set for seamless loop */}
          {automotiveImages.map((img, index) => (
            <div
              key={`second-${index}`}
              className="flex-shrink-0 w-[300px] h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Lighter overlay for better image visibility */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900/60 via-dark-800/50 to-dark-900/60" />

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

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
                  style={{
                    textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)'
                  }}
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
            className="text-lg md:text-xl text-white max-w-2xl mx-auto font-medium"
            style={{
              textShadow: '0 2px 12px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,0.8)'
            }}
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
              className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full font-semibold text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 border-2 border-orange-400"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Emergency Help
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>

            <Link
              to="/user/nearby-garages"
              className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold text-lg border-2 border-white/30 hover:bg-white/20 hover:border-white/50 transition-all hover:scale-105 hover:shadow-xl"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Find Nearby Garages
              </span>
            </Link>
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
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ delay: 2 + index * 0.1 }}
                className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border-2 border-orange-500/30 hover:border-orange-500/60 hover:bg-white/15 transition-all shadow-lg hover:shadow-xl"
              >
                <span className="text-sm font-medium text-white">
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
