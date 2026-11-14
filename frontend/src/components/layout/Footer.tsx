import { Link } from 'react-router-dom';
import { ArrowUp, Mail } from 'lucide-react';
import GarageMateNavLogo from '@/components/shared/GarageMateNavLogo';

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer style={{ background: '#020817' }} className="border-t border-white/8">
      {/* Orange top accent */}
      <div className="h-0.5 bg-orange-500 w-full" />

      <div className="container-custom py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
            <GarageMateNavLogo />
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Your trusted platform for roadside assistance and verified local garage services across India.
            </p>
            <div className="mt-5">
              <a href="mailto:support@garagemate.in"
                className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-orange-400 transition-colors">
                <Mail className="w-3.5 h-3.5" /> support@garagemate.in
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Services',         href: '#services' },
                { label: 'Find Garages',     href: '#garages' },
                { label: 'How It Works',     href: '#how-it-works' },
                { label: 'Become a Partner', href: '#partner' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-slate-500 hover:text-orange-400 transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Account</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'User Login',         to: '/auth/user/login' },
                { label: 'Create Account',     to: '/auth/user/register' },
                { label: 'Garage Owner Login', to: '/auth/garage/login' },
                { label: 'Register Garage',    to: '/auth/garage/register' },
                { label: 'Pro Membership',     to: '/pro' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-slate-500 hover:text-orange-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Refund Policy', 'Contact Us'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-500 hover:text-orange-400 transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} GarageMate. All rights reserved.
          </p>
          <button onClick={scrollToTop}
            className="p-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            style={{ boxShadow: '0 2px 10px rgba(249,115,22,0.3)' }}
            aria-label="Scroll to top">
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
