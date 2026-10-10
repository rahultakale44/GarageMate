import { motion } from 'framer-motion';
import { useReducedMotion } from '@/utils/reducedMotion';
import { Wrench, Battery, Truck, Fuel, Gauge, Zap, Clock } from 'lucide-react';

const ServicesMarquee = () => {
  const reducedMotion = useReducedMotion();
  
  const services = [
    { label: 'TYRE PUNCTURE', icon: Wrench },
    { label: 'DEAD BATTERY', icon: Battery },
    { label: 'TOWING', icon: Truck },
    { label: 'FUEL DELIVERY', icon: Fuel },
    { label: 'ENGINE HELP', icon: Gauge },
    { label: 'ELECTRICAL REPAIR', icon: Zap },
    { label: '24/7 ROADSIDE SUPPORT', icon: Clock },
  ];

  return (
    <div className="relative py-12 bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 overflow-hidden border-y-2 border-orange-500/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <motion.div
        animate={reducedMotion ? {} : { x: [0, -50 * services.length] }}
        transition={
          reducedMotion
            ? {}
            : {
                duration: 40,
                repeat: Infinity,
                ease: 'linear',
              }
        }
        className="flex whitespace-nowrap relative"
      >
        {/* First set */}
        {services.map((service, index) => (
          <div
            key={`first-${index}`}
            className="inline-flex items-center gap-3 mx-8 px-6 py-3 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30 rounded-full"
          >
            <service.icon className="w-6 h-6 text-orange-400" />
            <span className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wider">
              {service.label}
            </span>
          </div>
        ))}
        {/* Second set for seamless loop */}
        {services.map((service, index) => (
          <div
            key={`second-${index}`}
            className="inline-flex items-center gap-3 mx-8 px-6 py-3 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30 rounded-full"
          >
            <service.icon className="w-6 h-6 text-orange-400" />
            <span className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wider">
              {service.label}
            </span>
          </div>
        ))}
        {/* Third set for extra coverage */}
        {services.map((service, index) => (
          <div
            key={`third-${index}`}
            className="inline-flex items-center gap-3 mx-8 px-6 py-3 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30 rounded-full"
          >
            <service.icon className="w-6 h-6 text-orange-400" />
            <span className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-wider">
              {service.label}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default ServicesMarquee;
