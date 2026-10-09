import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import GarageMateLogoIcon from '@/components/shared/GarageMateLogoIcon';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-dark-900 text-white py-16">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="mb-4">
              <GarageMateLogoIcon size={50} showText={true} />
            </div>
            <p className="text-dark-400 text-sm">
              Your trusted platform for roadside assistance and verified local garage services.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-dark-400">
              <li><a href="#services" className="hover:text-primary-500 transition-colors">Services</a></li>
              <li><a href="#garages" className="hover:text-primary-500 transition-colors">Find Garages</a></li>
              <li><a href="#how-it-works" className="hover:text-primary-500 transition-colors">How It Works</a></li>
              <li><a href="#partner" className="hover:text-primary-500 transition-colors">Become a Partner</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Access</h3>
            <ul className="space-y-2 text-sm text-dark-400">
              <li><Link to="/auth/user/login" className="hover:text-primary-500 transition-colors">User Login</Link></li>
              <li><Link to="/auth/garage/login" className="hover:text-primary-500 transition-colors">Garage Owner Login</Link></li>
              <li><Link to="/auth/admin/login" className="hover:text-primary-500 transition-colors">Admin Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-dark-400">
              <li><a href="#" className="hover:text-primary-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary-500 transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-dark-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dark-400">
            © 2024 GarageMate. All rights reserved.
          </p>

          <button
            onClick={scrollToTop}
            className="p-2 bg-dark-800 rounded-full hover:bg-primary-500 transition-colors"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
