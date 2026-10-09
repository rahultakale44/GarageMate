import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import GarageMateLogoIcon from '@/components/shared/GarageMateLogoIcon';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '#services' },
    { label: 'Find Garages', href: '#garages' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Become a Partner', href: '#partner' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 backdrop-blur-lg border-b border-dark-200 py-4'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <motion.div
                animate={{ scale: scrolled ? 0.85 : 1 }}
                transition={{ duration: 0.3 }}
              >
                <GarageMateLogoIcon 
                  size={scrolled ? 45 : 55} 
                  showText={true}
                />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary-500 ${
                    scrolled ? 'text-dark-700' : 'text-white'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                to="/get-started"
                className={`px-6 py-2.5 rounded-full font-medium transition-all hover:scale-105 ${
                  scrolled
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-white text-dark-900 hover:bg-dark-50'
                }`}
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2"
              aria-label="Open menu"
            >
              <Menu className={scrolled ? 'text-dark-900' : 'text-white'} size={24} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white z-[70] lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                {/* Logo in Mobile Menu */}
                <div className="flex items-center mb-6">
                  <GarageMateLogoIcon size={50} showText={true} />
                </div>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-6 right-6 p-2"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>

                <div className="mt-16 space-y-6">
                  {navLinks.map((link, index) => (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-xl font-medium text-dark-900 hover:text-primary-500"
                    >
                      {link.label}
                    </motion.a>
                  ))}

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pt-6 space-y-4"
                  >
                    <Link
                      to="/get-started"
                      className="block w-full py-3 px-6 bg-primary-500 text-white text-center rounded-full font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
