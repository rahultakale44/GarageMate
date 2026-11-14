import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, MapPin, CheckCircle, ArrowRight, Clock, Wrench } from 'lucide-react';

const garages = [
  {
    name: 'Patil Auto Care',
    location: 'Pune, Maharashtra',
    distance: '1.2 km',
    rating: 4.5,
    reviews: 42,
    services: ['Bike Repair', 'Car Repair', 'Tyre Service'],
    available: true,
    specialty: 'Two-Wheeler Specialist',
    image: '/images/059leicesterwoodgateworkshop.webp',
  },
  {
    name: 'Sai Tyre Works',
    location: 'Mumbai, Maharashtra',
    distance: '2.5 km',
    rating: 4.7,
    reviews: 68,
    services: ['Tyre Puncture', 'Battery Service', 'Fuel Delivery'],
    available: true,
    specialty: 'Emergency Roadside',
    image: '/images/india-auto-garage-pimpri-pune-garages-mbg1nsetns.avif',
  },
  {
    name: 'Shree Ganesh Motors',
    location: 'Jalgaon, Maharashtra',
    distance: '3.8 km',
    rating: 4.3,
    reviews: 35,
    services: ['Car Repair', 'Engine Repair', 'AC Repair'],
    available: false,
    specialty: 'Full-Service Garage',
    image: '/images/india-garage-and-general-engineering-works-jilha-peth-jalgaon-garages-tf9nu91ki1.avif',
  },
];

const FeaturedGarages = () => (
  <section id="garages" className="py-24" style={{ background: '#0f172a' }}>
    <div className="container-custom">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <span className="inline-block text-xs font-semibold text-orange-500 uppercase tracking-widest mb-3">
          — Partner Garages
        </span>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white max-w-xl leading-tight">
            Verified professionals{' '}
            <span className="text-orange-400">in your neighbourhood</span>
          </h2>
          <Link to="/user/nearby-garages"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors whitespace-nowrap">
            Find Garages Near You <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {garages.map((garage, index) => (
          <motion.div
            key={garage.name}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group flex flex-col rounded-2xl overflow-hidden border border-white/8 hover:border-orange-500/40 transition-all duration-300"
            style={{ background: '#1e293b', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
          >
            {/* Real photo header */}
            <div className="relative h-48 overflow-hidden">
              <img
                src={garage.image}
                alt={garage.name}
                className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient over photo */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(30,41,59,0.95) 0%,rgba(30,41,59,0.3) 60%,transparent 100%)' }} />

              {/* Verified badge */}
              <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-500/30 backdrop-blur-sm"
                style={{ background: 'rgba(0,0,0,0.6)' }}>
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-xs font-semibold text-green-400">Verified</span>
              </div>

              {/* Specialty bottom-left */}
              <div className="absolute bottom-3 left-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-300 px-2.5 py-1 rounded-full border border-orange-500/25"
                  style={{ background: 'rgba(0,0,0,0.65)' }}>
                  <Wrench className="w-3 h-3" />
                  {garage.specialty}
                </span>
              </div>
            </div>

            {/* Card body */}
            <div className="p-5 flex flex-col flex-1">
              {/* Name + rating */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-orange-300 transition-colors">
                    {garage.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {garage.location}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">{garage.rating}</span>
                  <span className="text-xs text-slate-500">({garage.reviews})</span>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-4 mb-4 mt-1 text-xs">
                <span className="flex items-center gap-1 text-slate-400">
                  <MapPin className="w-3.5 h-3.5" /> {garage.distance}
                </span>
                <span className={`flex items-center gap-1.5 font-semibold ${garage.available ? 'text-green-400' : 'text-slate-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${garage.available ? 'bg-green-400' : 'bg-slate-600'}`}
                    style={garage.available ? { boxShadow: '0 0 6px rgba(74,222,128,0.7)' } : undefined} />
                  {garage.available ? 'Available Now' : 'Busy'}
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3 h-3" /> Open
                </span>
              </div>

              {/* Service tags */}
              <div className="flex flex-wrap gap-1.5 mb-5 flex-1">
                {garage.services.map((service) => (
                  <span key={service}
                    className="px-2.5 py-1 text-xs font-medium rounded-full text-slate-400 border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {service}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <Link to="/user/nearby-garages"
                className="block w-full py-2.5 text-center text-sm font-bold text-white rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-colors duration-150"
                style={{ boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}>
                View Garage
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturedGarages;
