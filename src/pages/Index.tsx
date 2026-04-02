import { useState, useCallback } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Reviews } from "@/components/Reviews";
import { About } from "@/components/About";
import { Process } from "@/components/Process";
import { FAQ } from "@/components/FAQ";
import { Contact } from "@/components/Contact";
import { StickyCTA } from "@/components/StickyCTA";
import { Footer } from "@/components/Footer";
import { TrustStrip } from "@/components/TrustStrip";

const Index = () => {
  const [loaded, setLoaded] = useState(false);
  const handleComplete = useCallback(() => setLoaded(true), []);

  return (
    <>
      {!loaded && <LoadingScreen onComplete={handleComplete} />}
      <div style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease-out" }}>
        <Navbar />
        <main>
          <Hero />
          <TrustStrip />
          <Services />
<Process />
          <BeforeAfter />
          <Reviews />
          <FAQ />
          <About />
          <Contact />
        </main>
        <Footer />
        <StickyCTA />
      </div>
    </>
  );
};

export default Index;
