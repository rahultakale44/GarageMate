import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import GarageMateLogoIcon from '@/components/shared/GarageMateLogoIcon';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white py-16 border-t-2 border-orange-500/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f97316_1px,transparent_1px),linear-gradient(to_bottom,#f97316_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="container-custom relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="mb-4">
              <GarageMateLogoIcon size={50} showText={true} />
            </div>
            <p className="text-dark-400 text-sm leading-relaxed">
              Your trusted platform for roadside assistance and verified local garage services.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-dark-800 border-2 border-orange-500/30 flex items-center justify-center hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:border-orange-400 transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <span className="text-sm font-bold">f</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-dark-800 border-2 border-orange-500/30 flex items-center justify-center hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:border-orange-400 transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <span className="text-sm font-bold">𝕏</span>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-dark-800 border-2 border-orange-500/30 flex items-center justify-center hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:border-orange-400 transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <span className="text-sm font-bold">in</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-orange-400">Quick Links</h3>
            <ul className="space-y-2 text-sm text-dark-400">
              <li><a href="#services" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block">→ Services</a></li>
              <li><a href="#garages" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block">→ Find Garages</a></li>
              <li><a href="#how-it-works" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block">→ How It Works</a></li>
              <li><a href="#partner" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block">→ Become a Partner</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-orange-400">Access</h3>
            <ul className="space-y-2 text-sm text-dark-400">
              <li><Link to="/auth/user/login" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block">→ User Login</Link></li>
              <li><Link to="/auth/garage/login" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block">→ Garage Owner Login</Link></li>
              <li><Link to="/auth/admin/login" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block">→ Admin Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-orange-400">Legal</h3>
            <ul className="space-y-2 text-sm text-dark-400">
              <li><a href="#" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block">→ Privacy Policy</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block">→ Terms of Service</a></li>
              <li><a href="#" className="hover:text-orange-400 transition-colors hover:translate-x-1 inline-block">→ Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t-2 border-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dark-400">
            © 2024 GarageMate. All rights reserved.
          </p>

          <button
            onClick={scrollToTop}
            className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full hover:from-orange-600 hover:to-orange-700 transition-all hover:scale-110 shadow-lg hover:shadow-xl border-2 border-orange-400"
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
