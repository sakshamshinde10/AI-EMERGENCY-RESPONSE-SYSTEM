import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import DepartmentSection from '../components/landing/DepartmentSection';
import LiveStatsSection from '../components/landing/LiveStatsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#E8602E] selection:text-white">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <DepartmentSection />
        <LiveStatsSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
