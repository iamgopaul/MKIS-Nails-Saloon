import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import GallerySection from "@/components/sections/GallerySection";
import ServicesSection from "@/components/sections/ServicesSection";
import BookingSection from "@/components/sections/BookingSection";
import ContactSection from "@/components/sections/ContactSection";
import AboutSection from "@/components/sections/AboutSection";
import ReviewsSection from "@/components/sections/ReviewsSection";
import ChatWidget from "@/components/ui/ChatWidget";
import SectionDivider from "@/components/ui/SectionDivider";
import SectionTitleSync from "@/components/ui/SectionTitleSync";
import ParticleField from "@/components/ui/ParticleField";

export default function Home() {
  return (
    <>
      <ParticleField />
      <Navbar />
      <main>
        <HeroSection id="home" />
        <SectionDivider />
        <GallerySection id="gallery" />
        <SectionDivider />
        <ServicesSection id="services" />
        <SectionDivider />
        <AboutSection id="about" />
        <SectionDivider />
        <ReviewsSection id="reviews" />
        <SectionDivider />
        <BookingSection id="booking" />
        <SectionDivider />
        <ContactSection id="contact" />
      </main>
      <Footer />
      <ChatWidget />
      <SectionTitleSync />
    </>
  );
}
