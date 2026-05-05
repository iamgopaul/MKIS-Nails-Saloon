import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import GallerySection from "@/components/sections/GallerySection";
import ServicesSection from "@/components/sections/ServicesSection";
import BookingSection from "@/components/sections/BookingSection";
import ContactSection from "@/components/sections/ContactSection";
import AboutSection from "@/components/sections/AboutSection";
import TrendingSection from "@/components/sections/TrendingSection";
import LiveBackground from "@/components/ui/LiveBackground";
import NotificationToast from "@/components/ui/NotificationToast";

export default function Home() {
  return (
    <>
      <LiveBackground />
      <Navbar />
      <main>
        <HeroSection id="home" />
        <TrendingSection id="trending" />
        <GallerySection id="gallery" />
        <ServicesSection id="services" />
        <AboutSection id="about" />
        <BookingSection id="booking" />
        <ContactSection id="contact" />
      </main>
      <Footer />
      <NotificationToast />
    </>
  );
}
