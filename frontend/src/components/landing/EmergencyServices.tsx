import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wrench, Battery, Car, Fuel, Zap, Truck, Settings, AlertCircle, ArrowRight, PhoneCall } from 'lucide-react';

const services = [
  { icon: Wrench,       title: 'Tyre Puncture',        desc: 'Fast on-site tyre repair and replacement.',      number: '01' },
  { icon: Battery,      title: 'Battery Jump-Start',   desc: 'Get your dead battery revived in minutes.',       number: '02' },
  { icon: Car,          title: 'Vehicle Not Starting', desc: 'Expert diagnosis and on-the-spot fix.',           number: '03' },
  { icon: Fuel,         title: 'Fuel Delivery',         desc: 'Emergency fuel delivered to your location.',      number: '04' },
  { icon: Zap,          title: 'Electrical Repair',     desc: 'Wiring, fuses, and electrical system faults.',   number: '05' },
  { icon: Truck,        title: 'Towing Service',        desc: 'Safe flatbed and crane towing, any vehicle.',     number: '06' },
  { icon: Settings,     title: 'Engine Assistance',     desc: 'Overheating, knocking, stalling — we fix it.',   number: '07' },
  { icon: AlertCircle,  title: 'Brake Repair',          desc: 'Safety-critical brake inspection and repair.',   number: '08' },
];

const EmergencyServices = () => (
  <section id="services" className="py-24 relative overflow-hidden" style={{ background: '#0f172a' }}>
    {/* Subtle radial glow */}
    <div className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse 70% 50% at 100% 50%, rgba(249,115,22,0.05), transparent)' }} />

    <div className="container-custom relative z-10">
      {/* Section layout: left text + right image */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">

        {/* Left — heading */}
        <motion.div
          initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4">
            — Emergency Services
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight mb-5">
            Whatever breaks down,{' '}
            <span className="text-orange-400">we have you covered</span>
          </h2>
          <p className="text-slate-400 leading-relaxed mb-8 max-w-md">
            From tyre punctures to engine failures — our network of verified garages responds fast, 24 hours a day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/get-started"
              className="group inline-flex items-center gap-2 px-6 py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
              style={{ boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
              <PhoneCall className="w-4 h-4" />
              Request Emergency Help
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Right — real image */}
        <motion.div
          initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
          className="relative hidden lg:block"
        >
          <div className="rounded-2xl overflow-hidden border border-white/8"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <img
              src="/images/photo-toyota-vios-openning-its-trunk-show-its-broken-engine-waiting-mechanic-to-fix-local-garage-paknampran-136503502.webp"
              alt="Mechanic assisting a stranded vehicle"
              className="w-full h-72 object-cover object-center"
            />
            <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(to top,rgba(15,23,42,0.6) 0%,transparent 60%)' }} />
          </div>
          {/* Floating ETA card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.4 }}
            className="absolute -bottom-5 -left-5 p-4 rounded-xl border border-white/10"
            style={{ background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Mechanic ETA</p>
                <p className="text-sm font-bold text-white">Under 10 minutes</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Service cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((service, index) => (
          <motion.div key={service.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <Link to="/get-started"
              className="group flex flex-col p-5 rounded-xl border border-white/8 hover:border-orange-500/40 transition-all duration-200"
              style={{ background: '#1e293b', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105"
                  style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <service.icon className="w-5 h-5 text-orange-400 group-hover:text-orange-300 transition-colors" />
                </div>
                <span className="text-xs font-mono text-slate-700 group-hover:text-orange-500/50 transition-colors">
                  {service.number}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mb-1.5 group-hover:text-orange-300 transition-colors">
                {service.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">{service.desc}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default EmergencyServices;
