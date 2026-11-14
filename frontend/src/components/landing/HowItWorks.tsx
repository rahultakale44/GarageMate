import { motion } from 'framer-motion';
import { MapPin, CheckCircle, Truck, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  {
    number: '01',
    icon: MapPin,
    title: 'Share Your Location',
    description: 'Tell us where you are and what issue your vehicle is facing. We use your GPS for precision.',
    color: 'rgba(249,115,22,0.15)',
    borderColor: 'rgba(249,115,22,0.3)',
    iconColor: 'text-orange-400',
  },
  {
    number: '02',
    icon: CheckCircle,
    title: 'Get Matched',
    description: 'Our system instantly connects you with nearby verified garages based on your location and issue.',
    color: 'rgba(249,115,22,0.10)',
    borderColor: 'rgba(249,115,22,0.2)',
    iconColor: 'text-orange-400',
  },
  {
    number: '03',
    icon: Truck,
    title: 'Track Your Mechanic',
    description: 'See the real-time location of the mechanic on a live map. Know exactly when help arrives.',
    color: 'rgba(249,115,22,0.15)',
    borderColor: 'rgba(249,115,22,0.3)',
    iconColor: 'text-orange-400',
  },
  {
    number: '04',
    icon: CreditCard,
    title: 'Repair & Pay',
    description: 'Review a transparent itemised quotation. Approve the work, then pay securely — online or in person.',
    color: 'rgba(249,115,22,0.10)',
    borderColor: 'rgba(249,115,22,0.2)',
    iconColor: 'text-orange-400',
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-24 relative overflow-hidden" style={{ background: '#111827' }}>
    {/* Faint radial glow */}
    <div className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(249,115,22,0.06), transparent)' }} />

    <div className="container-custom relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <span className="inline-block text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4">
          — How It Works
        </span>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-5">
          Back on the road{' '}
          <span className="text-orange-400">in four steps</span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
          A simple, transparent process designed to get you moving again as quickly as possible.
        </p>
      </motion.div>

      {/* Steps — large card layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
        {steps.map((step, index) => (
          <motion.div key={step.number}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:border-orange-500/40"
            style={{
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            {/* Step number — large watermark */}
            <span className="absolute top-4 right-4 text-6xl font-black text-white/4 font-display select-none leading-none">
              {step.number}
            </span>

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-105"
              style={{ background: step.color, border: `1px solid ${step.borderColor}` }}>
              <step.icon className={`w-6 h-6 ${step.iconColor}`} strokeWidth={1.75} />
            </div>

            {/* Step label */}
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-orange-500 uppercase tracking-widest mb-3">
              <span className="w-4 h-px bg-orange-500/50" />
              Step {step.number}
            </span>

            <h3 className="text-base font-bold text-white mb-2.5 group-hover:text-orange-300 transition-colors">
              {step.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed flex-1">
              {step.description}
            </p>

            {/* Arrow to next step — not on last */}
            {index < steps.length - 1 && (
              <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full border border-orange-500/30 items-center justify-center"
                style={{ background: '#111827' }}>
                <ArrowRight className="w-3 h-3 text-orange-500" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Link to="/get-started"
          className="group inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
          style={{ boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
          Get Started Now
          <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <Link to="/user/nearby-garages"
          className="inline-flex items-center gap-2 px-8 py-3.5 font-bold text-slate-300 hover:text-white rounded-xl border border-white/12 hover:border-white/25 hover:bg-white/5 transition-all">
          Find Nearby Garages
        </Link>
      </motion.div>
    </div>
  </section>
);

export default HowItWorks;
