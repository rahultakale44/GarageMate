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
              className="group bg-white border-2 border-dark-200 rounded-2xl overflow-hidden hover:border-orange-500 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="h-48 bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/40 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                {garage.verified && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-white rounded-full flex items-center gap-1.5 shadow-lg">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-semibold text-dark-900">Verified</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-semibold text-dark-900 group-hover:text-orange-500 transition-colors">
                    {garage.name}
                  </h3>
                  <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-bold text-dark-900">{garage.rating}</span>
                    <span className="text-xs text-dark-500">({garage.reviews})</span>
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
                      className="px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 text-xs font-medium text-orange-700 rounded-full hover:from-orange-100 hover:to-amber-100 transition-colors"
                    >
                      {service}
                    </span>
                  ))}
                </div>

                <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg transform hover:scale-105">
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
