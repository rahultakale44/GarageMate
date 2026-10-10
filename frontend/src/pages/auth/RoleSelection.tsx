import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Store, Shield, ArrowLeft } from 'lucide-react';
import GarageMateLogoIcon from '@/components/shared/GarageMateLogoIcon';

const RoleSelection = () => {
  const roles = [
    {
      type: 'user',
      icon: User,
      title: 'Continue as User',
      description: 'Find nearby garages, request roadside help, manage your vehicles and track mechanics.',
      route: '/auth/user/login',
      color: 'from-blue-500 to-blue-600',
    },
    {
      type: 'garage',
      icon: Store,
      title: 'Continue as Garage Owner',
      description: 'Register your garage, receive service requests, assign mechanics and manage earnings.',
      route: '/auth/garage/login',
      color: 'from-orange-500 to-orange-600',
    },
    {
      type: 'admin',
      icon: Shield,
      title: 'Continue as Admin',
      description: 'Verify garages, monitor services, manage users, payments and complaints.',
      route: '/auth/admin/login',
      color: 'from-dark-700 to-dark-900',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-orange-100/20">
      {/* Logo in top-left corner */}
      <div className="fixed top-6 left-6 z-50">
        <Link to="/" className="hover:scale-105 transition-transform">
          <GarageMateLogoIcon size={50} showText={true} />
        </Link>
      </div>

      <div className="container-custom py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-dark-600 hover:text-orange-500 mb-12 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold text-dark-900 mb-4">
            Choose Your Role
          </h1>
          <p className="text-lg text-dark-600">
            Select how you'd like to use GarageMate
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {roles.map((role, index) => (
            <motion.div
              key={role.type}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={role.route}
                className="group block h-full p-8 bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-orange-200/50 hover:border-orange-500 transition-all hover:shadow-2xl hover:shadow-orange-500/20"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${role.color} rounded-xl mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <role.icon className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-semibold text-dark-900 mb-3 group-hover:text-orange-500 transition-colors">
                  {role.title}
                </h2>
                
                <p className="text-dark-600 mb-6">
                  {role.description}
                </p>

                <div className="flex items-center gap-2 text-orange-500 font-medium group-hover:gap-4 transition-all">
                  <span>Get Started</span>
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
