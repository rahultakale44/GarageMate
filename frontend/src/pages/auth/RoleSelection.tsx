import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { User, Store, Shield, ArrowLeft } from 'lucide-react';

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
      color: 'from-primary-500 to-primary-600',
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
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50">
      <div className="container-custom py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-dark-600 hover:text-primary-500 mb-12 transition-colors"
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
                className="group block h-full p-8 bg-white rounded-2xl border-2 border-dark-100 hover:border-primary-500 transition-all hover:shadow-2xl"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${role.color} rounded-xl mb-6 group-hover:scale-110 transition-transform`}>
                  <role.icon className="w-8 h-8 text-white" />
                </div>
                
                <h2 className="text-2xl font-semibold text-dark-900 mb-3 group-hover:text-primary-500 transition-colors">
                  {role.title}
                </h2>
                
                <p className="text-dark-600 mb-6">
                  {role.description}
                </p>

                <div className="flex items-center gap-2 text-primary-500 font-medium group-hover:gap-4 transition-all">
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
