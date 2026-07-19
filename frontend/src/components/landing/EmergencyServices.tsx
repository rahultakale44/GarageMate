import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Wrench, Battery, Car, Fuel, Zap, Truck, Settings, AlertCircle } from 'lucide-react';

const EmergencyServices = () => {
  const services = [
    { icon: Wrench, title: 'Tyre Puncture', number: '01' },
    { icon: Battery, title: 'Battery Jump-Start', number: '02' },
    { icon: Car, title: 'Vehicle Not Starting', number: '03' },
    { icon: Fuel, title: 'Fuel Delivery', number: '04' },
    { icon: Zap, title: 'Electrical Repair', number: '05' },
    { icon: Truck, title: 'Towing Service', number: '06' },
    { icon: Settings, title: 'Engine Assistance', number: '07' },
    { icon: AlertCircle, title: 'Brake Repair', number: '08' },
  ];

  return (
    <section id="services" className="py-24 bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-900 mb-4">
            Emergency Services
          </h2>
          <p className="text-lg text-dark-600 max-w-2xl mx-auto">
            Whatever your roadside emergency, we've got you covered with verified local mechanics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to="/get-started"
                className="group block p-6 bg-white border-2 border-dark-100 rounded-2xl hover:border-primary-500 transition-all hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary-50 rounded-xl group-hover:bg-primary-500 transition-colors">
                    <service.icon className="w-6 h-6 text-primary-500 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-mono text-dark-400 group-hover:text-primary-500 transition-colors">
                    {service.number}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-dark-900 mb-2 group-hover:text-primary-500 transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-dark-600">Quick response from verified local garages</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EmergencyServices;
