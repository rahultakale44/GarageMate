import { motion } from 'framer-motion';
import { useReducedMotion } from '@/utils/reducedMotion';

const ServicesMarquee = () => {
  const reducedMotion = useReducedMotion();
  
  const services = [
    'TYRE PUNCTURE',
    'DEAD BATTERY',
    'TOWING',
    'FUEL DELIVERY',
    'ENGINE HELP',
    'ELECTRICAL REPAIR',
    '24/7 ROADSIDE SUPPORT',
  ];

  const marqueeContent = [...services, ...services, ...services].join(' • ');

  return (
    <div className="relative py-8 bg-dark-900 overflow-hidden">
      <motion.div
        animate={reducedMotion ? {} : { x: [0, -33.33 * services.length * 12] }}
        transition={
          reducedMotion
            ? {}
            : {
                duration: 30,
                repeat: Infinity,
                ease: 'linear',
              }
        }
        className="flex whitespace-nowrap"
      >
        <span className="text-3xl md:text-5xl font-display font-bold text-white/10 uppercase tracking-wider px-4">
          {marqueeContent}
        </span>
        <span className="text-3xl md:text-5xl font-display font-bold text-white/10 uppercase tracking-wider px-4">
          {marqueeContent}
        </span>
      </motion.div>
    </div>
  );
};

export default ServicesMarquee;
