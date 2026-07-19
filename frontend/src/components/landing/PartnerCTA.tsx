import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Users, DollarSign } from 'lucide-react';

const PartnerCTA = () => {
  const benefits = [
    { icon: Users, text: 'Reach More Customers' },
    { icon: TrendingUp, text: 'Grow Your Business' },
    { icon: DollarSign, text: 'Transparent Earnings' },
  ];

  return (
    <section id="partner" className="py-24 bg-gradient-to-br from-primary-500 to-primary-600 relative overflow-hidden">
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
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
              YOUR GARAGE.<br />
              MORE CUSTOMERS.<br />
              ONE SMART PLATFORM.
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join GarageMate and connect with vehicle owners who need your expertise
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-12"
          >
            {benefits.map((benefit) => (
              <div key={benefit.text} className="flex items-center gap-2 text-white">
                <benefit.icon className="w-5 h-5" />
                <span className="font-medium">{benefit.text}</span>
              </div>
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
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-full font-semibold text-lg hover:bg-dark-50 transition-all hover:scale-105 hover:shadow-xl"
            >
              Become a Partner
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PartnerCTA;
