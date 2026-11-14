import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, DollarSign, CheckCircle, Store } from 'lucide-react';

const benefits = [
  { icon: Users,      text: 'Reach More Customers' },
  { icon: TrendingUp, text: 'Grow Your Business'   },
  { icon: DollarSign, text: 'Transparent Earnings' },
];

const PartnerCTA = () => (
  <section id="partner" className="py-24 relative overflow-hidden" style={{ background: '#0f172a' }}>
    {/* Background image with heavy overlay */}
    <div className="absolute inset-0">
      <img src="/images/auto-craft-rourkela-0q2xeppdqo.avif" alt="" className="w-full h-full object-cover object-center opacity-15" aria-hidden="true" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.97) 0%,rgba(15,23,42,0.90) 100%)' }} />
    </div>

    {/* Orange accent lines */}
    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,transparent,rgba(249,115,22,0.6),transparent)' }} />

    <div className="container-custom relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 mb-6"
              style={{ background: 'rgba(249,115,22,0.10)' }}>
              <Store className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-semibold text-orange-400 uppercase tracking-widest">Become a Partner</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-5 leading-tight">
              Your garage.{' '}
              <span className="text-orange-400">More customers.</span>
              <br />One smart platform.
            </h2>

            <p className="text-slate-400 leading-relaxed mb-8">
              Join GarageMate and connect with vehicle owners who need your expertise. No setup fees, no contracts — just more business.
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-8">
              {benefits.map((b) => (
                <div key={b.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-orange-500/20"
                    style={{ background: 'rgba(249,115,22,0.10)' }}>
                    <b.icon className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-300">{b.text}</span>
                </div>
              ))}
            </div>

            <Link to="/auth/garage/register"
              className="group inline-flex items-center gap-2 px-7 py-3.5 bg-orange-500 text-white font-bold text-base rounded-xl hover:bg-orange-600 active:bg-orange-700 transition-colors"
              style={{ boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
              Become a Partner
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <div className="mt-5 flex flex-wrap gap-5 text-xs text-slate-500">
              {['No setup fees', 'Flexible pricing', '24/7 support'].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-orange-500/60" /> {item}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right — real garage image card */}
          <motion.div
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
            className="relative hidden lg:block"
          >
            <div className="rounded-2xl overflow-hidden border border-white/10"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
              <img src="/images/av908dsvlh7blcu-n5jjdvitmw.avif"
                alt="Partner garage"
                className="w-full h-72 object-cover object-center" />
              {/* Overlay stats card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl border border-white/10 backdrop-blur-md"
                style={{ background: 'rgba(15,23,42,0.85)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Partner since 2023</p>
                    <p className="text-sm font-semibold text-white">Auto Craft Garage</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-0.5">Monthly requests</p>
                    <p className="text-sm font-bold text-orange-400">120+</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 px-4 py-2 rounded-full border border-orange-500/30"
              style={{ background: 'rgba(249,115,22,0.15)', backdropFilter: 'blur(8px)' }}>
              <span className="text-xs font-bold text-orange-300">✓ Verified Partner</span>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  </section>
);

export default PartnerCTA;
