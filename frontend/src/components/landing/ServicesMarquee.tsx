import { motion } from 'framer-motion';
import { useReducedMotion } from '@/utils/reducedMotion';
import { Wrench, Battery, Truck, Fuel, Gauge, Zap, Clock } from 'lucide-react';

const services = [
  { label: 'Tyre Puncture',        icon: Wrench  },
  { label: 'Dead Battery',          icon: Battery },
  { label: 'Towing Service',        icon: Truck   },
  { label: 'Fuel Delivery',         icon: Fuel    },
  { label: 'Engine Assistance',     icon: Gauge   },
  { label: 'Electrical Repair',     icon: Zap     },
  { label: '24/7 Roadside Support', icon: Clock   },
];

const items = [...services, ...services, ...services];

const ServicesMarquee = () => {
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative py-4 overflow-hidden select-none" style={{ background: '#111827' }} aria-hidden="true">
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(249,115,22,0.5),transparent)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(249,115,22,0.3),transparent)' }} />

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right,#111827,transparent)' }} />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left,#111827,transparent)' }} />

      <motion.div
        animate={reducedMotion ? {} : { x: ['0%', `-${100 / 3}%`] }}
        transition={reducedMotion ? {} : { duration: 36, repeat: Infinity, ease: 'linear' }}
        className="flex whitespace-nowrap"
        style={{ width: 'max-content' }}
      >
        {items.map((service, index) => (
          <span key={index} className="inline-flex items-center gap-2.5 mx-8 text-xs font-semibold uppercase tracking-widest text-slate-400">
            <service.icon className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
            {service.label}
            <span className="ml-8 w-1 h-1 rounded-full bg-orange-500/40" />
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export default ServicesMarquee;
