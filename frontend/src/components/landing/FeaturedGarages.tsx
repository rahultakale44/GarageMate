import { motion } from 'framer-motion';
import { Star, MapPin, Clock, CheckCircle } from 'lucide-react';

const FeaturedGarages = () => {
  const garages = [
    {
      name: 'Patil Auto Care',
      distance: '1.2 km',
      rating: 4.5,
      reviews: 42,
      services: ['Bike Repair', 'Car Repair', 'Tyre Service'],
      availability: 'Open Now',
      verified: true,
    },
    {
      name: 'Sai Tyre Works',
      distance: '2.5 km',
      rating: 4.7,
      reviews: 68,
      services: ['Tyre Puncture', 'Battery Service', 'Fuel Delivery'],
      availability: 'Open Now',
      verified: true,
    },
    {
      name: 'Shree Ganesh Motors',
      distance: '3.8 km',
      rating: 4.3,
      reviews: 35,
      services: ['Car Repair', 'Engine Repair', 'AC Repair'],
      availability: 'Open Now',
      verified: true,
    },
  ];

  return (
    <section id="garages" className="py-24 bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-dark-900 mb-4">
            Featured Local Garages
          </h2>
          <p className="text-lg text-dark-600 max-w-2xl mx-auto">
            Verified professionals in your neighborhood
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {garages.map((garage, index) => (
            <motion.div
              key={garage.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group bg-white border-2 border-dark-100 rounded-2xl overflow-hidden hover:border-primary-500 hover:shadow-xl transition-all"
            >
              <div className="h-48 bg-gradient-to-br from-dark-100 to-dark-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-dark-900/20" />
                {garage.verified && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-medium text-dark-900">Verified</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-dark-900 group-hover:text-primary-500 transition-colors">
                    {garage.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-primary-500 text-primary-500" />
                    <span className="text-sm font-medium text-dark-900">{garage.rating}</span>
                    <span className="text-sm text-dark-500">({garage.reviews})</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm text-dark-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{garage.distance}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-green-600">{garage.availability}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {garage.services.map((service) => (
                    <span
                      key={service}
                      className="px-2 py-1 bg-dark-50 text-xs text-dark-700 rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                </div>

                <button className="w-full py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors">
                  View Garage
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedGarages;
