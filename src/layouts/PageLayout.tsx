import { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StickyCTA } from "@/components/StickyCTA";

export const PageLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        {children}
      </main>
      <Footer />
      <StickyCTA />
    </>
  );
};
