import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, DollarSign } from 'lucide-react';

const PartnerCTA = () => {
  const benefits = [
    { icon: Users, text: 'Reach More Customers', color: 'from-blue-400 to-cyan-400' },
    { icon: TrendingUp, text: 'Grow Your Business', color: 'from-green-400 to-emerald-400' },
    { icon: DollarSign, text: 'Transparent Earnings', color: 'from-yellow-400 to-amber-400' },
  ];

  return (
    <section id="partner" className="py-24 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -bottom-24 -right-24 w-96 h-96 bg-yellow-300/10 rounded-full blur-3xl"
        />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="container-custom relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6 mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight drop-shadow-lg">
              YOUR GARAGE.<br />
              MORE CUSTOMERS.<br />
              ONE SMART PLATFORM.
            </h2>
            <p className="text-xl text-white/95 max-w-2xl mx-auto font-medium drop-shadow-md">
              Join GarageMate and connect with vehicle owners who need your expertise
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
          >
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.text}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/30 hover:bg-white/30 hover:border-white/50 transition-all shadow-lg hover:shadow-xl"
              >
                <div className={`p-2 rounded-full bg-gradient-to-br ${benefit.color}`}>
                  <benefit.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-white">{benefit.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link
              to="/auth/garage/register"
              className="group inline-flex items-center gap-2 px-10 py-5 bg-white text-orange-600 rounded-full font-bold text-lg hover:bg-dark-50 transition-all hover:scale-105 hover:shadow-2xl shadow-xl border-2 border-white/50"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="text-sm text-white/80 mt-6 font-medium">
              ✓ No setup fees  •  ✓ Flexible pricing  •  ✓ 24/7 support
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PartnerCTA;
