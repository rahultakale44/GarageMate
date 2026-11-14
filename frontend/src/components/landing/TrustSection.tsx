import { motion } from 'framer-motion';
import { Shield, Users, FileCheck, Lock, Star } from 'lucide-react';

const features = [
  { icon: Shield,    title: 'Verified Garages',         description: 'Every garage partner is reviewed and verified before appearing on the platform.' },
  { icon: Users,     title: 'Real Profiles',             description: 'Actual garage owners and mechanics serving your local community.' },
  { icon: FileCheck, title: 'Transparent Quotations',   description: 'Itemised cost breakdown before any work begins on your vehicle.' },
  { icon: Lock,      title: 'Secure Payments',           description: 'OTP-verified service completion and encrypted payment processing.' },
];

const testimonials = [
  { name: 'Rahul M.', city: 'Pune', rating: 5, text: 'Got a tyre puncture at 11pm. A mechanic arrived in 8 minutes. Absolutely lifesaving!' },
  { name: 'Priya S.', city: 'Mumbai', rating: 5, text: 'Battery died before an important meeting. GarageMate sorted it in 12 minutes flat.' },
  { name: 'Amit K.', city: 'Jalgaon', rating: 4, text: 'Great service, transparent pricing. No hidden charges at all. Will definitely use again.' },
];

const TrustSection = () => (
  <section className="py-24 relative overflow-hidden" style={{ background: '#0f172a' }}>
    {/* Orange radial glow at bottom */}
    <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(249,115,22,0.07), transparent)' }} />

    <div className="container-custom relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <span className="inline-block text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4">
          — Why Trust Us
        </span>
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-5">
          Built on <span className="text-orange-400">transparency and trust</span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
          Your safety and satisfaction drive every decision we make.
        </p>
      </motion.div>

      {/* Trust feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
        {features.map((feature, index) => (
          <motion.div key={feature.title}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }}
            className="group p-6 rounded-2xl border border-white/8 hover:border-orange-500/35 transition-all duration-200"
            style={{ background: '#1e293b', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-orange-500/20 group-hover:border-orange-500/40 transition-colors"
              style={{ background: 'rgba(249,115,22,0.10)' }}>
              <feature.icon className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2 group-hover:text-orange-300 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {testimonials.map((t, index) => (
          <motion.div key={t.name}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}
            className="p-6 rounded-2xl border border-white/8"
            style={{ background: '#1a2535', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
          >
            {/* Stars */}
            <div className="flex items-center gap-0.5 mb-4">
              {Array.from({ length: t.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-5 italic">
              "{t.text}"
            </p>

            <div className="flex items-center gap-3">
              {/* Avatar initials */}
              <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-orange-400">{t.name[0]}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t.name}</p>
                <p className="text-xs text-slate-500">{t.city}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustSection;
