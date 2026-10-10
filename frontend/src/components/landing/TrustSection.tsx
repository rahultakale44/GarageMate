import { motion } from 'framer-motion';
import { Shield, Users, FileCheck, Lock } from 'lucide-react';

const TrustSection = () => {
  const features = [
    {
      icon: Shield,
      title: 'Verified Garages',
      description: 'All partners are thoroughly verified and background checked',
    },
    {
      icon: Users,
      title: 'Real Profiles',
      description: 'Meet actual garage owners and mechanics serving your community',
    },
    {
      icon: FileCheck,
      title: 'Transparent Quotations',
      description: 'Detailed breakdown before any work begins on your vehicle',
    },
    {
      icon: Lock,
      title: 'Secure Payments',
      description: 'OTP-verified completion and encrypted payment processing',
    },
  ];

  return (
    <section className="py-24 bg-dark-900">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
            Built on Trust
          </h2>
          <p className="text-lg text-dark-300 max-w-2xl mx-auto">
            Your safety and satisfaction are our top priorities
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center group hover:scale-105 transition-transform duration-300"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl mb-6 shadow-xl group-hover:shadow-2xl transition-shadow">
                <feature.icon className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">{feature.title}</h3>
              <p className="text-dark-300 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
