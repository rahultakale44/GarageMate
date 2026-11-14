import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Shield, ChevronDown, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReducedMotion } from '@/utils/reducedMotion';

const slides = [
  {
    image: '/images/pexels-didpics-24407415.jpg',
    tag: 'Emergency Roadside Assistance',
    headline: ['STRANDED?', 'HELP IS', 'ON THE WAY.'],
    sub: 'Verified local mechanics dispatched to your location in minutes.',
  },
  {
    image: '/images/059leicesterwoodgateworkshop.webp',
    tag: 'Verified Partner Garages',
    headline: ['TRUSTED', 'GARAGES,', 'NEAR YOU.'],
    sub: 'Find, compare and book from verified garages in your neighbourhood.',
  },
  {
    image: '/images/photo-toyota-vios-openning-its-trunk-show-its-broken-engine-waiting-mechanic-to-fix-local-garage-paknampran-180488625.webp',
    tag: 'Transparent Service & Pricing',
    headline: ['HONEST', 'REPAIRS,', 'FAIR PRICES.'],
    sub: 'Itemised quotations before any work begins. No surprises, ever.',
  },
];

const stats = [
  { icon: Shield,       value: '100%',   label: 'Verified Partners' },
  { icon: Clock,        value: '<10 min', label: 'Avg. Response Time' },
  { icon: CheckCircle,  value: 'OTP',    label: 'Protected Service' },
  { icon: MapPin,       value: '24/7',   label: 'Available' },
];

const HeroSection = () => {
  const reducedMotion = useReducedMotion();
  const [current, setCurrent] = useState(0);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  const next = () => setCurrent((c) => (c + 1) % slides.length);

  const slide = slides[current];

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: '#0a0f1a' }}>

      {/* ── Sliding background images ── */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={current}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            <img
              src={slide.image}
              alt=""
              className="w-full h-full object-cover object-center"
              aria-hidden="true"
            />
          </motion.div>
        </AnimatePresence>

        {/* Overlay — dark enough for text to pop, image still visible */}
        <div className="absolute inset-0 z-10" style={{
          background: 'linear-gradient(to bottom, rgba(5,8,16,0.65) 0%, rgba(5,8,16,0.70) 50%, rgba(5,8,16,0.85) 100%)'
        }} />
        {/* Bottom scrim into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-40 z-10" style={{
          background: 'linear-gradient(to top, #0f172a, transparent)'
        }} />
      </div>


      {/* ── Main content — centered ── */}
      <div className="container-custom relative z-20 flex-1 flex items-center pt-24 pb-10">
        <div className="w-full flex flex-col items-center text-center">

          {/* Slide tag */}
          <AnimatePresence mode="wait">
            <motion.div key={`tag-${current}`}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 border border-orange-500/35"
              style={{ background: 'rgba(249,115,22,0.12)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
              <span className="text-xs font-semibold text-orange-300 uppercase tracking-widest">
                {slide.tag}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Headline */}
          <div className="mb-6 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={`headline-${current}`}
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                {slide.headline.map((line, i) => (
                  <div key={i}
                    className={`font-display font-black tracking-tight leading-[0.95] ${
                      i === 0
                        ? 'text-6xl sm:text-7xl lg:text-8xl xl:text-9xl text-orange-400'
                        : 'text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-white'
                    } mb-1.5`}
                    style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,1)' }}
                  >
                    {line}
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sub-headline */}
          <AnimatePresence mode="wait">
            <motion.p key={`sub-${current}`}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
              className="text-lg text-white mb-10 leading-relaxed max-w-xl font-medium"
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 3px 16px rgba(0,0,0,0.85)' }}
            >
              {slide.sub}
            </motion.p>
          </AnimatePresence>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link to="/get-started"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white font-bold text-base rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-colors"
              style={{ boxShadow: '0 4px 24px rgba(249,115,22,0.45)' }}>
              Get Emergency Help
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/user/nearby-garages"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 font-bold text-base text-white rounded-xl border border-white/15 hover:bg-white/8 hover:border-white/25 transition-all backdrop-blur-sm">
              <MapPin className="w-5 h-5 text-orange-400" />
              Find Nearby Garages
            </Link>
          </motion.div>

          {/* Slide controls + dots */}
          <div className="flex items-center gap-4">
            <button onClick={prev} aria-label="Previous slide"
              className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/8 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)} aria-label={`Go to slide ${i + 1}`}
                  className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-2 bg-orange-500' : 'w-2 h-2 bg-white/25 hover:bg-white/40'}`}
                />
              ))}
            </div>

            <button onClick={next} aria-label="Next slide"
              className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/8 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="ml-2 text-xs text-slate-500 font-mono">
              {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
          </div>

        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="relative z-20 border-t border-white/8" style={{ background: 'rgba(10,15,26,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/8">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 px-6 py-5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border border-orange-500/20"
                  style={{ background: 'rgba(249,115,22,0.10)' }}>
                  <Icon className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="absolute bottom-20 right-8 hidden lg:flex flex-col items-center gap-1.5 text-slate-600 z-20"
      >
        <span className="text-2xs uppercase tracking-widest" style={{ writingMode: 'vertical-rl' }}>Scroll</span>
        <motion.div
          animate={reducedMotion ? {} : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
