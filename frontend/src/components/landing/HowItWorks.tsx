import { motion } from 'framer-motion';
import { MapPin, CheckCircle, Truck, CreditCard } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      icon: MapPin,
      title: 'Share Your Location',
      description: 'Tell us where you are and what issue you\'re facing with your vehicle',
    },
    {
      number: '02',
      icon: CheckCircle,
      title: 'Get Matched',
      description: 'We connect you with nearby verified garages based on your location',
    },
    {
      number: '03',
      icon: Truck,
      title: 'Track Mechanic',
      description: 'See real-time location of the mechanic heading to your location',
    },
    {
      number: '04',
      icon: CreditCard,
      title: 'Repair & Pay',
      description: 'Receive transparent quotation, approve service, and pay securely',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-dark-50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-dark-600 max-w-2xl mx-auto">
            Get help in four simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-primary-200 -translate-x-1/2" />
              )}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-2xl mb-6">
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <div className="mb-4">
                  <span className="text-6xl font-display font-bold text-primary-100">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-dark-900 mb-3">{step.title}</h3>
                <p className="text-dark-600">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
