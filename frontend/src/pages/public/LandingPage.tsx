import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import ServicesMarquee from '@/components/landing/ServicesMarquee';
import EmergencyServices from '@/components/landing/EmergencyServices';
import HowItWorks from '@/components/landing/HowItWorks';
import FeaturedGarages from '@/components/landing/FeaturedGarages';
import TrustSection from '@/components/landing/TrustSection';
import PartnerCTA from '@/components/landing/PartnerCTA';
import Footer from '@/components/layout/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <ServicesMarquee />
        <EmergencyServices />
        <HowItWorks />
        <FeaturedGarages />
        <TrustSection />
        <PartnerCTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
